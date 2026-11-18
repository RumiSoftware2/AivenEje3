const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);
const HASH_BYTES = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, HASH_BYTES, { maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const [algorithm, salt, expectedHex, extra] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/i.test(salt || '') ||
      !/^[a-f0-9]{128}$/i.test(expectedHex || '') || extra !== undefined) return false;
  const actual = Buffer.from(await scryptAsync(password, salt, HASH_BYTES, { maxmem: 64 * 1024 * 1024 }));
  const expected = Buffer.from(expectedHex, 'hex');
  return timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
