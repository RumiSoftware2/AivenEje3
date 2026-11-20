const { createEncryptedBackup } = require('../services/backup.service');

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

async function descargar(req, res) {
  try {
    const { buffer } = await createEncryptedBackup();
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="pay-services-${timestamp()}.psbak"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.status(200).send(buffer);
  } catch (error) {
    if (error.code === 'BACKUP_KEY_MISSING') {
      return res.status(503).json({ error: 'El respaldo cifrado no está configurado en este entorno.' });
    }
    console.error(`No fue posible preparar el respaldo (${error.code || 'error'}).`);
    return res.status(500).json({ error: 'No fue posible crear el respaldo. Inténtalo de nuevo.' });
  }
}

module.exports = { descargar };
