const { createBackupAndRestoreTest, getRestoredPayments, listRestorations } = require('../services/backup.service');

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

async function descargar(req, res) {
  try {
    const result = await createBackupAndRestoreTest();
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="pay-services-${timestamp()}.psbak"`,
      'Content-Length': String(result.buffer.length),
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'X-Restore-Id': String(result.restoreId),
      'X-Restore-Payments-Table': result.names.pagos,
      'X-Restore-Users-Table': result.names.usuarios_app,
      'X-Restore-Payments-Count': String(result.counts.pagos),
      'X-Restore-Users-Count': String(result.counts.usuarios_app)
    });
    return res.status(200).send(result.buffer);
  } catch (error) {
    if (error.code === 'BACKUP_KEY_MISSING') {
      return res.status(503).json({ error: 'El respaldo cifrado no está configurado en este entorno.' });
    }
    console.error(`No fue posible preparar el respaldo (${error.code || 'error'}).`);
    return res.status(500).json({ error: 'No fue posible crear el respaldo. Inténtalo de nuevo.' });
  }
}

async function listarRestauraciones(_req, res) {
  try { return res.json(await listRestorations()); }
  catch {
    return res.status(500).json({ error: 'No fue posible consultar el historial de restauraciones.' });
  }
}

function validarId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function verPagosRestaurados(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El identificador de restauración no es válido.' });
  try {
    const payments = await getRestoredPayments(id);
    if (!payments) return res.status(404).json({ error: 'No se encontró una restauración completa.' });
    return res.json(payments);
  } catch {
    return res.status(500).json({ error: 'No fue posible consultar los pagos restaurados.' });
  }
}

module.exports = { descargar, listarRestauraciones, verPagosRestaurados };
