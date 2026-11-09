const express = require('express');
const path = require('node:path');
const { checkDatabase } = require('./config/db');
const pagosRoutes = require('./routes/pagos.routes');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await checkDatabase();
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api/pagos', pagosRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta API no encontrada.' }));
app.use(express.static(path.resolve(__dirname, '../../frontend')));
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'El cuerpo JSON no es válido.' });
  }
  console.error('Error interno de solicitud.');
  return res.status(500).json({ error: 'Ocurrió un error interno.' });
});

module.exports = app;
