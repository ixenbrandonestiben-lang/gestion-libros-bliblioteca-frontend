export const API_BASE_URL = 'http://localhost:3001/api/v1';

export const API_ENDPOINTS = Object.freeze({
  login: 'auth/login',
  register: 'auth/register',
  logout: 'auth/logout',
  profile: 'auth/me',
  books: 'libros',
  loans: 'prestamos',
  myLoans: 'prestamos',
  returns: (loanId) => `prestamos/${encodeURIComponent(loanId)}/devolucion`,
  sales: 'ventas'
});

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(path, options = {}) {
  const endpoint = String(path).replace(/^\/+/, '');
  const headers = new Headers(options.headers);
  const storedSession = sessionStorage.getItem('biblioteca-villa-session');

  if (storedSession) {
    const session = JSON.parse(storedSession);
    if (session?.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
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
      `No se pudo conectar con la API en ${API_BASE_URL}. Inicia el backend y verifica que CORS permita el origen de esta página.`,
      0,
      { cause: error }
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';

  if (response.status !== 204) {
    data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? data.message
      : `Error de API (${response.status})`;

    throw new ApiError(message, response.status, data);
  }

  return data;
}