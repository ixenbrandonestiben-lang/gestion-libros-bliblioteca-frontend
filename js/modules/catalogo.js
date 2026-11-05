import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import {
  createElement,
  formatMoney,
  notify,
  unwrapList,
  unwrapRecord
} from '../utils/dom.js';

const search = document.querySelector('[data-catalog-search]');
const sort = document.querySelector('[data-catalog-sort]');
const savedButton = document.querySelector('[data-show-saved]');
const savedLabel = document.querySelector('[data-saved-label]');
const filters = document.querySelector('[data-genre-filters]');
const results = document.querySelector('[data-catalog-results]');
const status = document.querySelector('[data-catalog-status]');
const count = document.querySelector('[data-catalog-count]');
const dialog = document.querySelector('[data-book-dialog]');
const detail = document.querySelector('[data-book-detail]');
const dialogTitle = document.querySelector('#book-dialog-title');

const favoriteStorageKey = 'biblioteca-villa-favorites';
const coverPalettes = [
  'linear-gradient(145deg, #ab7390, #68425f)',
  'linear-gradient(145deg, #dd8a62, #a54e3f)',
  'linear-gradient(145deg, #758d70, #355649)',
  'linear-gradient(145deg, #9780c4, #554476)',
  'linear-gradient(145deg, #d2ae58, #946831)'
];
let books = [];
let authors = new Map();
let publishers = new Map();
let genres = new Map();
let activeGenre = 'all';
let showFavorites = false;
let favorites = readFavorites();
let searchTimer;

function readFavorites() {
  const saved = sessionStorage.getItem(favoriteStorageKey);
  if (!saved) return new Set();

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('El formato de favoritos no es válido.');
    return new Set(parsed.map(String));
  } catch (error) {
    sessionStorage.removeItem(favoriteStorageKey);
    notify('Se reinició tu estantería guardada porque sus datos estaban dañados.', 'error');
    return new Set();
  }
}

function saveFavorites() {
  sessionStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
  savedLabel.textContent = favorites.size ? `Mi estantería · ${favorites.size}` : 'Mi estantería';
}

function getBookTitle(book) {
  return String(book.titulo ?? 'Título sin nombre');
}

function getBookGenre(book) {
  return genres.get(Number(book.id_genero)) ?? 'Sin género';
}

function matchesSearch(book, query) {
  const author = authors.get(Number(book.id_autor)) ?? '';
  return [
    book.titulo,
    book.isbn,
    author,
    publishers.get(Number(book.id_editorial)),
    getBookGenre(book)
  ].join(' ').toLocaleLowerCase('es').includes(query);
}

function getVisibleBooks() {
  const query = search.value.trim().toLocaleLowerCase('es');
  const visible = books.filter((book) => (
    (!query || matchesSearch(book, query))
    && (activeGenre === 'all' || String(book.id_genero) === activeGenre)
    && (!showFavorites || favorites.has(String(book.id_libro)))
  ));

  const order = sort.value;
  visible.sort((a, b) => {
    if (order === 'price-low') return Number(a.precio) - Number(b.precio);
    if (order === 'price-high') return Number(b.precio) - Number(a.precio);
    if (order === 'stock') return Number(b.stock) - Number(a.stock);
    return getBookTitle(a).localeCompare(getBookTitle(b), 'es');
  });
  return visible;
}

function renderGenreFilters() {
  const fragment = document.createDocumentFragment();
  const options = [['all', 'Todos los géneros'], ...[...genres.entries()].map(([id, name]) => [String(id), name])];

  for (const [id, label] of options) {
    const button = createElement('button', 'filter-chip', label);
    button.type = 'button';
    button.dataset.genreFilter = id;
    button.setAttribute('aria-pressed', String(activeGenre === id));
    fragment.append(button);
  }
  filters.replaceChildren(fragment);
}

function createBookCard(book, index) {
  const card = createElement('article', 'book-card');
  const cover = createElement('div', 'book-cover');
  cover.style.setProperty('--cover', coverPalettes[index % coverPalettes.length]);

  const coverContent = createElement('div', 'book-cover__content');
  coverContent.append(
    createElement('span', 'book-cover__mark', '✳'),
    createElement('h3', 'book-cover__title', getBookTitle(book)),
    createElement('p', 'book-cover__author', authors.get(Number(book.id_autor)) ?? 'Biblioteca Villa')
  );
  cover.append(coverContent);

  const favorite = createElement('button', 'favorite-button', favorites.has(String(book.id_libro)) ? '♥' : '♡');
  favorite.type = 'button';
  favorite.dataset.favoriteBook = String(book.id_libro);
  favorite.setAttribute('aria-label', favorites.has(String(book.id_libro))
    ? `Quitar ${getBookTitle(book)} de Mi estantería`
    : `Guardar ${getBookTitle(book)} en Mi estantería`);
  favorite.setAttribute('aria-pressed', String(favorites.has(String(book.id_libro))));
  cover.append(favorite);

  const body = createElement('div', 'book-card__body');
  const top = createElement('div', 'book-card__top');
  top.append(
    createElement('span', 'pill pill--lilac', getBookGenre(book)),
    createElement('span', 'book-card__meta', Number(book.stock) > 0 ? `${book.stock} en sala` : 'Sin ejemplares')
  );

  const author = authors.get(Number(book.id_autor)) ?? 'Autor por descubrir';
  body.append(
    top,
    createElement('p', 'book-card__meta', author),
    createElement('p', 'book-card__price', formatMoney(book.precio))
  );

  const action = createElement('button', 'boton boton--secundario boton--pequeno', 'Conocer el libro ↗');
  action.type = 'button';
  action.dataset.bookDetail = String(book.id_libro);
  body.append(action);
  card.append(cover, body);
  return card;
}

