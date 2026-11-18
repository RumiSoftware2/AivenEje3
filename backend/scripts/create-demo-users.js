require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('../src/config/db');
const { hashPassword } = require('../src/auth/password');

const accounts = [
  { usuario: 'admin_demo', rol: 'admin' },
  { usuario: 'consulta_demo', rol: 'consulta' },
  { usuario: 'registro_demo', rol: 'registro' }
];
const credentialsPath = path.join(__dirname, '../credenciales-roles-local.txt');

async function main() {
  if (fs.existsSync(credentialsPath)) {
    throw new Error('Ya existe backend/credenciales-roles-local.txt. No se reemplazó ningún archivo.');
  }

  const credentials = accounts.map((account) => ({
    ...account,
    password: crypto.randomBytes(24).toString('base64url')
  }));
  const pool = getPool();
  let wroteFile = false;
  let committed = false;
  try {
    for (const account of credentials) {
      const [rows] = await pool.execute('SELECT id FROM usuarios_app WHERE usuario = ? LIMIT 1', [account.usuario]);
      if (rows.length) throw new Error(`La cuenta ${account.usuario} ya existe; no se cambió su contraseña.`);
    }

    const content = [
      'CUENTAS DE PRUEBA PAY SERVICES - NO SUBIR A GIT NI COMPARTIR',
      'Guarda estas credenciales de forma privada. Las contraseñas solo se muestran una vez aquí.',
      '',
      ...credentials.flatMap(({ usuario, rol, password }) => [`Usuario: ${usuario}`, `Rol: ${rol}`, `Contraseña: ${password}`, ''])
    ].join('\n');
    fs.writeFileSync(credentialsPath, content, { flag: 'wx', mode: 0o600 });
    wroteFile = true;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const account of credentials) {
        const passwordHash = await hashPassword(account.password);
        await connection.execute(
          'INSERT INTO usuarios_app (usuario, password_hash, rol, activo) VALUES (?, ?, ?, 1)',
          [account.usuario, passwordHash, account.rol]
        );
      }
      await connection.commit();
      committed = true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }

    console.log('Creadas las cuentas admin_demo, consulta_demo y registro_demo.');
    console.log('Credenciales guardadas en backend/credenciales-roles-local.txt (archivo ignorado por Git).');
  } catch (error) {
    if (wroteFile && !committed) fs.rmSync(credentialsPath, { force: true });
    throw error;
  } finally { await pool.end(); }
}

main().catch((error) => {
  console.error(`No fue posible crear las cuentas (${error.code || error.message || 'error'}).`);
  process.exitCode = 1;
});
