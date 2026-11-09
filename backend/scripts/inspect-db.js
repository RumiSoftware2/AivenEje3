require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const { getPool } = require('../src/config/db');

async function main() {
  const pool = getPool();
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const names = tables.map((row) => Object.values(row)[0]);
    console.log(JSON.stringify({ database: process.env.DB_NAME, tables: names }, null, 2));
    for (const table of names) {
      if (!/^[A-Za-z0-9_$]+$/.test(table)) continue;
      const [columns] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
      const [keys] = await pool.execute(
        `SELECT COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
         ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION`, [process.env.DB_NAME, table]
      );
      console.log(JSON.stringify({ table, columns, foreignKeys: keys }, null, 2));
    }
  } finally { await pool.end(); }
}

main().catch((error) => {
  console.error(`No fue posible inspeccionar la base de datos (${error.code || 'error'}). Verifica .env, conectividad y CA de Aiven.`);
  process.exitCode = 1;
});
