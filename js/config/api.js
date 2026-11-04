export const API_BASE_URL = 'http://localhost:3000/api/v1';

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

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (options.body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

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