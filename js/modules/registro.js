import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { getRoleHome, getUserFromResponse, saveSession } from '../utils/auth.js';
import { clearMessage, showMessage } from '../utils/dom.js';

const form = document.querySelector('[data-register-form]');
const message = document.querySelector('[data-form-message]');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(message);

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const password = String(formData.get('password'));
  if (password !== String(formData.get('password-confirmation'))) {
    showMessage(message, 'Las contraseñas no coinciden.', 'error');
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const originalLabel = submitButton.textContent;
  submitButton.textContent = 'Creando tu rincón…';

  const telefono = String(formData.get('telefono')).trim();
  const payload = {
    dpi: String(formData.get('dpi')).trim(),
    nombre: String(formData.get('nombre')).trim(),
    apellido: String(formData.get('apellido')).trim(),
    correo: String(formData.get('email')).trim(),
    ...(telefono ? { telefono } : {}),
    contrasena: password
  };

  try {
    const response = await apiFetch(API_ENDPOINTS.register, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const user = getUserFromResponse(response);
    const session = saveSession(user, response?.data?.token);
    window.location.assign(getRoleHome(session.role));
  } catch (error) {
    showMessage(message, error.message || 'No se pudo completar el registro.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

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
