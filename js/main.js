import { initializeTheme } from './utils/theme.js';
import { endSession } from './utils/auth.js';
import { notify } from './utils/dom.js';
import { initializeAppShell } from './utils/app-shell.js';

initializeTheme();
initializeAppShell();

document.addEventListener('click', async (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const logoutButton = event.target.closest('[data-logout]');
  if (!logoutButton) {
    return;
  }

  logoutButton.disabled = true;

  try {
    await endSession();
    window.location.href = '../auth/login.html';
  } catch (error) {
    notify(`La sesión se cerró localmente. El servidor no confirmó la salida: ${error.message}`, 'error');
    window.setTimeout(() => {
      window.location.href = '../auth/login.html?logout=local';
    }, 1400);
  }
});