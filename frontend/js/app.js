const loginView = document.querySelector('#login-view');
const appView = document.querySelector('#app-view');
const loginForm = document.querySelector('#login-form');
const loginButton = document.querySelector('#login-button');
const loginMessage = document.querySelector('#login-message');
const roleTitle = document.querySelector('#role-title');
const roleDescription = document.querySelector('#role-description');
const appMessage = document.querySelector('#app-message');
const form = document.querySelector('#payment-form');
const formCard = document.querySelector('#payment-form-card');
const listCard = document.querySelector('#payment-list-card');
const backupCard = document.querySelector('#backup-card');
const backupButton = document.querySelector('#backup-button');
const backupStatus = document.querySelector('#backup-status');
const restoreHistoryList = document.querySelector('#restore-history-list');
const restoreHistoryEmpty = document.querySelector('#restore-history-empty');
const restoreDetails = document.querySelector('#restore-details');
const restoredPaymentsList = document.querySelector('#restored-payments-list');
const list = document.querySelector('#payment-list');
const count = document.querySelector('#payment-count');
const loading = document.querySelector('#loading');
const empty = document.querySelector('#empty-state');
const submit = document.querySelector('#submit-button');
const cancel = document.querySelector('#cancel-button');
const connectButton = document.querySelector('#connect-server-button');
const serverStatus = document.querySelector('#server-status');
const actionsHeading = document.querySelector('#actions-heading');

let editingId = null;
let connecting = false;
let currentUser = null;
const formatMoney = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const formatDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) showLogin(data.error || 'Tu sesión terminó. Inicia sesión nuevamente.');
  if (!response.ok) throw new Error(data.error || 'No fue posible completar la solicitud.');
  return data;
}

function showMessage(text, error = false, target = appMessage) {
  target.textContent = text;
  target.className = error ? 'message error' : 'message success';
  target.hidden = false;
  window.setTimeout(() => { target.hidden = true; }, 5000);
}

function showLogin(text = '') {
  currentUser = null;
  appView.hidden = true;
  loginView.hidden = false;
  resetForm();
  if (text) showMessage(text, true, loginMessage);
}

function enterApp(user) {
  currentUser = user;
  loginView.hidden = true;
  appView.hidden = false;
  appMessage.hidden = true;
  roleTitle.textContent = `${user.usuario} · ${roleName(user.rol)}`;
  roleDescription.textContent = roleDescriptionText(user.rol);
  formCard.hidden = user.rol === 'consulta';
  listCard.hidden = user.rol === 'registro';
  backupCard.hidden = user.rol !== 'admin';
  actionsHeading.hidden = user.rol !== 'admin';
  document.querySelector('#refresh-button').hidden = user.rol === 'registro';
  document.querySelector('#form-title').textContent = user.rol === 'registro' ? 'Agregar pago' : 'Registrar pago';
  submit.textContent = 'Guardar pago';
  cancel.hidden = true;
  if (user.rol === 'admin' || user.rol === 'consulta') loadPayments();
  if (user.rol === 'admin') loadRestorations();
}

function roleName(role) {
  return ({ admin: 'Administrador', consulta: 'Consulta', registro: 'Registro' })[role] || 'Usuario';
}

function roleDescriptionText(role) {
  return ({
    admin: 'Puede consultar y administrar todos los pagos.',
    consulta: 'Puede consultar los pagos; las acciones de edición están deshabilitadas.',
    registro: 'Puede agregar pagos; no puede consultar ni modificar los registros existentes.'
  })[role] || '';
}

function addCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.append(cell);
  return cell;
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

    const actions = addCell(row, '');
    actions.hidden = currentUser?.rol !== 'admin';
    if (currentUser?.rol === 'admin') {
      const edit = document.createElement('button');
      edit.className = 'button button-small';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => editPayment(payment.id));
      const remove = document.createElement('button');
      remove.className = 'button button-small button-danger';
      remove.textContent = 'Eliminar';
      remove.addEventListener('click', () => deletePayment(payment));
      actions.append(edit, remove);
    }
    list.append(row);
  }
}

async function loadPayments() {
  if (!currentUser || currentUser.rol === 'registro') return;
  loading.hidden = false;
  empty.hidden = true;
  try { renderPayments(await api('/api/pagos')); }
  catch (error) { showMessage(error.message, true); }
  finally { loading.hidden = true; }
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function connectServer() {
  if (connecting) return;
  connecting = true;
  connectButton.disabled = true;
  try {
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      serverStatus.textContent = `Conectando servidor y Aiven (intento ${attempt} de 8)...`;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch('/api/health', { cache: 'no-store', signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.status === 'ok' && data.database === 'connected') {
          serverStatus.textContent = 'Servidor y base de datos conectados.';
          if (currentUser) await loadPayments();
          else showMessage('Conexión disponible. Inicia sesión.', false, loginMessage);
          return;
        }
        if (data?.database === 'unavailable') {
          serverStatus.textContent = 'El servidor respondió, pero la base de datos no está disponible.';
          showMessage('No fue posible conectar con la base de datos.', true, currentUser ? appMessage : loginMessage);
          return;
        }
        if (response.status !== 502 && response.status !== 503) {
          serverStatus.textContent = `El servidor respondió con HTTP ${response.status}.`;
          return;
        }
      } catch {
        // El servidor gratuito puede tardar en despertar.
      } finally { window.clearTimeout(timeout); }
      if (attempt < 8) await wait(5000);
    }
    serverStatus.textContent = 'El servidor aún no responde. Espera y vuelve a intentarlo.';
  } finally {
    connecting = false;
    connectButton.disabled = false;
  }
}

