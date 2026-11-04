import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement, showMessage, unwrapList } from '../utils/dom.js';

const searchForm = document.querySelector('[data-pos-search]');
const searchInput = document.querySelector('#pos-query');
const bookResults = document.querySelector('[data-pos-books]');
const searchStatus = document.querySelector('[data-pos-search-status]');
const cartList = document.querySelector('[data-cart-items]');
const cartTotal = document.querySelector('[data-cart-total]');
const cartEmpty = document.querySelector('[data-cart-empty]');
const processButton = document.querySelector('[data-process-sale]');
const message = document.querySelector('[data-pos-message]');
const receiptDialog = document.querySelector('[data-receipt-dialog]');
const receiptContent = document.querySelector('[data-receipt-content]');

const cart = new Map();
let books = [];
let searchTimer;
let activeSearch;

function getBookId(book) {
  return book.id_libro ?? book.id ?? book.libro_id;
}

function getBookPrice(book) {
  const price = Number(book.precio_venta ?? book.precio ?? book.price);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
}

function renderBooks() {
  const fragment = document.createDocumentFragment();

  for (const book of books) {
    const card = createElement('article', 'tarjeta pos-libro');
    const id = getBookId(book);
    const price = getBookPrice(book);
    const stock = Number(book.stock);
    const available = Number.isFinite(stock) && stock > 0;
    card.append(
      createElement('h3', '', book.titulo ?? 'Libro'),
      createElement('p', 'texto-secundario', price === null ? 'Precio no informado' : formatMoney(price)),
      createElement('p', 'estado-libro', available ? `${stock} disponibles` : 'Sin existencias')
    );

    const addButton = createElement('button', 'boton', 'Agregar');
    addButton.type = 'button';
    addButton.dataset.addBook = '';
    addButton.dataset.bookId = String(id ?? '');
    addButton.disabled = !available || price === null || id === undefined || id === null;
    card.append(addButton);
    fragment.append(card);
  }

  bookResults.replaceChildren(fragment);
  searchStatus.textContent = books.length
    ? `${books.length} ${books.length === 1 ? 'libro encontrado' : 'libros encontrados'}.`
    : 'No se encontraron libros.';
  bookResults.setAttribute('aria-busy', 'false');
}

async function searchBooks(query = '') {
  activeSearch?.abort();
  const request = new AbortController();
  activeSearch = request;
  bookResults.setAttribute('aria-busy', 'true');
  searchStatus.textContent = 'Buscando libros...';

  const params = new URLSearchParams();
  if (query) {
    params.set('q', query);
  }

  try {
    const path = params.size ? `${API_ENDPOINTS.books}?${params}` : API_ENDPOINTS.books;
    const response = await apiFetch(path, { signal: request.signal });
    if (request.signal.aborted) {
      return;
    }

    books = unwrapList(response, ['libros', 'books']);
    renderBooks();
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    bookResults.replaceChildren();
    bookResults.setAttribute('aria-busy', 'false');
    searchStatus.textContent = error.status === 404
      ? 'El endpoint de libros aún no está disponible en el backend.'
      : error.message || 'No se pudieron consultar los libros.';
  }
}

function renderCart() {
  const fragment = document.createDocumentFragment();
  let total = 0;

  for (const item of cart.values()) {
    const line = createElement('li', 'carrito-item');
    const description = createElement('div', 'carrito-descripcion');
    description.append(
      createElement('strong', '', item.title),
      createElement('span', '', `${formatMoney(item.price)} c/u`)
    );

    const controls = createElement('div', 'carrito-controles');
    const quantity = document.createElement('input');
    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = String(item.stock);
    quantity.value = String(item.quantity);
    quantity.setAttribute('aria-label', `Cantidad de ${item.title}`);
    quantity.dataset.cartQuantity = item.id;

    const remove = createElement('button', 'boton boton--secundario boton--pequeno', 'Quitar');
    remove.type = 'button';
    remove.dataset.removeBook = item.id;
    controls.append(quantity, remove);
    line.append(description, controls);
    fragment.append(line);
    total += item.price * item.quantity;
  }

  cartList.replaceChildren(fragment);
  cartTotal.textContent = formatMoney(total);
  cartEmpty.hidden = cart.size > 0;
  processButton.disabled = cart.size === 0;
}

function addToCart(bookId) {
  const book = books.find((item) => String(getBookId(item)) === bookId);
  if (!book) {
    showMessage(message, 'El libro seleccionado ya no está disponible en los resultados.', 'error');
    return;
  }

  const id = String(getBookId(book));
  const stock = Number(book.stock);
  const current = cart.get(id);
  if ((current?.quantity ?? 0) >= stock) {
    showMessage(message, 'La cantidad solicitada supera las existencias disponibles.', 'error');
    return;
  }

  cart.set(id, {
    id,
    title: book.titulo ?? 'Libro',
    price: getBookPrice(book),
    stock,
    quantity: (current?.quantity ?? 0) + 1
  });
  message.hidden = true;
  renderCart();
}

function renderReceipt(items, total, response) {
  const fragment = document.createDocumentFragment();
  const sale = response?.venta ?? response?.data ?? response;
  const saleId = sale?.id_venta ?? sale?.id;

  if (saleId !== undefined) {
    fragment.append(createElement('p', '', `Número de venta: ${saleId}`));
  }

  const lines = document.createElement('ul');
  for (const item of items) {
    lines.append(createElement('li', '', `${item.title} × ${item.quantity} — ${formatMoney(item.price * item.quantity)}`));
  }
  fragment.append(lines, createElement('p', 'recibo-total', `Total estimado: ${formatMoney(total)}`));
  fragment.append(createElement('p', 'texto-secundario', 'El total final debe ser confirmado por el backend.'));
  receiptContent.replaceChildren(fragment);
  receiptDialog.showModal();
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  window.clearTimeout(searchTimer);
  searchBooks(searchInput.value.trim());
});

searchInput?.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => searchBooks(searchInput.value.trim()), 300);
});

bookResults?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-book]');
  if (button && !button.disabled) {
    addToCart(button.dataset.bookId);
  }
});

cartList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-book]');
  if (button) {
    cart.delete(button.dataset.removeBook);
    renderCart();
  }
});

cartList?.addEventListener('change', (event) => {
  const input = event.target.closest('[data-cart-quantity]');
  if (!input) {
    return;
  }

  const item = cart.get(input.dataset.cartQuantity);
  const quantity = Number(input.value);
  if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > item.stock) {
    showMessage(message, 'La cantidad debe estar entre 1 y las existencias disponibles.', 'error');
    renderCart();
    return;
  }

  item.quantity = quantity;
  message.hidden = true;
  renderCart();
});

processButton?.addEventListener('click', async () => {
  const items = [...cart.values()].map((item) => ({ ...item }));
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  processButton.disabled = true;
  message.hidden = true;

  try {
    const response = await apiFetch(API_ENDPOINTS.sales, {
      method: 'POST',
      body: JSON.stringify({
        items: items.map((item) => ({ id_libro: item.id, cantidad: item.quantity }))
      })
    });
    cart.clear();
    renderCart();
    renderReceipt(items, total, response);
  } catch (error) {
    showMessage(message, error.message || 'No se pudo procesar la venta.', 'error');
  } finally {
    processButton.disabled = cart.size === 0;
  }
});

document.querySelector('[data-close-receipt]')?.addEventListener('click', () => receiptDialog.close());

renderCart();
searchBooks();
