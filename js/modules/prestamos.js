import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import {
  createElement,
  formatDate,
  formatMoney,
  notify,
  showMessage,
  unwrapList,
  unwrapRecord
} from '../utils/dom.js';

const form = document.querySelector('[data-create-loan]');
const bookSelect = document.querySelector('[data-loan-books]');
const dueDateInput = document.querySelector('#loan-due-date');
const list = document.querySelector('[data-admin-loans]');
const status = document.querySelector('[data-admin-loans-status]');
const count = document.querySelector('[data-loan-count]');
const pagination = document.querySelector('[data-loan-pagination]');
const pageStatus = document.querySelector('[data-loan-page-status]');
const previousButton = document.querySelector('[data-loan-previous]');
const nextButton = document.querySelector('[data-loan-next]');
const message = document.querySelector('[data-loan-message]');
const dialog = document.querySelector('[data-loan-dialog]');
const dialogTitle = document.querySelector('#loan-dialog-title');
const dialogDetail = document.querySelector('[data-loan-detail]');

const pageSize = 12;
let currentPage = 1;
let totalPages = 1;
let totalLoans = 0;
let loans = [];
let booksById = new Map();

function localDateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function getLoanStatus(loan) {
  return String(loan.estado_prestamo ?? 'SIN ESTADO').toUpperCase();
}

function addDefinition(listElement, label, value) {
  listElement.append(
    createElement('dt', '', label),
    createElement('dd', '', value ?? '—')
  );
}

function renderLoanCard(loan) {
  const id = loan.id_prestamo;
  const card = createElement('article', 'prestamo-card');
  const top = createElement('div', 'loan-topline');
  top.append(
    createElement('h3', '', `Préstamo #${id}`),
    createElement('span', 'pill pill--lilac', getLoanStatus(loan))
  );
  card.append(
    top,
    createElement('p', 'texto-secundario', `Lector #${loan.id_cliente} · vence ${formatDate(loan.fecha_devolucion_esperada)}`)
  );

  const books = loan.libros ?? [];
  const pending = books.filter((book) => !book.estado_libro_entrada);
  const bookList = createElement('ul', 'lista-libros-prestamo');
  for (const book of books) {
    const item = createElement(
      'li',
      '',
      `${booksById.get(Number(book.id_libro)) ?? `Libro #${book.id_libro}`} · ${book.estado_libro_entrada ?? 'En préstamo'}`
    );
    if (!book.estado_libro_entrada) {
      const condition = document.createElement('select');
      condition.dataset.returnCondition = '';
      condition.dataset.detailId = String(book.id_detalle_prestamo);
      condition.setAttribute('aria-label', `Condición de devolución de ${booksById.get(Number(book.id_libro)) ?? `libro ${book.id_libro}`}`);
      for (const [value, label] of [
        ['BUENO', 'Buen estado'],
        ['NUEVO', 'Nuevo'],
        ['DESGASTADO', 'Desgastado'],
        ['DAÑADO', 'Dañado'],
        ['PERDIDO', 'Perdido']
      ]) {
        const option = createElement('option', '', label);
        option.value = value;
        condition.append(option);
      }
      item.append(condition);
    }
    bookList.append(item);
  }
  card.append(bookList);

  const actions = createElement('div', 'record-card__actions');
  const detailButton = createElement('button', 'boton boton--secundario boton--pequeno', 'Ver recorrido');
  detailButton.type = 'button';
  detailButton.dataset.loanDetail = String(id);
  actions.append(detailButton);

  if (pending.length > 0) {
    const returnButton = createElement('button', 'boton boton--coral boton--pequeno', 'Recibir devolución');
    returnButton.type = 'button';
    returnButton.dataset.returnLoan = String(id);
    actions.append(returnButton);
  }
  card.append(actions);
  return card;
}

function renderLoans() {
  const fragment = document.createDocumentFragment();
  for (const loan of loans) {
    fragment.append(renderLoanCard(loan));
  }
  list.replaceChildren(fragment);
  list.setAttribute('aria-busy', 'false');
  count.textContent = `${totalLoans} ${totalLoans === 1 ? 'préstamo' : 'préstamos'} · ${totalPages} ${totalPages === 1 ? 'página' : 'páginas'}`;
  status.textContent = loans.length
    ? 'Cada ficha acompaña un libro en su recorrido.'
    : 'No hay préstamos en esta página.';
  pagination.hidden = totalPages <= 1;
  previousButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
  pageStatus.textContent = `Página ${currentPage} de ${totalPages}`;
}

async function loadBooks() {
  const response = await apiFetch(API_ENDPOINTS.books);
  const books = unwrapList(response, ['libros', 'books']);
  booksById = new Map(books.map((book) => [Number(book.id_libro), book.titulo]));

  const options = createElement('option');
  options.value = '';
  options.textContent = 'Elige uno o más libros';
  const fragment = document.createDocumentFragment();
  fragment.append(options);

  for (const book of books) {
    const option = createElement(
      'option',
      '',
      `${book.titulo} · ${Number(book.stock)} disponibles`
    );
    option.value = String(book.id_libro);
    option.disabled = Number(book.stock) < 1;
    fragment.append(option);
  }
  bookSelect.replaceChildren(fragment);
}