function renderBooks() {
  const visibleBooks = getVisibleBooks();
  const fragment = document.createDocumentFragment();
  visibleBooks.forEach((book, index) => fragment.append(createBookCard(book, index)));
  results.replaceChildren(fragment);
  results.setAttribute('aria-busy', 'false');
  count.textContent = `${visibleBooks.length} ${visibleBooks.length === 1 ? 'historia' : 'historias'}`;
  status.textContent = visibleBooks.length
    ? `${visibleBooks.length} títulos para explorar.`
    : showFavorites
      ? 'Guarda algún título con el corazón para verlo aquí.'
      : 'No encontramos títulos con esos filtros. Prueba otra búsqueda.';
}

function appendDetail(list, label, value) {
  const term = createElement('dt', '', label);
  const description = createElement('dd', '', value ?? '—');
  list.append(term, description);
}

function renderBookDetails(book) {
  dialogTitle.textContent = getBookTitle(book);
  detail.replaceChildren();
  const intro = createElement('p', 'texto-secundario', authors.get(Number(book.id_autor)) ?? 'Una nueva voz por descubrir.');
  const rows = createElement('dl', 'profile-data');
  appendDetail(rows, 'Género', getBookGenre(book));
  appendDetail(rows, 'Editorial', publishers.get(Number(book.id_editorial)));
  appendDetail(rows, 'ISBN', book.isbn);
  appendDetail(rows, 'Año', book.anio_publicacion);
  appendDetail(rows, 'Páginas', book.paginas);
  appendDetail(rows, 'Idioma', book.idioma_escritura);
  appendDetail(rows, 'Disponibilidad', Number(book.stock) > 0 ? `${book.stock} ejemplares en sala` : 'Agotado');

  const footer = createElement('div', 'section-heading');
  footer.append(
    createElement('span', 'book-card__price', formatMoney(book.precio)),
    createElement('a', 'boton boton--coral', 'Crear cuenta para explorar')
  );
  footer.querySelector('a').href = '../auth/registro.html';
  detail.append(intro, rows, footer);
  dialog.showModal();
}

async function showBook(id) {
  try {
    const response = await apiFetch(API_ENDPOINTS.book(id));
    renderBookDetails(unwrapRecord(response));
  } catch (error) {
    notify(error.message || 'No pudimos abrir la ficha del libro.', 'error');
  }
}

async function loadCollection(endpoint, keys) {
  const response = await apiFetch(endpoint);
  return unwrapList(response, keys);
}

async function loadCatalog() {
  results.setAttribute('aria-busy', 'true');
  const [bookResult, authorResult, publisherResult, genreResult] = await Promise.allSettled([
    loadCollection(API_ENDPOINTS.books, ['libros', 'books']),
    loadCollection(API_ENDPOINTS.authors, ['autores', 'authors']),
    loadCollection(API_ENDPOINTS.publishers, ['editoriales', 'publishers']),
    loadCollection(API_ENDPOINTS.genres, ['generos', 'generosLiterarios', 'genres'])
  ]);

  if (bookResult.status === 'rejected') {
    status.textContent = bookResult.reason.message || 'No se pudo abrir la estantería.';
    results.setAttribute('aria-busy', 'false');
    results.replaceChildren();
    count.textContent = 'Sin conexión';
    return;
  }

  books = bookResult.value;
  if (authorResult.status === 'fulfilled') {
    authors = new Map(authorResult.value.map((item) => [Number(item.id_autor), item.nombre_autor]));
  }
  if (publisherResult.status === 'fulfilled') {
    publishers = new Map(publisherResult.value.map((item) => [Number(item.id_editorial), item.nombre_editorial]));
  }
  if (genreResult.status === 'fulfilled') {
    genres = new Map(genreResult.value.map((item) => [Number(item.id_genero), item.nombre_genero]));
  }

  renderGenreFilters();
  renderBooks();
  const missing = [authorResult, publisherResult, genreResult].filter((result) => result.status === 'rejected').length;
  if (missing) {
    status.textContent += ` Algunos datos complementarios no están disponibles (${missing}).`;
  }
}

search.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(renderBooks, 100);
});
sort.addEventListener('change', renderBooks);

filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-genre-filter]');
  if (!button) return;
  activeGenre = button.dataset.genreFilter;
  renderGenreFilters();
  renderBooks();
});

savedButton.addEventListener('click', () => {
  showFavorites = !showFavorites;
  savedButton.setAttribute('aria-pressed', String(showFavorites));
  savedButton.classList.toggle('boton--coral', showFavorites);
  renderBooks();
});

results.addEventListener('click', (event) => {
  const favorite = event.target.closest('[data-favorite-book]');
  if (favorite) {
    const id = favorite.dataset.favoriteBook;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    saveFavorites();
    renderBooks();
    return;
  }

  const bookButton = event.target.closest('[data-book-detail]');
  if (bookButton) showBook(bookButton.dataset.bookDetail);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-book]')) {
    dialog.close();
  }
});

saveFavorites();
loadCatalog();
