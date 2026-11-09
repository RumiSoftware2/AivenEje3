const form = document.querySelector('#payment-form');
const list = document.querySelector('#payment-list');
const message = document.querySelector('#message');
const count = document.querySelector('#payment-count');
const loading = document.querySelector('#loading');
const empty = document.querySelector('#empty-state');
const submit = document.querySelector('#submit-button');
const cancel = document.querySelector('#cancel-button');

let editingId = null;
const formatMoney = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const formatDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No fue posible completar la solicitud.');
  return data;
}

function showMessage(text, error = false) {
  message.textContent = text;
  message.className = error ? 'message error' : 'message success';
  message.hidden = false;
  window.setTimeout(() => { message.hidden = true; }, 4000);
}

function addCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.append(cell);
}

function renderPayments(payments) {
  list.replaceChildren();
  count.textContent = payments.length;
  empty.hidden = payments.length !== 0;

  for (const payment of payments) {
    const row = document.createElement('tr');
    const date = new Date(`${String(payment.fecha_pago).slice(0, 10)}T00:00:00Z`);
    addCell(row, payment.cliente);
    addCell(row, payment.servicio);
    addCell(row, payment.referencia);
    addCell(row, formatDate.format(date));
    addCell(row, formatMoney.format(Number(payment.valor)));
    addCell(row, payment.estado);

    const actions = document.createElement('td');
    const edit = document.createElement('button');
    edit.className = 'button button-small';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => editPayment(payment.id));
    const remove = document.createElement('button');
    remove.className = 'button button-small button-danger';
    remove.textContent = 'Eliminar';
    remove.addEventListener('click', () => deletePayment(payment));
    actions.append(edit, remove);
    row.append(actions);
    list.append(row);
  }
}

async function loadPayments() {
  loading.hidden = false;
  empty.hidden = true;
  try { renderPayments(await api('/api/pagos')); }
  catch (error) { showMessage(error.message, true); }
  finally { loading.hidden = true; }
}

function resetForm() {
  form.reset();
  editingId = null;
  document.querySelector('#form-title').textContent = 'Registrar pago';
  submit.textContent = 'Guardar pago';
  cancel.hidden = true;
}

async function editPayment(id) {
  try {
    const payment = await api(`/api/pagos/${id}`);
    for (const field of ['cliente', 'servicio', 'referencia', 'valor', 'fecha_pago', 'estado']) {
      form.elements[field].value = field === 'fecha_pago' ? String(payment[field]).slice(0, 10) : payment[field];
    }
    editingId = id;
    document.querySelector('#form-title').textContent = 'Actualizar pago';
    submit.textContent = 'Actualizar pago';
    cancel.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { showMessage(error.message, true); }
}

async function deletePayment(payment) {
  if (!window.confirm(`¿Eliminar el pago de ${payment.cliente}?`)) return;
  try {
    await api(`/api/pagos/${payment.id}`, { method: 'DELETE' });
    if (editingId === payment.id) resetForm();
    showMessage('Pago eliminado.');
    await loadPayments();
  } catch (error) { showMessage(error.message, true); }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  data.valor = Number(data.valor);
  const method = editingId ? 'PUT' : 'POST';

  submit.disabled = true;
  try {
    await api(editingId ? `/api/pagos/${editingId}` : '/api/pagos', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    showMessage(editingId ? 'Pago actualizado.' : 'Pago guardado.');
    resetForm();
    await loadPayments();
  } catch (error) { showMessage(error.message, true); }
  finally { submit.disabled = false; }
});

cancel.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', loadPayments);
loadPayments();
