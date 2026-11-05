import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { getRoleHome, getSession } from '../utils/auth.js';
import { notify, unwrapList } from '../utils/dom.js';

const title = document.querySelector('[data-spotlight-title]');
const author = document.querySelector('[data-spotlight-author]');
const status = document.querySelector('[data-library-status]');
const collectionCount = document.querySelector('[data-collection-count]');
const spotlight = document.querySelector('[data-spotlight]');

try {
  const session = getSession();
  if (session?.token && session.role) {
    window.location.replace(`./vistas/${getRoleHome(session.role).replace('../', '')}`);
  }
} catch (error) {
  notify(error.message, 'error');
}

async function loadSpotlight() {
  try {
    const response = await apiFetch(API_ENDPOINTS.books);
    const books = unwrapList(response, ['libros', 'books']);
    if (books.length === 0) {
      status.textContent = 'La colección se está preparando para recibirte.';
      collectionCount.textContent = 'Muy pronto, nuevas historias.';
      return;
    }

    const book = books[new Date().getDate() % books.length];
    title.textContent = book.titulo ?? 'Una historia por descubrir';
    const authorsResponse = await apiFetch(API_ENDPOINTS.authors);
    const authors = unwrapList(authorsResponse, ['autores', 'authors']);
    const bookAuthor = authors.find((item) => Number(item.id_autor) === Number(book.id_autor));
    author.textContent = bookAuthor?.nombre_autor ?? 'Una historia espera en la colección.';
    status.textContent = 'Una recomendación elegida al azar entre nuestros estantes.';
    collectionCount.textContent = `${books.length} títulos para perderse un rato.`;
    spotlight.dataset.bookId = String(book.id_libro);
  } catch (error) {
    status.textContent = error.message || 'No pudimos conectar con la estantería ahora.';
    collectionCount.textContent = 'La colección volverá a estar disponible enseguida.';
  }
}

spotlight.addEventListener('click', () => {
  window.location.assign('./vistas/cliente/catalogo.html');
});
spotlight.tabIndex = 0;
spotlight.setAttribute('role', 'link');
spotlight.setAttribute('aria-label', 'Explorar el libro recomendado en el catálogo');
spotlight.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    window.location.assign('./vistas/cliente/catalogo.html');
  }
});

loadSpotlight();
