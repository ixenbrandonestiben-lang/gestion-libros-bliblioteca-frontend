import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import {
  createElement,
  formatDate,
  formatMoney,
  notify,
  unwrapList,
  unwrapRecord
} from '../utils/dom.js';

const list = document.querySelector('[data-my-loans]');
const status = document.querySelector('[data-loan-status]');
const filter = document.querySelector('[data-loan-filter]');
const count = document.querySelector('[data-my-loan-count]');
const pagination = document.querySelector('[data-my-loan-pagination]');
const pageStatus = document.querySelector('[data-page-status]');
const previous = document.querySelector('[data-previous-page]');
const next = document.querySelector('[data-next-page]');
const dialog = document.querySelector('[data-my-loan-dialog]');
const dialogTitle = document.querySelector('#my-loan-dialog-title');
const dialogBody = document.querySelector('[data-my-loan-detail]');

const pageSize = 12;
let currentPage = 1;
let totalPages = 1;
let totalLoans = 0;
let loans = [];
let booksById = new Map();

function createLoanCard(loan) {
  const card = createElement('article', 'prestamo-card');
  const top = createElement('div', 'loan-topline');
  top.append(
    createElement('h3', '', `Un viaje lector · #${loan.id_prestamo}`),
    createElement('span', 'pill pill--lilac', loan.estado_prestamo ?? 'Sin estado')
  );
  card.append(top);

  const bookList = createElement('ul', 'lista-libros-prestamo');
  for (const book of loan.libros ?? []) {
    bookList.append(createElement(
      'li',
      '',
      booksById.get(Number(book.id_libro)) ?? `Libro #${book.id_libro}`
    ));
  }
  const detail = createElement('dl', 'datos-resumen');
  for (const [label, value] of [
    ['Sale contigo', formatDate(loan.fecha_prestamo)],
    ['Vuelve antes de', formatDate(loan.fecha_devolucion_esperada)],
    ['Volvió el', formatDate(loan.fecha_devolucion_real)],
    ['Multa acumulada', formatMoney(loan.multa_acumulada)]
  ]) {
    detail.append(createElement('dt', '', label), createElement('dd', '', value));
  }

  const button = createElement('button', 'boton boton--secundario boton--pequeno', 'Abrir bitácora');
  button.type = 'button';
  button.dataset.loanDetail = String(loan.id_prestamo);
  card.append(bookList, detail, button);
  return card;
}

function renderLoans() {
  const query = filter.value.trim().toLocaleLowerCase('es');
  const visible = loans.filter((loan) => {
    const bookNames = (loan.libros ?? []).map((book) => (
      booksById.get(Number(book.id_libro)) ?? `Libro ${book.id_libro}`
    )).join(' ');
    return `#${loan.id_prestamo} ${bookNames} ${loan.estado_prestamo}`
      .toLocaleLowerCase('es')
      .includes(query);
  });

  const fragment = document.createDocumentFragment();
  for (const loan of visible) fragment.append(createLoanCard(loan));
  list.replaceChildren(fragment);
  list.setAttribute('aria-busy', 'false');
  count.textContent = `${totalLoans} ${totalLoans === 1 ? 'préstamo' : 'préstamos'} · ${visible.length} visibles`;
  status.textContent = visible.length
    ? 'Cada ficha es un libro que ha salido contigo.'
    : 'No encontramos préstamos con ese filtro.';
}

async function loadLoans(page = currentPage) {
  currentPage = page;
  list.setAttribute('aria-busy', 'true');
  status.textContent = 'Recuperando tu bitácora…';

  try {
    const [loanResult, bookResult] = await Promise.allSettled([
      apiFetch(`${API_ENDPOINTS.myLoans}?page=${currentPage}&limit=${pageSize}`),
      booksById.size ? Promise.resolve(null) : apiFetch(API_ENDPOINTS.books)
    ]);
    if (loanResult.status === 'rejected') throw loanResult.reason;

    const loanResponse = loanResult.value;
    loans = unwrapList(loanResponse, ['prestamos', 'loans']);
    if (bookResult.status === 'fulfilled' && bookResult.value) {
      const books = unwrapList(bookResult.value, ['libros', 'books']);
      booksById = new Map(books.map((book) => [Number(book.id_libro), book.titulo]));
    } else if (bookResult.status === 'rejected') {
      notify(`No se pudieron cargar los títulos del catálogo: ${bookResult.reason.message}`, 'error');
    }

    currentPage = Number(loanResponse.pagination?.page ?? currentPage);
    totalPages = Math.max(1, Number(loanResponse.pagination?.pages ?? 1));
    totalLoans = Number(loanResponse.pagination?.total ?? loans.length);
    pagination.hidden = totalPages <= 1;
    previous.disabled = currentPage <= 1;
    next.disabled = currentPage >= totalPages;
    pageStatus.textContent = `Página ${currentPage} de ${totalPages}`;
    renderLoans();
  } catch (error) {
    list.replaceChildren();
    list.setAttribute('aria-busy', 'false');
    status.textContent = error.message || 'No se pudo abrir tu bitácora.';
    pagination.hidden = true;
  }
}

function renderDetails(loan) {
  dialogTitle.textContent = `Tu recorrido · préstamo #${loan.id_prestamo}`;
  const details = createElement('dl', 'datos-resumen');
  for (const [label, value] of [
    ['Fecha de salida', formatDate(loan.fecha_prestamo)],
    ['Fecha prevista de regreso', formatDate(loan.fecha_devolucion_esperada)],
    ['Fecha real de regreso', formatDate(loan.fecha_devolucion_real)],
    ['Estado', loan.estado_prestamo],
    ['Multa acumulada', formatMoney(loan.multa_acumulada)]
  ]) {
    details.append(createElement('dt', '', label), createElement('dd', '', value));
  }

  const books = createElement('div', 'resource-grid');
  for (const book of loan.libros ?? []) {
    const card = createElement('article', 'record-card');
    card.append(
      createElement('h3', '', booksById.get(Number(book.id_libro)) ?? `Libro #${book.id_libro}`),
      createElement('p', '', `Estado al salir · ${book.estado_libro_salida}`),
      createElement('p', '', `Estado al regresar · ${book.estado_libro_entrada ?? 'Contigo todavía'}`)
    );
    books.append(card);
  }
  dialogBody.replaceChildren(details, books);
  dialog.showModal();
}

async function openLoan(id) {
  try {
    const response = await apiFetch(API_ENDPOINTS.loan(id));
    renderDetails(unwrapRecord(response));
  } catch (error) {
    notify(error.message || 'No se pudo consultar este préstamo.', 'error');
  }
}

list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-loan-detail]');
  if (button) openLoan(button.dataset.loanDetail);
});
filter.addEventListener('input', renderLoans);
previous.addEventListener('click', () => loadLoans(currentPage - 1));
next.addEventListener('click', () => loadLoans(currentPage + 1));

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-my-loan]')) dialog.close();
});

loadLoans();
