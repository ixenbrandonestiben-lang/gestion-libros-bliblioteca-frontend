import { API_ENDPOINTS, apiFetch } from '../config/api.js';
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

  const payload = {
    nombre: String(formData.get('nombre')).trim(),
    apellido: String(formData.get('apellido')).trim(),
    email: String(formData.get('email')).trim(),
    telefono: String(formData.get('telefono')).trim(),
    password
  };

  try {
    await apiFetch(API_ENDPOINTS.register, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showMessage(message, 'Registro enviado. Ya puedes iniciar sesión.', 'success');
    form.reset();
  } catch (error) {
    showMessage(message, error.message || 'No se pudo completar el registro.', 'error');
  } finally {
    submitButton.disabled = false;
  }
});
