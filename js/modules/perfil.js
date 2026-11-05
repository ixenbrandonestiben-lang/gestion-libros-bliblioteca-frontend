import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement, formatDate, unwrapRecord } from '../utils/dom.js';

const profile = document.querySelector('[data-profile]');
const status = document.querySelector('[data-profile-status]');
const layout = document.querySelector('.profile-layout');
const name = document.querySelector('[data-profile-name]');
const role = document.querySelector('[data-profile-role]');
const monogram = document.querySelector('[data-profile-monogram]');

function renderProfile(response) {
  const user = unwrapRecord(response);
  const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ');
  name.textContent = fullName || 'Lector de Biblioteca Villa';
  monogram.textContent = fullName
    ? fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('es')
    : 'B';
  role.textContent = user.rol === 'CLIENTE_PREMIUM' ? 'Miembro premium' : 'Miembro lector';

  const fields = [
    ['Correo electrónico', user.correo],
    ['DPI', user.dpi],
    ['Teléfono', user.telefono],
    ['Tipo de cuenta', user.rol],
    ['Estado de cuenta', user.estado_cuenta],
    ['Desde', formatDate(user.created_at)]
  ];
  const fragment = document.createDocumentFragment();
  for (const [label, value] of fields) {
    if (value === undefined || value === null || value === '') continue;
    fragment.append(createElement('dt', '', label), createElement('dd', '', value));
  }
  if (fragment.childElementCount === 0) {
    throw new Error('La API no devolvió información reconocible para tu perfil.');
  }

  profile.replaceChildren(fragment);
  layout.setAttribute('aria-busy', 'false');
  status.textContent = 'Este es el perfil vinculado a tu cuenta.';
}

async function loadProfile() {
  try {
    renderProfile(await apiFetch(API_ENDPOINTS.profile));
  } catch (error) {
    layout.setAttribute('aria-busy', 'false');
    status.textContent = error.message || 'No pudimos abrir tu perfil.';
  }
}

loadProfile();
