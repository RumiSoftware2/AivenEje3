const crypto = require('node:crypto');
const mysql = require('mysql2');
const { getPool } = require('../config/db');

const MAGIC = Buffer.from('PAYBK001');
const IV_BYTES = 12;
const TAG_BYTES = 16;
const TABLES = ['pagos', 'usuarios_app'];
const RESTORE_REGISTRY = 'restauraciones_prueba';

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
    normalizeCreateSql(item.createSql, table);
  }
  return snapshot;
}

function normalizeCreateSql(createSql, expectedTable, targetTable = expectedTable) {
  const identifier = '(?:`([^`]+)`|"([^"]+)"|([A-Za-z0-9_$]+))';
  const prefix = new RegExp(`^CREATE TABLE\\s+(?:${identifier}\\s*\\.\\s*)?${identifier}\\s*\\(`, 'i');
  const match = prefix.exec(createSql.trim());
  if (!match) throw new Error(`Definición inesperada para ${expectedTable}.`);
  const tableName = match[4] || match[5] || match[6];
  if (tableName !== expectedTable) throw new Error(`Definición inesperada para ${expectedTable}.`);
  const openingParenthesis = match[0].lastIndexOf('(');
  const definition = createSql.trim().slice(openingParenthesis + 1).replace(/"/g, '`');
  // Exclude the source schema so a restore targets the schema selected by Workbench.
  return `CREATE TABLE \`${targetTable}\` (${definition}`;
}

function restoreTableName(id, table) {
  return `psr_${id}_${table}`;
}

function restoreCreateSql(createSql, sourceTable, targetTable, restoreId) {
  let statement = normalizeCreateSql(createSql, sourceTable, targetTable);
  if (/\b(?:FOREIGN\s+KEY|REFERENCES)\b/i.test(statement)) {
    throw new Error('El esquema contiene relaciones que requieren una restauración de esquema dedicada.');
  }
  statement = statement.replace(/\bCONSTRAINT\s+(?:`([^`]+)`|"([^"]+)"|([A-Za-z0-9_$]+))/gi,
    (_whole, backtickName, quoteName, plainName) => `CONSTRAINT \`${backtickName || quoteName || plainName}_r${restoreId}\``);
  return statement;
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

async function createBackupAndRestoreTest() {
  encryptionKey();
  const snapshot = await createSnapshot();
  const buffer = encryptSnapshot(snapshot);
  const restoredSnapshot = decryptBackup(buffer);
  const connection = await getPool().getConnection();
  let restoreId;
  const names = {};
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS \`${RESTORE_REGISTRY}\` (
      id INT NOT NULL AUTO_INCREMENT,
      tabla_pagos VARCHAR(64) NOT NULL,
      tabla_usuarios VARCHAR(64) NOT NULL,
      cantidad_pagos INT UNSIGNED NOT NULL DEFAULT 0,
      cantidad_usuarios INT UNSIGNED NOT NULL DEFAULT 0,
      estado ENUM('en_proceso', 'completa', 'fallida') NOT NULL DEFAULT 'en_proceso',
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const [insertResult] = await connection.execute(
      `INSERT INTO \`${RESTORE_REGISTRY}\` (tabla_pagos, tabla_usuarios, cantidad_pagos, cantidad_usuarios, estado)
       VALUES ('pendiente', 'pendiente', ?, ?, 'en_proceso')`,
      [restoredSnapshot.tables.pagos.rows.length, restoredSnapshot.tables.usuarios_app.rows.length]
    );
    restoreId = insertResult.insertId;
    names.pagos = restoreTableName(restoreId, 'pagos');
    names.usuarios_app = restoreTableName(restoreId, 'usuarios_app');
    await connection.execute(
      `UPDATE \`${RESTORE_REGISTRY}\` SET tabla_pagos = ?, tabla_usuarios = ? WHERE id = ?`,
      [names.pagos, names.usuarios_app, restoreId]
    );

    for (const table of TABLES) {
      const ddl = restoreCreateSql(restoredSnapshot.tables[table].createSql, table, names[table], restoreId);
      await connection.query(ddl);
    }

    await connection.beginTransaction();
    for (const table of TABLES) {
      const rows = restoredSnapshot.tables[table].rows;
      if (!rows.length) continue;
      const columns = Object.keys(rows[0]);
      const sql = `INSERT INTO ${mysql.escapeId(names[table])} (${columns.map((column) => mysql.escapeId(column)).join(', ')}) ` +
        `VALUES (${columns.map(() => '?').join(', ')})`;
      for (const row of rows) await connection.execute(sql, columns.map((column) => row[column]));
    }

    for (const table of TABLES) {
      const [[countRow]] = await connection.query(`SELECT COUNT(*) AS total FROM ${mysql.escapeId(names[table])}`);
      if (Number(countRow.total) !== restoredSnapshot.tables[table].rows.length) {
        throw new Error(`La verificación de filas restauradas falló para ${table}.`);
      }
    }
    await connection.execute(`UPDATE \`${RESTORE_REGISTRY}\` SET estado = 'completa' WHERE id = ?`, [restoreId]);
    await connection.commit();
    return { buffer, restoreId, names, counts: {
      pagos: restoredSnapshot.tables.pagos.rows.length,
      usuarios_app: restoredSnapshot.tables.usuarios_app.rows.length
    } };
  } catch (error) {
    try { await connection.rollback(); } catch { /* preserve original failure */ }
    if (restoreId) {
      try { await connection.execute(`UPDATE \`${RESTORE_REGISTRY}\` SET estado = 'fallida' WHERE id = ?`, [restoreId]); }
      catch { /* preserve original failure */ }
    }
    throw error;
  } finally { connection.release(); }
}

async function listRestorations() {
  try {
    const [rows] = await getPool().execute(
      `SELECT id, tabla_pagos, tabla_usuarios, cantidad_pagos, cantidad_usuarios, estado, creado_en
       FROM \`${RESTORE_REGISTRY}\` ORDER BY id DESC LIMIT 50`
    );
    return rows;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return [];
    throw error;
  }
}

async function getRestoredPayments(id) {
  const [rows] = await getPool().execute(
    `SELECT tabla_pagos FROM \`${RESTORE_REGISTRY}\` WHERE id = ? AND estado = 'completa' LIMIT 1`, [id]
  );
  const table = rows[0]?.tabla_pagos;
  if (!table || table !== restoreTableName(id, 'pagos')) return null;
  const [payments] = await getPool().query(
    `SELECT id, cliente, servicio, referencia, valor, fecha_pago, estado FROM ${mysql.escapeId(table)} ORDER BY id`
  );
  return payments;
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
    statements.push(`${normalizeCreateSql(createSql, table)};`);
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

module.exports = {
  createBackupAndRestoreTest, createEncryptedBackup, decryptBackup, encryptSnapshot,
  getRestoredPayments, normalizeCreateSql, listRestorations, restoreCreateSql,
  toRestoreSql, validateSnapshot
};