async function loadLoans(page = currentPage) {
  currentPage = page;
  list.setAttribute('aria-busy', 'true');
  status.textContent = 'Siguiendo los recorridos de los libros…';

  try {
    const response = await apiFetch(`${API_ENDPOINTS.loans}?page=${currentPage}&limit=${pageSize}`);
    loans = unwrapList(response, ['prestamos', 'loans']);
    totalPages = Math.max(1, Number(response.pagination?.pages ?? 1));
    currentPage = Number(response.pagination?.page ?? currentPage);
    totalLoans = Number(response.pagination?.total ?? loans.length);
    renderLoans();
  } catch (error) {
    list.replaceChildren();
    list.setAttribute('aria-busy', 'false');
    pagination.hidden = true;
    status.textContent = error.message || 'No se pudieron cargar los préstamos.';
  }
}

function renderLoanDetail(loan) {
  dialogTitle.textContent = `Recorrido · préstamo #${loan.id_prestamo}`;
  const definition = createElement('dl', 'datos-resumen');
  for (const [label, value] of [
    ['Lector', `#${loan.id_cliente}`],
    ['Despachado por', `#${loan.id_empleado_despacha}`],
    ['Salida', formatDate(loan.fecha_prestamo)],
    ['Devolución prevista', formatDate(loan.fecha_devolucion_esperada)],
    ['Devolución real', formatDate(loan.fecha_devolucion_real)],
    ['Estado', getLoanStatus(loan)],
    ['Multa acumulada', formatMoney(loan.multa_acumulada)]
  ]) {
    addDefinition(definition, label, value);
  }

  const books = createElement('div', 'resource-grid');
  for (const item of loan.libros ?? []) {
    const card = createElement('article', 'record-card');
    card.append(
      createElement('h3', '', booksById.get(Number(item.id_libro)) ?? `Libro #${item.id_libro}`),
      createElement('p', '', `Al salir · ${item.estado_libro_salida}`),
      createElement('p', '', `Al volver · ${item.estado_libro_entrada ?? 'Aún en préstamo'}`)
    );
    books.append(card);
  }
  dialogDetail.replaceChildren(definition, books);
  dialog.showModal();
}

async function openLoan(id) {
  try {
    const response = await apiFetch(API_ENDPOINTS.loan(id));
    renderLoanDetail(unwrapRecord(response));
  } catch (error) {
    notify(error.message || 'No se pudo consultar el recorrido del préstamo.', 'error');
  }
}

async function receiveLoan(button) {
  const card = button.closest('.prestamo-card');
  const returnItems = [...card.querySelectorAll('[data-return-condition]')].map((select) => ({
    id_detalle_prestamo: Number(select.dataset.detailId),
    estado_libro_entrada: select.value
  }));
  if (returnItems.length === 0) {
    notify('Este préstamo no tiene libros pendientes de devolución.', 'error');
    return;
  }

  button.disabled = true;
  try {
    await apiFetch(API_ENDPOINTS.returnLoan(button.dataset.returnLoan), {
      method: 'POST',
      body: JSON.stringify({ libros: returnItems })
    });
    notify('Devolución registrada. La estantería ya conoce el estado de cada libro.', 'success');
    await Promise.all([loadLoans(), loadBooks()]);
  } catch (error) {
    notify(error.message || 'No se pudo registrar la devolución.', 'error');
    button.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const selectedBooks = [...bookSelect.selectedOptions]
    .filter((option) => option.value)
    .map((option) => ({ id_libro: Number(option.value) }));
  if (selectedBooks.length === 0) {
    showMessage(message, 'Elige al menos un libro disponible.', 'error');
    return;
  }

  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    await apiFetch(API_ENDPOINTS.loans, {
      method: 'POST',
      body: JSON.stringify({
        id_cliente: Number(new FormData(form).get('id_cliente')),
        fecha_devolucion_esperada: dueDateInput.value,
        libros: selectedBooks
      })
    });
    form.reset();
    showMessage(message, 'El préstamo empezó su viaje. El inventario ya fue actualizado.', 'success');
    await Promise.all([loadLoans(1), loadBooks()]);
  } catch (error) {
    showMessage(message, error.message || 'No se pudo crear el préstamo.', 'error');
  } finally {
    button.disabled = false;
  }
});

list.addEventListener('click', (event) => {
  const detailButton = event.target.closest('[data-loan-detail]');
  const returnButton = event.target.closest('[data-return-loan]');
  if (detailButton) openLoan(detailButton.dataset.loanDetail);
  if (returnButton) receiveLoan(returnButton);
});

previousButton.addEventListener('click', () => loadLoans(currentPage - 1));
nextButton.addEventListener('click', () => loadLoans(currentPage + 1));

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-loan]')) dialog.close();
});

dueDateInput.min = localDateAfter(1);
dueDateInput.value = localDateAfter(14);

Promise.allSettled([loadBooks(), loadLoans()]).then((results) => {
  const bookResult = results[0];
  if (bookResult.status === 'rejected') {
    showMessage(message, bookResult.reason.message || 'No se pudo cargar el inventario de libros.', 'error');
  }
});
