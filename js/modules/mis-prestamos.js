import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement, formatDate, unwrapList } from '../utils/dom.js';

const list = document.querySelector('[data-my-loans]');
const status = document.querySelector('[data-loan-status]');
const filter = document.querySelector('[data-loan-filter]');
let loans = [];

function renderLoans(query = '') {
  const normalizedQuery = query.toLocaleLowerCase('es');
  const visibleLoans = loans.filter((loan) => String(loan.titulo ?? loan.libro?.titulo ?? '')
    .concat(` ${loan.libros?.map((book) => book.id_libro).join(' ') ?? ''}`)
    .toLocaleLowerCase('es')
    .includes(normalizedQuery));

  const fragment = document.createDocumentFragment();
  for (const loan of visibleLoans) {
    const card = createElement('article', 'tarjeta prestamo-card');
    card.append(createElement('h2', '', `Préstamo ${loan.id_prestamo}`));

    const details = createElement('dl', 'datos-resumen');
    const data = [
      ['Fecha de préstamo', formatDate(loan.fecha_prestamo)],
      ['Fecha de devolución prevista', formatDate(loan.fecha_devolucion_esperada)],
      ['Fecha de devolución real', formatDate(loan.fecha_devolucion_real)],
      ['Estado', loan.estado_prestamo ?? 'No informado']
    ];

    data.push(['Multa acumulada', `Q ${Number(loan.multa_acumulada ?? 0).toFixed(2)}`]);

    for (const [label, value] of data) {
      details.append(createElement('dt', '', label), createElement('dd', '', value));
    }
    card.append(details);
    const bookList = createElement('ul', 'lista-libros-prestamo');
    for (const book of loan.libros ?? []) {
      bookList.append(createElement(
        'li',
        '',
        `Libro #${book.id_libro} — ${book.estado_libro_entrada ?? book.estado_libro_salida}`
      ));
    }
    card.append(bookList);
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
    status.textContent = error.message || 'No se pudieron cargar tus préstamos.';
  }
}

filter?.addEventListener('input', () => renderLoans(filter.value.trim()));
loadLoans();
