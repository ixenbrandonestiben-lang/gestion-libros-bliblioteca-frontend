import { apiFetch } from '../config/api.js';

const form = document.querySelector('[data-catalog-filter]');
const searchInput = document.querySelector('#catalogo-busqueda');
const results = document.querySelector('[data-catalog-results]');
const status = document.querySelector('[data-catalog-status]');

let debounceTimer;
let activeRequest;

function getBooks(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.libros)) {
    return response.libros;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  throw new Error('La API respondió, pero no devolvió una lista de libros válida.');
}

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
  addDetail(details, 'Autor', book.autor);
  addDetail(details, 'Editorial', book.editorial);
  addDetail(details, 'Género', book.genero);
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

  for (const book of books) {
    if (!book || typeof book !== 'object' || Array.isArray(book)) {
      throw new Error('La API devolvió un registro de libro con formato inválido.');
    }

    fragment.append(createBookCard(book));
  }

  results.replaceChildren(fragment);
  status.textContent = books.length === 0
    ? 'No se encontraron libros.'
    : `${books.length} ${books.length === 1 ? 'libro encontrado' : 'libros encontrados'}.`;
}

function showError(error) {
  if (error.name === 'AbortError') {
    return;
  }

  if (error.status === 404) {
    status.textContent = 'El endpoint de libros aún no está disponible en el backend.';
  } else if (error instanceof TypeError) {
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
  results.setAttribute('aria-busy', 'true');
  status.textContent = 'Cargando catálogo...';

  const search = new URLSearchParams();
  if (query) {
    search.set('q', query);
  }

  const endpoint = search.size > 0 ? `libros?${search}` : 'libros';

  try {
    const response = await apiFetch(endpoint, { signal: request.signal });
    if (request.signal.aborted) {
      return;
    }

    renderBooks(getBooks(response));
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