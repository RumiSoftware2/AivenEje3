const Usuarios = require('../models/usuarios.model');
const { COOKIE_NAME, cookieOptions, readCookie, readToken } = require('../auth/session');

async function requireAuth(req, res, next) {
  const token = readToken(readCookie(req));
  if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  try {
    const user = await Usuarios.buscarActivoPorId(token.userId);
    if (!user) {
      res.clearCookie(COOKIE_NAME, cookieOptions());
      return res.status(401).json({ error: 'La sesión ya no es válida. Inicia sesión nuevamente.' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(503).json({ error: 'No fue posible validar la sesión. Inténtalo de nuevo.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Tu rol no tiene permiso para realizar esta acción.' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
