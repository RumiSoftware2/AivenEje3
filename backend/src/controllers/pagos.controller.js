const Pago = require('../models/pagos.model');

const CAMPOS = ['cliente', 'servicio', 'referencia', 'valor', 'fecha_pago', 'estado'];
const SERVICIOS = ['Agua', 'Energía', 'Internet', 'Gas', 'Telefonía', 'Otro'];
const ESTADOS = ['Pendiente', 'Pagado'];

function validarPago(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Envía los datos del pago.';
  for (const campo of CAMPOS) {
    if (body[campo] === undefined || body[campo] === null || String(body[campo]).trim() === '') {
      return `El campo ${campo} es obligatorio.`;
    }
  }
  if (typeof body.cliente !== 'string' || body.cliente.trim().length > 100) return 'El cliente no puede superar 100 caracteres.';
  if (!SERVICIOS.includes(body.servicio)) return 'Selecciona un servicio válido.';
  if (typeof body.referencia !== 'string' || body.referencia.trim().length > 60) return 'La referencia no puede superar 60 caracteres.';
  const valor = Number(body.valor);
  if (!Number.isFinite(valor) || valor <= 0 || valor > 9999999999.99) return 'El valor debe ser mayor que cero.';
  if (Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-7) return 'El valor admite máximo dos decimales.';
  const fecha = new Date(`${body.fecha_pago}T00:00:00.000Z`);
  if (typeof body.fecha_pago !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.fecha_pago) ||
      Number.isNaN(fecha.valueOf()) || fecha.toISOString().slice(0, 10) !== body.fecha_pago) {
    return 'Escribe una fecha válida.';
  }
  if (!ESTADOS.includes(body.estado)) return 'Selecciona un estado válido.';
  return null;
}

function validarId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function datosLimpios(body) {
  return {
    cliente: body.cliente.trim(), servicio: body.servicio,
    referencia: body.referencia.trim(), valor: Number(body.valor),
    fecha_pago: body.fecha_pago, estado: body.estado
  };
}

async function listar(_req, res) {
  try { res.json(await Pago.listar()); }
  catch { res.status(500).json({ error: 'No fue posible consultar los pagos.' }); }
}

async function obtener(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El identificador no es válido.' });
  try {
    const pago = await Pago.obtener(id);
    if (!pago) return res.status(404).json({ error: 'No se encontró el pago.' });
    return res.json(pago);
  } catch { return res.status(500).json({ error: 'No fue posible consultar el pago.' }); }
}

async function crear(req, res) {
  const error = validarPago(req.body);
  if (error) return res.status(400).json({ error });
  try { return res.status(201).json(await Pago.crear(datosLimpios(req.body))); }
  catch { return res.status(500).json({ error: 'No fue posible guardar el pago.' }); }
}

async function actualizar(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El identificador no es válido.' });
  const error = validarPago(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const pago = await Pago.actualizar(id, datosLimpios(req.body));
    if (!pago) return res.status(404).json({ error: 'No se encontró el pago.' });
    return res.json(pago);
  } catch { return res.status(500).json({ error: 'No fue posible actualizar el pago.' }); }
}

async function eliminar(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El identificador no es válido.' });
  try {
    const pago = await Pago.eliminar(id);
    if (!pago) return res.status(404).json({ error: 'No se encontró el pago.' });
    return res.status(204).end();
  } catch { return res.status(500).json({ error: 'No fue posible eliminar el pago.' }); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, validarPago };
