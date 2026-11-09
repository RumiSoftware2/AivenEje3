const test = require('node:test');
const assert = require('node:assert/strict');
const { validarPago } = require('../src/controllers/pagos.controller');

const validPayment = {
  cliente: 'Cliente de prueba', servicio: 'Internet', referencia: 'TEST-LOCAL-01',
  valor: 85000, fecha_pago: '2026-11-09', estado: 'Pendiente'
};

test('acepta un pago válido', () => assert.equal(validarPago(validPayment), null));
test('rechaza campos obligatorios ausentes', () => assert.match(validarPago({ ...validPayment, cliente: '' }), /obligatorio/));
test('rechaza valores cero y negativos', () => {
  assert.match(validarPago({ ...validPayment, valor: 0 }), /mayor que cero/);
  assert.match(validarPago({ ...validPayment, valor: -1 }), /mayor que cero/);
});
test('rechaza valores con más de dos decimales', () => {
  assert.match(validarPago({ ...validPayment, valor: 12.345 }), /dos decimales/);
});
test('rechaza fechas imposibles y estados inesperados', () => {
  assert.match(validarPago({ ...validPayment, fecha_pago: '2026-02-30' }), /fecha válida/);
  assert.match(validarPago({ ...validPayment, estado: 'Rechazado' }), /estado/);
});
test('rechaza servicios que no están en el formulario', () => {
  assert.match(validarPago({ ...validPayment, servicio: 'Cripto' }), /servicio válido/);
});
