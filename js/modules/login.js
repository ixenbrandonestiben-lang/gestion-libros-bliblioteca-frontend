import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { getRoleHome, getUserFromResponse, saveSession } from '../utils/auth.js';
import { clearMessage, showMessage } from '../utils/dom.js';

const form = document.querySelector('[data-login-form]');
const message = document.querySelector('[data-form-message]');

for (const toggle of document.querySelectorAll('[data-toggle-password]')) {
  toggle.addEventListener('click', () => {
    const input = toggle.closest('.password-control').querySelector('input');
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Ocultar' : 'Ver';
    toggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    toggle.setAttribute('aria-pressed', String(visible));
  });
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(message);

  if (!form.reportValidity()) {
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const originalLabel = submitButton.textContent;
  submitButton.textContent = 'Abriendo tu biblioteca…';

  const formData = new FormData(form);
  const credentials = {
    correo: String(formData.get('email')).trim(),
    contrasena: String(formData.get('password'))
  };

  try {
    const response = await apiFetch(API_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const user = getUserFromResponse(response);
    const session = saveSession(user, response?.data?.token);
    window.location.assign(getRoleHome(session.role));
  } catch (error) {
    showMessage(message, error.message || 'No se pudo iniciar sesión. Inténtalo nuevamente.', 'error');
    submitButton.textContent = originalLabel;
    submitButton.disabled = false;
  }
});

if (new URLSearchParams(window.location.search).has('logout')) {
  showMessage(message, 'Tu sesión se cerró en este dispositivo.', 'success');
}