async function downloadBackup() {
  if (currentUser?.rol !== 'admin' || backupButton.disabled) return;
  backupButton.disabled = true;
  backupStatus.textContent = 'Creando y cifrando la copia…';
  try {
    const response = await fetch('/api/backups', { method: 'POST', credentials: 'same-origin' });
    if (response.status === 401) {
      showLogin('Tu sesión terminó. Inicia sesión nuevamente.');
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'No fue posible crear la copia.');
    }
    const file = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const name = disposition.match(/filename="([^"]+)"/)?.[1] || 'pay-services-backup.psbak';
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    const restoreId = response.headers.get('x-restore-id');
    const paymentsTable = response.headers.get('x-restore-payments-table');
    const usersTable = response.headers.get('x-restore-users-table');
    const paymentsCount = response.headers.get('x-restore-payments-count');
    const usersCount = response.headers.get('x-restore-users-count');
    if (!restoreId || !paymentsTable || !usersTable) throw new Error('Se descargó una respuesta sin confirmación de restauración. Actualiza el historial y revisa Render.');
    backupStatus.textContent = `Copia cifrada descargada. Restauración #${restoreId} verificada: ${paymentsCount} pagos en ${paymentsTable} y ${usersCount} cuentas en ${usersTable}.`;
    showMessage(`Copia descargada y restauración #${restoreId} verificada.`);
    await loadRestorations();
  } catch (error) {
    backupStatus.textContent = 'No se pudo crear la copia. Revisa la configuración y vuelve a intentar.';
    showMessage(error.message, true);
  } finally { backupButton.disabled = false; }
}

function renderRestorations(restorations) {
  restoreHistoryList.replaceChildren();
  restoreHistoryEmpty.hidden = restorations.length !== 0;
  for (const item of restorations) {
    const row = document.createElement('tr');
    addCell(row, item.id);
    const date = new Date(item.creado_en);
    addCell(row, Number.isNaN(date.valueOf()) ? String(item.creado_en) : new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(date));
    addCell(row, item.estado);
    addCell(row, item.cantidad_pagos);
    addCell(row, item.cantidad_usuarios);
    const action = addCell(row, '');
    if (item.estado === 'completa') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button-small';
      button.textContent = 'Ver pagos';
      button.addEventListener('click', () => viewRestoredPayments(item.id));
      action.append(button);
    }
    restoreHistoryList.append(row);
  }
}

async function loadRestorations() {
  if (currentUser?.rol !== 'admin') return;
  try { renderRestorations(await api('/api/backups/restauraciones')); }
  catch (error) { showMessage(error.message, true); }
}

async function viewRestoredPayments(id) {
  if (currentUser?.rol !== 'admin') return;
  try {
    const payments = await api(`/api/backups/restauraciones/${id}/pagos`);
    restoredPaymentsList.replaceChildren();
    for (const payment of payments) {
      const row = document.createElement('tr');
      addCell(row, payment.id);
      addCell(row, payment.cliente);
      addCell(row, payment.servicio);
      addCell(row, payment.referencia);
      const date = new Date(`${String(payment.fecha_pago).slice(0, 10)}T00:00:00Z`);
      addCell(row, formatDate.format(date));
      addCell(row, formatMoney.format(Number(payment.valor)));
      addCell(row, payment.estado);
      restoredPaymentsList.append(row);
    }
    restoreDetails.hidden = false;
    restoreDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) { showMessage(error.message, true); }
}

function resetForm() {
  form.reset();
  editingId = null;
  const title = document.querySelector('#form-title');
  if (title) title.textContent = currentUser?.rol === 'registro' ? 'Agregar pago' : 'Registrar pago';
  if (submit) submit.textContent = 'Guardar pago';
  if (cancel) cancel.hidden = true;
}

async function editPayment(id) {
  if (currentUser?.rol !== 'admin') return;
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
  if (currentUser?.rol !== 'admin') return;
  if (!window.confirm(`¿Eliminar el pago de ${payment.cliente}?`)) return;
  try {
    await api(`/api/pagos/${payment.id}`, { method: 'DELETE' });
    if (editingId === payment.id) resetForm();
    showMessage('Pago eliminado.');
    await loadPayments();
  } catch (error) { showMessage(error.message, true); }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  loginButton.disabled = true;
  loginMessage.hidden = true;
  const data = Object.fromEntries(new FormData(loginForm));
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'No fue posible iniciar sesión.');
    loginForm.reset();
    enterApp(result.user);
  } catch (error) { showMessage(error.message, true, loginMessage); }
  finally { loginButton.disabled = false; }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); }
  catch { /* Se limpia la vista local aunque la conexión falle. */ }
  showLogin('Sesión cerrada.');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity() || !currentUser) return;
  const data = Object.fromEntries(new FormData(form));
  data.valor = Number(data.valor);
  const updating = currentUser.rol === 'admin' && editingId !== null;
  const method = updating ? 'PUT' : 'POST';
  submit.disabled = true;
  try {
    await api(updating ? `/api/pagos/${editingId}` : '/api/pagos', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    showMessage(updating ? 'Pago actualizado.' : 'Pago guardado.');
    resetForm();
    if (currentUser.rol === 'admin') await loadPayments();
  } catch (error) { showMessage(error.message, true); }
  finally { submit.disabled = false; }
});

cancel.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', loadPayments);
connectButton.addEventListener('click', connectServer);
backupButton.addEventListener('click', downloadBackup);
document.querySelector('#refresh-restorations').addEventListener('click', loadRestorations);

fetch('/api/auth/me', { credentials: 'same-origin' })
  .then(async (response) => response.ok ? response.json() : null)
  .then((result) => { if (result?.user) enterApp(result.user); })
  .catch(() => { /* La vista de acceso permanece disponible si el servicio inicia tarde. */ });
