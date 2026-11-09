require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('../src/config/db');

async function main() {
  const sqlPath = path.join(__dirname, '../sql/create-pagos.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = getPool();
  try {
    await pool.query(sql);
    console.log('Tabla pagos creada o ya existente. No se eliminaron ni modificaron otras tablas.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`No fue posible preparar la tabla pagos (${error.code || 'error'}).`);
  process.exitCode = 1;
});
