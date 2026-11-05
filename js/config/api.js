const configuredApiUrl = globalThis.BIBLIOTECA_API_URL ?? 'http://localhost:3001/api/v1';

export const API_BASE_URL = String(configuredApiUrl).replace(/\/+$/, '');

export const API_ENDPOINTS = Object.freeze({
  login: 'auth/login',
  register: 'auth/register',
  logout: 'auth/logout',
  profile: 'auth/me',
  books: 'libros',
  authors: 'autores',
  publishers: 'editoriales',
  genres: 'generos-literarios',
  clients: 'clientes',
  staff: 'empleados',
  loans: 'prestamos',
  sales: 'ventas',
  loan: (id) => `prestamos/${encodeURIComponent(id)}`,
  returnLoan: (id) => `prestamos/${encodeURIComponent(id)}/devolucion`,
  sale: (id) => `ventas/${encodeURIComponent(id)}`,
  book: (id) => `libros/${encodeURIComponent(id)}`
});

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getSessionToken() {
  const rawSession = sessionStorage.getItem('biblioteca-villa-session');
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession)?.token ?? null;
  } catch {
    sessionStorage.removeItem('biblioteca-villa-session');
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const endpoint = String(path).replace(/^\/+/, '');
  const headers = new Headers(options.headers);
  const token = getSessionToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(
      `No se pudo conectar con la API en ${API_BASE_URL}. Comprueba que el backend esté iniciado y permita el origen de esta página.`,
      0,
      { cause: error }
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (response.status !== 204) {
    const body = await response.text();
    if (body) {
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(body);
        } catch {
          throw new ApiError('La API devolvió una respuesta JSON no válida.', response.status, body);
        }
      } else {
        data = body;
      }
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? data.message
      : `Error de API (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}
