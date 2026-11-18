const { createHmac, timingSafeEqual } = require('node:crypto');

const COOKIE_NAME = 'pay_services_session';
const SESSION_SECONDS = 8 * 60 * 60;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
  return secret;
}

function signature(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function createToken(userId) {
  const encoded = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }))
    .toString('base64url');
  return `${encoded}.${signature(encoded)}`;
}

function readToken(token) {
  if (typeof token !== 'string') return null;
  const [encoded, received, extra] = token.split('.');
  if (!encoded || !received || extra !== undefined) return null;
  let expected;
  try { expected = Buffer.from(signature(encoded)); } catch { return null; }
  const actual = Buffer.from(received);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(payload.sub) || payload.sub < 1 ||
        !Number.isSafeInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.sub };
  } catch { return null; }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS * 1000
  };
}

function readCookie(req) {
  const prefix = `${COOKIE_NAME}=`;
  const entry = (req.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

module.exports = { COOKIE_NAME, cookieOptions, createToken, readCookie, readToken };
