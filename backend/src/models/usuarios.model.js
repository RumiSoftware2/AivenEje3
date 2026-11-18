const { getPool } = require('../config/db');

async function buscarPorUsuario(usuario) {
  const [rows] = await getPool().execute(
    'SELECT id, usuario, password_hash, rol, activo FROM usuarios_app WHERE usuario = ? LIMIT 1',
    [usuario]
  );
  return rows[0] || null;
}

async function buscarActivoPorId(id) {
  const [rows] = await getPool().execute(
    'SELECT id, usuario, rol FROM usuarios_app WHERE id = ? AND activo = 1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function crear({ usuario, passwordHash, rol }) {
  const [result] = await getPool().execute(
    'INSERT INTO usuarios_app (usuario, password_hash, rol, activo) VALUES (?, ?, ?, 1)',
    [usuario, passwordHash, rol]
  );
  return result.insertId;
}

module.exports = { buscarPorUsuario, buscarActivoPorId, crear };
