import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement, formatDate, unwrapList } from '../utils/dom.js';

const list = document.querySelector('[data-my-loans]');
const status = document.querySelector('[data-loan-status]');
const filter = document.querySelector('[data-loan-filter]');
let loans = [];

function renderLoans(query = '') {
  const normalizedQuery = query.toLocaleLowerCase('es');
  const visibleLoans = loans.filter((loan) => String(loan.titulo ?? loan.libro?.titulo ?? '')
    .toLocaleLowerCase('es')
    .includes(normalizedQuery));

  const fragment = document.createDocumentFragment();
  for (const loan of visibleLoans) {
    const card = createElement('article', 'tarjeta prestamo-card');
    card.append(createElement('h2', '', loan.titulo ?? loan.libro?.titulo ?? 'Préstamo'));

    const details = createElement('dl', 'datos-resumen');
    const data = [
      ['Fecha de préstamo', formatDate(loan.fecha_prestamo ?? loan.fecha_inicio)],
      ['Fecha de devolución', formatDate(loan.fecha_devolucion ?? loan.fecha_vencimiento)],
      ['Estado', loan.estado ?? 'No informado']
    ];

    if (loan.multa !== undefined && loan.multa !== null) {
      data.push(['Multa', `Q ${Number(loan.multa).toFixed(2)}`]);
    }

    for (const [label, value] of data) {
      details.append(createElement('dt', '', label), createElement('dd', '', value));
    }
    card.append(details);
    fragment.append(card);
  }

  list.replaceChildren(fragment);
  status.textContent = visibleLoans.length
    ? `${visibleLoans.length} ${visibleLoans.length === 1 ? 'préstamo encontrado' : 'préstamos encontrados'}.`
    : 'No hay préstamos que coincidan con el filtro.';
  list.setAttribute('aria-busy', 'false');
}

async function loadLoans() {
  try {
    const response = await apiFetch(API_ENDPOINTS.myLoans);
    loans = unwrapList(response, ['prestamos', 'loans']);
    renderLoans(filter.value);
  } catch (error) {
    list.replaceChildren();
    list.setAttribute('aria-busy', 'false');
    status.textContent = error.status === 404
      ? 'El endpoint de consulta de préstamos del lector aún no está disponible.'
      : error.message || 'No se pudieron cargar tus préstamos.';
  }
}

filter?.addEventListener('input', () => renderLoans(filter.value.trim()));
loadLoans();
