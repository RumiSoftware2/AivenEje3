require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const baseUrl = `http://127.0.0.1:${Number(process.env.PORT) || 3000}/api/pagos`;
const reference = `PS-TEST-${Date.now()}`;
let paymentId;

async function call(method, id = '', body) {
  const response = await fetch(`${baseUrl}${id ? `/${id}` : ''}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}

function expect(condition, label) {
  if (!condition) throw new Error(`Falló: ${label}`);
  console.log(`OK: ${label}`);
}

async function main() {
  try {
    const initial = { cliente: 'Prueba técnica Pay Services', servicio: 'Internet', referencia: reference, valor: 85000, fecha_pago: '2026-11-09', estado: 'Pendiente' };
    const created = await call('POST', '', initial);
    expect(created.response.status === 201 && Number.isInteger(created.data.id), 'crear pago (POST 201)');
    paymentId = created.data.id;

    const fetched = await call('GET', paymentId);
    expect(fetched.response.status === 200 && fetched.data.referencia === reference, 'consultar pago (GET 200)');
    const listed = await call('GET');
    expect(listed.response.status === 200 && listed.data.some((payment) => payment.id === paymentId), 'listar pago persistido (GET 200)');

    const updatedBody = { ...initial, estado: 'Pagado', valor: 87000 };
    const updated = await call('PUT', paymentId, updatedBody);
    expect(updated.response.status === 200 && updated.data.estado === 'Pagado', 'actualizar pago (PUT 200)');
    const reread = await call('GET', paymentId);
    expect(reread.response.status === 200 && Number(reread.data.valor) === 87000, 'leer cambios guardados en MySQL');

    const removed = await call('DELETE', paymentId);
    expect(removed.response.status === 204, 'eliminar pago (DELETE 204)');
    const missing = await call('GET', paymentId);
    expect(missing.response.status === 404, 'confirmar ausencia tras eliminar (GET 404)');
    paymentId = undefined;
  } finally {
    if (paymentId) {
      const cleanup = await call('DELETE', paymentId).catch(() => null);
      if (cleanup?.response.status === 204) console.log('Limpieza del registro de prueba completada.');
    }
  }
}

main().catch((error) => {
  console.error(`La prueba CRUD no terminó correctamente: ${error.message}`);
  process.exitCode = 1;
});
