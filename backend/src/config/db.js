const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

function createPool() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Faltan variables: ${missing.join(', ')}`);

  let ssl;
  if ((process.env.DB_SSL || 'true').toLowerCase() === 'true') {
    ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
    if (process.env.DB_CA_PATH) {
      const caPath = path.resolve(__dirname, '../..', process.env.DB_CA_PATH);
      if (!fs.existsSync(caPath)) throw new Error('No se encuentra el certificado CA configurado.');
      ssl.ca = fs.readFileSync(caPath);
    }
  }

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 10000,
    dateStrings: ['DATE']
  });
}

let pool;
function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

async function checkDatabase() {
  const db = getPool();
  await db.query('SELECT 1');
}

module.exports = { getPool, checkDatabase };
