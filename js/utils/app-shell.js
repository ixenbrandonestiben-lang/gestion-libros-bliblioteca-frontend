import { getSession, normalizeRole } from './auth.js';
import { createElement } from './dom.js';

const CLIENT_LINKS = [
  { label: 'Catálogo', href: './catalogo.html', file: 'catalogo.html' },
  { label: 'Mis préstamos', href: './mis-prestamos.html', file: 'mis-prestamos.html' },
  { label: 'Mi perfil', href: './perfil.html', file: 'perfil.html' }
];

const STAFF_LINKS = [
  { label: 'Resumen', href: './dashboard.html', file: 'dashboard.html' },
  { label: 'Punto de venta', href: './pos.html', file: 'pos.html' },
  { label: 'Préstamos', href: './gestion-prestamos.html', file: 'gestion-prestamos.html' }
];

export function initializeAppShell() {
  const header = document.querySelector('[data-app-header]');
  if (!header) {
    return;
  }

  const session = getSession();
  const role = normalizeRole(session?.role);
  const links = ['ADMIN', 'ADMINISTRADOR', 'BIBLIOTECARIO'].includes(role)
    ? STAFF_LINKS
    : CLIENT_LINKS;

  const container = createElement('div', 'barra-app');
  const brand = createElement('a', 'marca', 'Biblioteca Villa');
  brand.href = links[0].href;

  const navigation = createElement('nav', 'navegacion-app');
  navigation.setAttribute('aria-label', 'Navegación principal');
  const currentPage = window.location.pathname.split('/').pop();

  for (const link of links) {
    const anchor = createElement('a', '', link.label);
    anchor.href = link.href;
    if (link.file === currentPage) {
      anchor.setAttribute('aria-current', 'page');
    }
    navigation.append(anchor);
  }

  const account = createElement('div', 'cuenta-app');
  account.append(createElement('span', 'cuenta-nombre', session?.name || 'Usuario'));

  const logout = createElement('button', 'boton boton--secundario', 'Cerrar sesión');
  logout.type = 'button';
  logout.dataset.logout = '';
  account.append(logout);

  container.append(brand, navigation, account);
  header.replaceChildren(container);
}
