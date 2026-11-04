import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { createElement } from '../utils/dom.js';

const profile = document.querySelector('[data-profile]');
const status = document.querySelector('[data-profile-status]');

function renderProfile(response) {
  const user = response?.usuario ?? response?.user ?? response?.data ?? response;
  const fields = [
    ['Nombre', user.nombre ?? user.name ?? user.nombres],
    ['Apellido', user.apellido ?? user.apellidos],
    ['Correo electrónico', user.email],
    ['Teléfono', user.telefono ?? user.phone],
    ['Tipo de cuenta', user.tipo_cliente ?? user.rol ?? user.role]
  ];
  const fragment = document.createDocumentFragment();

  for (const [label, value] of fields) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    fragment.append(createElement('dt', '', label), createElement('dd', '', value));
  }

  if (fragment.childElementCount === 0) {
    throw new Error('La API no devolvió información de perfil reconocible.');
  }

  profile.replaceChildren(fragment);
  profile.setAttribute('aria-busy', 'false');
  status.textContent = 'Perfil cargado.';
}

async function loadProfile() {
  try {
    renderProfile(await apiFetch(API_ENDPOINTS.profile));
  } catch (error) {
    profile.setAttribute('aria-busy', 'false');
    status.textContent = error.status === 404
      ? 'El endpoint de perfil aún no está disponible en el backend.'
      : error.message || 'No se pudo cargar el perfil.';
  }
}

loadProfile();
