const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../src/auth/password');
const { createToken, readToken } = require('../src/auth/session');
const { requireRole } = require('../src/middleware/auth');

test('guarda contraseñas con hash y valida la contraseña original', async () => {
  const password = 'Clave-de-prueba-8472';
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('clave-incorrecta', hash), false);
});

test('firma y valida sesiones, y rechaza una firma alterada', () => {
  const previous = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = 'test-secret-with-more-than-thirty-two-characters';
  try {
    const token = createToken(17);
    assert.deepEqual(readToken(token), { userId: 17 });
    assert.equal(readToken(`${token.slice(0, -1)}x`), null);
  } finally {
    if (previous === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previous;
  }
});

test('el control de rol permite y rechaza acciones en el servidor', () => {
  const guard = requireRole('admin');
  let nextCalled = false;
  let responseStatus;
  const response = { status(code) { responseStatus = code; return this; }, json(body) { this.body = body; return this; } };
  guard({ user: { rol: 'consulta' } }, response, () => { nextCalled = true; });
  assert.equal(responseStatus, 403);
  assert.equal(nextCalled, false);

  guard({ user: { rol: 'admin' } }, response, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
