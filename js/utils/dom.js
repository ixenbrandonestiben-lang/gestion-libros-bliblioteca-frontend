export function showMessage(element, message, type = 'info') {
  element.textContent = message;
  element.dataset.state = type;
  element.hidden = false;
}

export function clearMessage(element) {
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

  throw new Error('La API no respondió con una lista válida.');
}

export function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = String(text);
  }
  return element;
}

export function formatDate(value) {
  if (!value) {
    return 'No indicada';
  }

  const datePart = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const date = datePart
    ? new Date(Number(datePart[1]), Number(datePart[2]) - 1, Number(datePart[3]))
    : new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('es-GT').format(date);
}
