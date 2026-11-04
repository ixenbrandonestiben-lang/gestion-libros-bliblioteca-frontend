import { API_ENDPOINTS, apiFetch } from '../config/api.js';
import { getRoleHome, getUserFromResponse, saveSession } from '../utils/auth.js';
import { clearMessage, showMessage } from '../utils/dom.js';

const form = document.querySelector('[data-login-form]');
const message = document.querySelector('[data-form-message]');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(message);

  if (!form.reportValidity()) {
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;

  const formData = new FormData(form);
  const credentials = {
    email: String(formData.get('email')).trim(),
    password: String(formData.get('password'))
  };

  try {
    const response = await apiFetch(API_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const user = getUserFromResponse(response);
    const session = saveSession(user);
    window.location.assign(getRoleHome(session.role));
  } catch (error) {
    if (error.data?.codigo === 'CLIENTE_EN_MORA' || error.data?.en_mora === true) {
      showMessage(message, error.message || 'Tu cuenta tiene préstamos vencidos. Contacta a la biblioteca.', 'error');
    } else {
      showMessage(message, error.message || 'No se pudo iniciar sesión. Inténtalo nuevamente.', 'error');
    }
    submitButton.disabled = false;
  }
});
