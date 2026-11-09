const { getPool } = require('../config/db');
const CAMPOS = 'id, cliente, servicio, referencia, valor, fecha_pago, estado';

async function listar() {
  const [rows] = await getPool().execute(`SELECT ${CAMPOS} FROM pagos ORDER BY fecha_pago DESC, id DESC`);
  return rows;
}

async function obtener(id) {
  const [rows] = await getPool().execute(`SELECT ${CAMPOS} FROM pagos WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function crear(pago) {
  const [result] = await getPool().execute(
    'INSERT INTO pagos (cliente, servicio, referencia, valor, fecha_pago, estado) VALUES (?, ?, ?, ?, ?, ?)',
    [pago.cliente, pago.servicio, pago.referencia, pago.valor, pago.fecha_pago, pago.estado]
  );
  return obtener(result.insertId);
}

async function actualizar(id, pago) {
  if (!await obtener(id)) return null;
  await getPool().execute(
    'UPDATE pagos SET cliente = ?, servicio = ?, referencia = ?, valor = ?, fecha_pago = ?, estado = ? WHERE id = ?',
    [pago.cliente, pago.servicio, pago.referencia, pago.valor, pago.fecha_pago, pago.estado, id]
  );
  return obtener(id);
}

async function eliminar(id) {
  const pago = await obtener(id);
  if (!pago) return null;
  await getPool().execute('DELETE FROM pagos WHERE id = ?', [id]);
  return pago;
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
