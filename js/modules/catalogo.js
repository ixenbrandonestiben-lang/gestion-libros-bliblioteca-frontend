import { apiFetch } from '../config/api.js';
import { unwrapList } from '../utils/dom.js';

const form = document.querySelector('[data-catalog-filter]');
const searchInput = document.querySelector('#catalogo-busqueda');
const results = document.querySelector('[data-catalog-results]');
const status = document.querySelector('[data-catalog-status]');

let debounceTimer;
let activeRequest;
let currentQuery = '';

function addDetail(list, label, value) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  const term = document.createElement('dt');
  term.textContent = label;

  const description = document.createElement('dd');
  description.textContent = String(value);

  list.append(term, description);
}

function createBookCard(book) {
  const card = document.createElement('article');
  card.className = 'tarjeta libro';

  const title = document.createElement('h2');
  title.textContent = book.titulo || 'Título no disponible';
  card.append(title);

  const details = document.createElement('dl');
  details.className = 'libro-detalles';
  addDetail(details, 'Autor', book.autor ?? (book.id_autor ? `#${book.id_autor}` : null));
  addDetail(details, 'Editorial', book.editorial ?? (book.id_editorial ? `#${book.id_editorial}` : null));
  addDetail(details, 'Género', book.genero ?? (book.id_genero ? `#${book.id_genero}` : null));
  addDetail(details, 'ISBN', book.isbn);

  if (details.childElementCount > 0) {
    card.append(details);
  }

  const stock = Number(book.stock);
  const stockIsValid = book.stock !== null
    && book.stock !== undefined
    && book.stock !== ''
    && Number.isFinite(stock)
    && stock >= 0;

  if (stockIsValid && stock === 0) {
    const unavailable = document.createElement('button');
    unavailable.className = 'estado-libro agotado';
    unavailable.type = 'button';
    unavailable.disabled = true;
    unavailable.textContent = 'Agotado';
    card.append(unavailable);
  } else {
    const availability = document.createElement('p');
    availability.className = 'estado-libro';
    availability.textContent = stockIsValid
      ? `${stock} ${stock === 1 ? 'ejemplar disponible' : 'ejemplares disponibles'}`
      : 'Disponibilidad no informada';
    card.append(availability);
  }

  return card;
}

function renderBooks(books) {
  const fragment = document.createDocumentFragment();
  const query = currentQuery.toLocaleLowerCase('es');
  const visibleBooks = books.filter((book) => (
    `${book.titulo ?? ''} ${book.isbn ?? ''} ${book.autor ?? ''}`.toLocaleLowerCase('es').includes(query)
  ));

  for (const book of visibleBooks) {
    if (!book || typeof book !== 'object' || Array.isArray(book)) {
      throw new Error('La API devolvió un registro de libro con formato inválido.');
    }

    fragment.append(createBookCard(book));
  }

  results.replaceChildren(fragment);
  status.textContent = visibleBooks.length === 0
    ? 'No se encontraron libros.'
    : `${visibleBooks.length} ${visibleBooks.length === 1 ? 'libro encontrado' : 'libros encontrados'}.`;
}

function showError(error) {
  if (error.name === 'AbortError') {
    return;
  }

  if (error instanceof TypeError) {
    status.textContent = 'No se pudo conectar con la API. Verifica que el backend esté ejecutándose y permita solicitudes desde este origen.';
  } else {
    status.textContent = error.message || 'No se pudo cargar el catálogo.';
  }

  results.replaceChildren();
}

async function loadBooks(query = '') {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  currentQuery = query.trim();
  results.setAttribute('aria-busy', 'true');
  status.textContent = 'Cargando catálogo...';

  const endpoint = 'libros';

  try {
    const response = await apiFetch(endpoint, { signal: request.signal });
    if (request.signal.aborted) {
      return;
    }

    renderBooks(unwrapList(response, ['libros', 'books']));
  } catch (error) {
    showError(error);
  } finally {
    if (activeRequest === request) {
      results.setAttribute('aria-busy', 'false');
    }
  }
}

if (form && searchInput && results && status) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.clearTimeout(debounceTimer);
    loadBooks(searchInput.value.trim());
  });

  searchInput.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      loadBooks(searchInput.value.trim());
    }, 300);
  });

  loadBooks();
}