require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const fs = require('node:fs');
const path = require('node:path');
const { decryptBackup, toRestoreSql } = require('../src/services/backup.service');

function main() {
  const source = process.argv[2];
  if (!source) throw new Error('Indica la ruta del archivo .psbak descargado.');
  const inputPath = path.resolve(process.cwd(), source);
  if (!fs.existsSync(inputPath) || !inputPath.toLowerCase().endsWith('.psbak')) {
    throw new Error('No se encontró un archivo .psbak válido en esa ruta.');
  }
  const snapshot = decryptBackup(fs.readFileSync(inputPath));
  const outputDir = path.resolve(__dirname, '../../tmp/restore');
  fs.mkdirSync(outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const outputPath = path.join(outputDir, `pay-services-restore-${stamp}.sql`);
  fs.writeFileSync(outputPath, toRestoreSql(snapshot), { flag: 'wx' });
  console.log(`SQL de restauración preparado: ${outputPath}`);
  for (const [table, data] of Object.entries(snapshot.tables)) {
    console.log(`${table}: ${data.rows.length} filas incluidas.`);
  }
  console.log('Importa este archivo solo en un esquema local de prueba vacío; nunca en defaultdb.');
  console.log('El SQL temporal contiene hashes de acceso. Protégelo y elimínalo cuando termines la verificación.');
}

try { main(); }
catch (error) {
  console.error(`No fue posible preparar la restauración (${error.message || 'error'}).`);
  process.exitCode = 1;
}
