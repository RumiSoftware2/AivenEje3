const test = require('node:test');
const assert = require('node:assert/strict');

const KEY = 'a'.repeat(64);
const tables = {
  pagos: { createSql: 'CREATE TABLE "defaultdb"."pagos" (\n  "id" int NOT NULL)', rows: [{ id: 1, cliente: "O'Neil", servicio: 'Agua' }] },
  usuarios_app: { createSql: 'CREATE TABLE "defaultdb"."usuarios_app" (\n  "id" int NOT NULL)', rows: [{ id: 2, usuario: 'admin', password_hash: 'hash' }] }
};

test('cifra y descifra respaldo autenticado', () => {
  process.env.BACKUP_ENCRYPTION_KEY = KEY;
  const backup = require('../src/services/backup.service');
  const snapshot = { format: 'pay-services-backup-v1', createdAt: '2026-11-19T00:00:00.000Z', tables };
  const encrypted = backup.encryptSnapshot(snapshot);
  assert.equal(encrypted.subarray(0, 8).toString(), 'PAYBK001');
  assert.deepEqual(backup.decryptBackup(encrypted), snapshot);
});

test('rechaza respaldo alterado y claves inválidas', () => {
  process.env.BACKUP_ENCRYPTION_KEY = KEY;
  const backup = require('../src/services/backup.service');
  const encrypted = backup.encryptSnapshot({ format: 'pay-services-backup-v1', createdAt: 'x', tables });
  encrypted[encrypted.length - 1] ^= 1;
  assert.throws(() => backup.decryptBackup(encrypted));
  process.env.BACKUP_ENCRYPTION_KEY = 'invalid';
  assert.throws(() => backup.decryptBackup(encrypted), /64 caracteres/);
  process.env.BACKUP_ENCRYPTION_KEY = KEY;
});

test('prepara SQL con inserts escapados y sin operaciones destructivas', () => {
  process.env.BACKUP_ENCRYPTION_KEY = KEY;
  const backup = require('../src/services/backup.service');
  const sql = backup.toRestoreSql({ format: 'pay-services-backup-v1', createdAt: 'x', tables });
  assert.match(sql, /CREATE TABLE `pagos`/);
  assert.doesNotMatch(sql, /`defaultdb`/);
  assert.match(sql, /INSERT INTO `pagos`/);
  assert.match(sql, /O\\'Neil/);
  assert.doesNotMatch(sql, /DROP\s+(TABLE|DATABASE)/i);
});

test('crea definiciones para tablas nuevas sin calificar con el esquema de origen', () => {
  const backup = require('../src/services/backup.service');
  const ddl = backup.restoreCreateSql(
    'CREATE TABLE "defaultdb"."pagos" (\n  "id" int NOT NULL,\n  CONSTRAINT "chk_pago" CHECK ("id" > 0))',
    'pagos', 'psr_42_pagos', 42
  );
  assert.match(ddl, /^CREATE TABLE `psr_42_pagos`/);
  assert.match(ddl, /CONSTRAINT `chk_pago_r42`/);
  assert.doesNotMatch(ddl, /`defaultdb`/);
});
