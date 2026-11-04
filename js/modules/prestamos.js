import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement, formatDate, showMessage, unwrapList } from '../utils/dom.js';

const form = document.querySelector('[data-create-loan]');
const list = document.querySelector('[data-admin-loans]');
const status = document.querySelector('[data-admin-loans-status]');
const message = document.querySelector('[data-loan-message]');
let loans = [];

function getOverdueDays(dueDate) {
  if (!dueDate) {
    return 0;
  }

  const due = new Date(`${String(dueDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(due.getTime())) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - due) / 86_400_000));
}

function estimateFine(loan) {
  const days = getOverdueDays(loan.fecha_devolucion ?? loan.fecha_vencimiento);
  const rawRate = loan.multa_diaria ?? loan.tarifa_mora_diaria;
  const rate = Number(rawRate);
  if (rawRate === undefined || rawRate === null || rawRate === '' || !Number.isFinite(rate) || rate < 0) {
    return { days, amount: null };
  }
  return { days, amount: days * rate };
}

function renderLoans() {
  const fragment = document.createDocumentFragment();

  for (const loan of loans) {
    const loanId = loan.id_prestamo ?? loan.id;
    const card = createElement('article', 'tarjeta prestamo-card');
    card.append(
      createElement('h3', '', loan.titulo ?? loan.libro?.titulo ?? `Préstamo ${loanId ?? ''}`),
      createElement('p', 'texto-secundario', `Cliente: ${loan.nombre_cliente ?? loan.cliente?.nombre ?? loan.id_cliente ?? 'No informado'}`)
    );

    const info = createElement('dl', 'datos-resumen');
    const { days, amount } = estimateFine(loan);
    const rows = [
      ['ID', loanId ?? 'No informado'],
      ['Vence', formatDate(loan.fecha_devolucion ?? loan.fecha_vencimiento)],
      ['Estado', loan.estado ?? 'No informado'],
      ['Días de atraso', days],
      ['Multa estimada', amount === null ? 'Tarifa diaria no provista por la API' : `Q ${amount.toFixed(2)}`]
    ];

    for (const [label, value] of rows) {
      info.append(createElement('dt', '', label), createElement('dd', '', value));
    }

    const controls = createElement('div', 'devolucion-controles');
    const condition = document.createElement('select');
    condition.setAttribute('aria-label', `Estado de entrada del libro del préstamo ${loanId}`);
    condition.dataset.returnCondition = String(loanId ?? '');
    for (const [value, label] of [['BUENO', 'Buen estado'], ['DANADO', 'Dañado'], ['PERDIDO', 'Perdido']]) {
      const option = createElement('option', '', label);
      option.value = value;
      condition.append(option);
    }

    const returnButton = createElement('button', 'boton boton--secundario', 'Registrar devolución');
    returnButton.type = 'button';
    returnButton.dataset.returnLoan = String(loanId ?? '');
    returnButton.disabled = loanId === undefined || loanId === null || ['DEVUELTO', 'CERRADO'].includes(String(loan.estado).toUpperCase());
    controls.append(condition, returnButton);
    card.append(info, controls);
    fragment.append(card);
  }

  list.replaceChildren(fragment);
  list.setAttribute('aria-busy', 'false');
  status.textContent = loans.length
    ? `${loans.length} ${loans.length === 1 ? 'préstamo registrado' : 'préstamos registrados'}.`
    : 'No hay préstamos registrados.';
}

async function loadLoans() {
  list.setAttribute('aria-busy', 'true');
  status.textContent = 'Cargando préstamos...';

  try {
    const response = await apiFetch(API_ENDPOINTS.loans);
    loans = unwrapList(response, ['prestamos', 'loans']);
    renderLoans();
  } catch (error) {
    list.replaceChildren();
    list.setAttribute('aria-busy', 'false');
    status.textContent = error.status === 404
      ? 'El endpoint de préstamos aún no está disponible en el backend.'
      : error.message || 'No se pudieron cargar los préstamos.';
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const data = new FormData(form);

  try {
    await apiFetch(API_ENDPOINTS.loans, {
      method: 'POST',
      body: JSON.stringify({
        id_cliente: String(data.get('id_cliente')).trim(),
        id_libro: String(data.get('id_libro')).trim(),
        fecha_devolucion: data.get('fecha_devolucion')
      })
    });
    form.reset();
    showMessage(message, 'Préstamo registrado correctamente.', 'success');
    await loadLoans();
  } catch (error) {
    showMessage(message, error.message || 'No se pudo registrar el préstamo.', 'error');
  } finally {
    submitButton.disabled = false;
  }
});

list?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-return-loan]');
  if (!button || button.disabled) {
    return;
  }

  const loanId = button.dataset.returnLoan;
  const condition = button.closest('.prestamo-card').querySelector('[data-return-condition]');
  button.disabled = true;

  try {
    await apiFetch(API_ENDPOINTS.returns(loanId), {
      method: 'PATCH',
      body: JSON.stringify({ estado_libro: condition.value })
    });
    showMessage(message, 'Devolución registrada. La multa final debe ser confirmada por el backend.', 'success');
    await loadLoans();
  } catch (error) {
    button.disabled = false;
    showMessage(message, error.message || 'No se pudo registrar la devolución.', 'error');
  }
});

loadLoans();
