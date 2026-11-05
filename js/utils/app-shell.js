import { getSession, normalizeRole } from './auth.js';
import { createElement } from './dom.js';

const CLIENT_LINKS = [
  { label: 'Explorar', href: './catalogo.html', file: 'catalogo.html' },
  { label: 'Mis préstamos', href: './mis-prestamos.html', file: 'mis-prestamos.html' },
  { label: 'Mi rincón', href: './perfil.html', file: 'perfil.html' }
];

const STAFF_LINKS = [
  { label: 'Panorama', href: './dashboard.html', file: 'dashboard.html' },
  { label: 'Estantería', href: './recursos.html', file: 'recursos.html' },
  { label: 'Préstamos', href: './gestion-prestamos.html', file: 'gestion-prestamos.html' },
  { label: 'Caja', href: './pos.html', file: 'pos.html' }
];

const VISITOR_LINKS = [
  { label: 'Explorar', href: './catalogo.html', file: 'catalogo.html' },
  { label: 'Entrar', href: '../auth/login.html' },
  { label: 'Crear cuenta', href: '../auth/registro.html' }
];

export function initializeAppShell() {
  const header = document.querySelector('[data-app-header]');
  if (!header) {
    return;
  }

  const session = getSession();
  const role = normalizeRole(session?.role);
  const isStaff = ['ADMIN', 'ADMINISTRADOR', 'BIBLIOTECARIO'].includes(role);
  const links = !session ? VISITOR_LINKS : isStaff ? STAFF_LINKS : CLIENT_LINKS;

  const container = createElement('div', 'barra-app');
  const brand = createElement('a', 'marca');
  const seal = createElement('span', 'marca-sello', 'B');
  seal.setAttribute('aria-hidden', 'true');
  const brandName = createElement('span', '', 'Biblioteca Villa');
  brand.append(seal, brandName);
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
  if (session) {
    const identity = createElement('div', 'cuenta-identidad');
    identity.append(
      createElement('span', 'cuenta-nombre', session.name || 'Usuario'),
      createElement('span', 'cuenta-rol', isStaff ? 'Equipo de biblioteca' : 'Lector')
    );
    account.append(identity);

    const logout = createElement('button', 'boton boton--secundario boton--pequeno', 'Salir');
    logout.type = 'button';
    logout.dataset.logout = '';
    account.append(logout);
  } else {
    account.append(createElement('span', 'cuenta-nombre', 'Visita la biblioteca'));
  }

  container.append(brand, navigation, account);
  header.replaceChildren(container);
}
