const fs = require('node:fs');
const path = require('node:path');

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const credentialPath = path.join(__dirname, '../credenciales-roles-local.txt');

function readAccounts() {
  const text = fs.readFileSync(credentialPath, 'utf8');
  const blocks = text.split(/\n\s*\n/).map((block) => Object.fromEntries(
    block.split(/\r?\n/).map((line) => {
      const separator = line.indexOf(': ');
      return separator < 0 ? [] : [line.slice(0, separator), line.slice(separator + 2)];
    }).filter((entry) => entry.length === 2)
  ));
  return Object.fromEntries(blocks.filter((account) => account.Usuario && account.Rol && account.Contraseña)
    .map((account) => [account.Rol, { usuario: account.Usuario, password: account.Contraseña }]));
}

async function request(pathname, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return response;
}

async function main() {
  const accounts = readAccounts();
  for (const role of ['admin', 'consulta', 'registro']) {
    if (!accounts[role]) throw new Error(`No se encontró cuenta local para el rol ${role}.`);
  }

  const page = await fetch(baseUrl);
  const html = await page.text();
  if (!page.ok || !html.includes('id="login-view"') || !html.includes('id="app-view"')) {
    throw new Error('La página local no entregó las vistas de acceso y aplicación.');
  }
  console.log('OK frontend local entrega las vistas de inicio y de rol.');

  const cookies = {};
  for (const role of ['admin', 'consulta', 'registro']) {
    const response = await request('/api/auth/login', {
      method: 'POST', body: { usuario: accounts[role].usuario, password: accounts[role].password }
    });
    if (response.status !== 200) throw new Error(`Login del rol ${role} devolvió HTTP ${response.status}.`);
    const setCookie = response.headers.get('set-cookie') || '';
    const match = setCookie.match(/pay_services_session=([^;]+)/);
    if (!match) throw new Error(`No se recibió cookie de sesión para el rol ${role}.`);
    cookies[role] = `pay_services_session=${match[1]}`;
  }

  const checks = [
    ['admin puede listar', 'admin', 'GET', '/api/pagos', undefined, 200],
    ['admin puede llegar a crear', 'admin', 'POST', '/api/pagos', {}, 400],
    ['admin puede llegar a editar', 'admin', 'PUT', '/api/pagos/1', {}, 400],
    ['consulta puede listar', 'consulta', 'GET', '/api/pagos', undefined, 200],
    ['consulta no puede crear', 'consulta', 'POST', '/api/pagos', {}, 403],
    ['consulta no puede editar', 'consulta', 'PUT', '/api/pagos/1', {}, 403],
    ['consulta no puede eliminar', 'consulta', 'DELETE', '/api/pagos/1', undefined, 403],
    ['registro no puede listar', 'registro', 'GET', '/api/pagos', undefined, 403],
    ['registro puede llegar a crear', 'registro', 'POST', '/api/pagos', {}, 400],
    ['registro no puede editar', 'registro', 'PUT', '/api/pagos/1', {}, 403],
    ['registro no puede eliminar', 'registro', 'DELETE', '/api/pagos/1', undefined, 403]
  ];

  for (const [label, role, method, route, body, expected] of checks) {
    const response = await request(route, { method, cookie: cookies[role], body });
    if (response.status !== expected) throw new Error(`${label}: esperado HTTP ${expected}, recibido ${response.status}.`);
    console.log(`OK ${label} (HTTP ${expected})`);
  }
  console.log('Los tres inicios de sesión funcionan; la prueba no insertó, editó ni eliminó pagos.');
}

main().catch((error) => {
  console.error(`Prueba de roles fallida: ${error.message}`);
  process.exitCode = 1;
});
