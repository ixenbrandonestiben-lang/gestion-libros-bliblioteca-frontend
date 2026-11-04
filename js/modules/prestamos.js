import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement, formatDate, showMessage, unwrapList } from '../utils/dom.js';

const form = document.querySelector('[data-create-loan]');
const list = document.querySelector('[data-admin-loans]');
const status = document.querySelector('[data-admin-loans-status]');
const message = document.querySelector('[data-loan-message]');
let loans = [];

function renderLoans() {
  const fragment = document.createDocumentFragment();

  for (const loan of loans) {
    const loanId = loan.id_prestamo ?? loan.id;
    const card = createElement('article', 'tarjeta prestamo-card');
    card.append(
      createElement('h3', '', `Préstamo ${loanId ?? ''}`),
      createElement('p', 'texto-secundario', `Cliente: ${loan.id_cliente ?? 'No informado'}`)
    );

    const info = createElement('dl', 'datos-resumen');
    const rows = [
      ['ID', loanId ?? 'No informado'],
      ['Vence', formatDate(loan.fecha_devolucion_esperada)],
      ['Estado', loan.estado_prestamo ?? 'No informado'],
      ['Multa acumulada', `Q ${Number(loan.multa_acumulada ?? 0).toFixed(2)}`]
    ];

    for (const [label, value] of rows) {
      info.append(createElement('dt', '', label), createElement('dd', '', value));
    }

    const bookList = createElement('ul', 'lista-libros-prestamo');
    const pendingBooks = (loan.libros ?? []).filter((book) => !book.estado_libro_entrada);

    for (const book of loan.libros ?? []) {
      const item = createElement('li', '', `Libro #${book.id_libro}`);
      if (book.estado_libro_entrada) {
        item.append(createElement('span', 'texto-secundario', ` — ${book.estado_libro_entrada}`));
      } else {
        const condition = document.createElement('select');
        condition.setAttribute('aria-label', `Estado de entrada del libro ${book.id_libro}`);
        condition.dataset.returnCondition = '';
        condition.dataset.detailId = String(book.id_detalle_prestamo);
        for (const [value, label] of [
          ['NUEVO', 'Nuevo'],
          ['BUENO', 'Buen estado'],
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

    const returnButton = createElement('button', 'boton boton--secundario', 'Registrar devolución');
    returnButton.type = 'button';
    returnButton.dataset.returnLoan = String(loanId ?? '');
    returnButton.disabled = loanId === undefined || loanId === null || pendingBooks.length === 0;
    card.append(info, bookList);
    if (pendingBooks.length > 0) {
      card.append(returnButton);
    }
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
    status.textContent = error.message || 'No se pudieron cargar los préstamos.';
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
        fecha_devolucion_esperada: data.get('fecha_devolucion_esperada'),
        libros: [{ id_libro: Number(data.get('id_libro')) }]
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
  const booksToReturn = [...button.closest('.prestamo-card').querySelectorAll('[data-return-condition]')]
    .map((condition) => ({
      id_detalle_prestamo: Number(condition.dataset.detailId),
      estado_libro_entrada: condition.value
    }));
  button.disabled = true;

  try {
    await apiFetch(API_ENDPOINTS.returns(loanId), {
      method: 'POST',
      body: JSON.stringify({ libros: booksToReturn })
    });
    showMessage(message, 'Devolución registrada correctamente.', 'success');
    await loadLoans();
  } catch (error) {
    button.disabled = false;
    showMessage(message, error.message || 'No se pudo registrar la devolución.', 'error');
  }
});

loadLoans();
