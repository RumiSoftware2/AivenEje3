const crypto = require('node:crypto');
const mysql = require('mysql2');
const { getPool } = require('../config/db');

const MAGIC = Buffer.from('PAYBK001');
const IV_BYTES = 12;
const TAG_BYTES = 16;
const TABLES = ['pagos', 'usuarios_app'];

function encryptionKey() {
  const value = process.env.BACKUP_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    const error = new Error('BACKUP_ENCRYPTION_KEY debe contener 64 caracteres hexadecimales.');
    error.code = 'BACKUP_KEY_MISSING';
    throw error;
  }
  return Buffer.from(value, 'hex');
}

function encryptSnapshot(snapshot) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(snapshot), 'utf8'), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), ciphertext]);
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.format !== 'pay-services-backup-v1' || !snapshot.tables) {
    throw new Error('El respaldo no tiene el formato esperado.');
  }
  for (const table of TABLES) {
    const item = snapshot.tables[table];
    if (!item || typeof item.createSql !== 'string' || !Array.isArray(item.rows)) {
      throw new Error(`El respaldo no contiene la tabla ${table} correctamente.`);
    }
    const expected = new RegExp('^CREATE TABLE\\s+`?' + table + '`?\\s*\\(', 'i');
    if (!expected.test(item.createSql.trim())) throw new Error(`Definición inesperada para ${table}.`);
  }
  return snapshot;
}

function decryptBackup(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length <= MAGIC.length + IV_BYTES + TAG_BYTES ||
      !buffer.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('El archivo no es un respaldo Pay Services reconocido.');
  }
  const ivStart = MAGIC.length;
  const tagStart = ivStart + IV_BYTES;
  const dataStart = tagStart + TAG_BYTES;
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), buffer.subarray(ivStart, tagStart));
  decipher.setAuthTag(buffer.subarray(tagStart, dataStart));
  const plaintext = Buffer.concat([decipher.update(buffer.subarray(dataStart)), decipher.final()]);
  return validateSnapshot(JSON.parse(plaintext.toString('utf8')));
}

async function createSnapshot() {
  const connection = await getPool().getConnection();
  try {
    await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
    const tables = {};
    for (const table of TABLES) {
      const [definitions] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      const createSql = definitions[0]?.['Create Table'];
      if (!createSql) throw new Error(`No se pudo leer la estructura de ${table}.`);
      const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY 1`);
      tables[table] = { createSql, rows };
    }
    await connection.commit();
    return validateSnapshot({
      format: 'pay-services-backup-v1',
      createdAt: new Date().toISOString(),
      sourceDatabase: process.env.DB_NAME || 'configured-database',
      tables
    });
  } catch (error) {
    try { await connection.rollback(); } catch { /* preserve original failure */ }
    throw error;
  } finally { connection.release(); }
}

async function createEncryptedBackup() {
  encryptionKey();
  const snapshot = await createSnapshot();
  return { buffer: encryptSnapshot(snapshot), snapshot };
}

function toRestoreSql(snapshot) {
  validateSnapshot(snapshot);
  const statements = [
    '-- Pay Services: restaurar solo en un esquema de prueba vacío.',
    `-- Respaldo generado: ${snapshot.createdAt}`,
    '-- Este archivo incluye hashes de acceso; protégelo y elimínalo después de validar.',
    'SET FOREIGN_KEY_CHECKS = 0;'
  ];
  for (const table of TABLES) {
    const { createSql, rows } = snapshot.tables[table];
    statements.push(`${createSql};`);
    for (const row of rows) {
      const columns = Object.keys(row);
      if (!columns.length) continue;
      const names = columns.map((name) => mysql.escapeId(name)).join(', ');
      const values = columns.map((name) => mysql.escape(row[name])).join(', ');
      statements.push(`INSERT INTO ${mysql.escapeId(table)} (${names}) VALUES (${values});`);
    }
  }
  statements.push('SET FOREIGN_KEY_CHECKS = 1;');
  return `${statements.join('\n\n')}\n`;
}

module.exports = { createEncryptedBackup, decryptBackup, encryptSnapshot, toRestoreSql, validateSnapshot };
