require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const { getPool } = require('../src/config/db');
const Usuarios = require('../src/models/usuarios.model');
const { hashPassword } = require('../src/auth/password');

const ROLES = ['admin', 'consulta', 'registro'];

function readHidden(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    return Promise.reject(new Error('Abre una terminal interactiva de PowerShell para crear usuarios.'));
  }
  process.stdout.write(prompt);
  input.setRawMode(true); input.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      input.setRawMode(false); input.pause(); input.removeListener('data', onData); process.stdout.write('\n');
      error ? reject(error) : resolve(value);
    };
    const onData = (buffer) => {
      const char = buffer.toString('utf8');
      if (char === '\u0003') return finish(new Error('Operación cancelada.'));
      if (char === '\r' || char === '\n') return finish();
      if (char === '\u0008' || char === '\u007f') { value = value.slice(0, -1); return; }
      if (!/[\u0000-\u001f\u007f]/.test(char)) { value += char; process.stdout.write('*'); }
    };
    input.on('data', onData);
  });
}

async function main() {
  const usuario = String(process.argv[2] || '').trim().toLowerCase();
  const rol = String(process.argv[3] || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,80}$/.test(usuario)) throw new Error('Usuario: usa de 3 a 80 letras, números, punto, guion o guion bajo.');
  if (!ROLES.includes(rol)) throw new Error(`Rol inválido. Opciones: ${ROLES.join(', ')}.`);
  const password = await readHidden('Contraseña nueva (mínimo 12 caracteres): ');
  const confirm = await readHidden('Repite la contraseña: ');
  if (password.length < 12 || password.length > 200) throw new Error('La contraseña debe tener entre 12 y 200 caracteres.');
  if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
  try {
    await Usuarios.crear({ usuario, passwordHash: await hashPassword(password), rol });
    console.log(`Cuenta ${usuario} creada con el rol ${rol}.`);
  } finally {
    await getPool().end();
  }
}

main().catch((error) => {
  console.error(`No fue posible crear la cuenta (${error.code || 'revisa los datos y la tabla usuarios_app'}).`);
  process.exitCode = 1;
});
