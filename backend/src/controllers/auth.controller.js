const Usuarios = require('../models/usuarios.model');
const { verifyPassword } = require('../auth/password');
const { COOKIE_NAME, cookieOptions, createToken } = require('../auth/session');

const DUMMY_HASH = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;
const ROLES = ['admin', 'consulta', 'registro'];

async function login(req, res) {
  const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!usuario || !password || usuario.length > 80 || password.length > 200) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  try {
    const account = await Usuarios.buscarPorUsuario(usuario);
    const valid = await verifyPassword(password, account?.password_hash || DUMMY_HASH);
    if (!account || account.activo !== 1 || !valid || !ROLES.includes(account.rol)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    const token = createToken(account.id);
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.json({ user: { id: account.id, usuario: account.usuario, rol: account.rol } });
  } catch (error) {
    if (error.message?.startsWith('SESSION_SECRET')) {
      return res.status(503).json({ error: 'El acceso aún no está configurado en este entorno.' });
    }
    return res.status(503).json({ error: 'No fue posible iniciar sesión. Revisa la conexión e inténtalo de nuevo.' });
  }
}

function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  return res.status(204).end();
}

function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { login, logout, me };
