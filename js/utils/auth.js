import { API_ENDPOINTS, apiFetch } from '../config/api.js';

const SESSION_KEY = 'biblioteca-villa-session';

export function normalizeRole(role) {
  return String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replaceAll(' ', '_');
}

export function getSession() {
  const storedSession = sessionStorage.getItem(SESSION_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    throw new Error('La sesión local está dañada. Inicia sesión nuevamente.');
  }
}

export function saveSession(user, token) {
  if (!user || typeof user !== 'object' || typeof token !== 'string' || !token) {
    throw new Error('La respuesta de autenticación no contiene una sesión válida.');
  }

  const session = {
    id: user.id ?? user.id_cliente ?? null,
    name: [user.nombre, user.apellido].filter(Boolean).join(' ')
      || user.name
      || user.correo
      || 'Usuario',
    email: user.correo ?? user.email ?? '',
    role: normalizeRole(user.rol ?? user.role ?? user.tipo_usuario),
    token
  };

  if (!session.role) {
    throw new Error('La respuesta de autenticación no incluye el rol del usuario.');
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function endSession() {
  await apiFetch(API_ENDPOINTS.logout, { method: 'POST' });
  sessionStorage.removeItem(SESSION_KEY);
}

export function getUserFromResponse(response) {
  const payload = response?.data ?? response;
  return payload?.user ?? payload?.usuario ?? response?.usuario ?? response?.user ?? payload;
}

export function getRoleHome(role) {
  const normalizedRole = normalizeRole(role);
  if (['ADMIN', 'ADMINISTRADOR', 'BIBLIOTECARIO'].includes(normalizedRole)) {
    return '../admin/dashboard.html';
  }

  if (['CLIENTE_REGULAR', 'CLIENTE_PREMIUM', 'CLIENTE'].includes(normalizedRole)) {
    return '../cliente/catalogo.html';
  }

  throw new Error('Tu cuenta tiene un rol no reconocido. Contacta al administrador.');
}
