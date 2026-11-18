require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('../src/config/db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '../sql/create-usuarios-app.sql'), 'utf8');
  try {
    await getPool().query(sql);
    console.log('Tabla usuarios_app lista. No se modificó la tabla pagos.');
  } finally {
    await getPool().end();
  }
}

main().catch((error) => {
  console.error(`No fue posible preparar usuarios_app (${error.code || 'error'}).`);
  process.exitCode = 1;
});
