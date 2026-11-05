export function showMessage(element, message, type = 'info') {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.dataset.state = type;
  element.hidden = false;
}

export function clearMessage(element) {
  if (!element) {
    return;
  }

  element.textContent = '';
  element.hidden = true;
  delete element.dataset.state;
}

export function unwrapList(response, keys = []) {
  if (Array.isArray(response)) {
    return response;
  }

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.results)) {
    return response.results;
  }

  throw new Error('La API no respondió con una colección válida.');
}

export function unwrapRecord(response) {
  return response?.data ?? response?.record ?? response;
}

export function createElement(tag, className = '', text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = String(text);
  }
  return element;
}

export function formatDate(value, options = {}) {
  if (!value) {
    return '—';
  }

  const datePart = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const date = datePart
    ? new Date(Number(datePart[1]), Number(datePart[2]) - 1, Number(datePart[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(date);
}

export function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }

  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(amount);
}

export function notify(message, type = 'info') {
  let region = document.querySelector('[data-toast-region]');
  if (!region) {
    region = createElement('div', 'toast-region');
    region.dataset.toastRegion = '';
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }

  const toast = createElement('div', 'toast', message);
  toast.dataset.state = type;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 4800);
}
