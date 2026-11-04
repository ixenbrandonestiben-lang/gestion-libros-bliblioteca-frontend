import { initializeTheme } from './utils/theme.js';
import { endSession } from './utils/auth.js';
import { showMessage } from './utils/dom.js';
import { initializeAppShell } from './utils/app-shell.js';

initializeTheme();
initializeAppShell();

document.addEventListener('click', async (event) => {
  const logoutButton = event.target.closest('[data-logout]');
  if (!logoutButton) {
    return;
  }

  const message = document.querySelector('[data-global-message]');
  logoutButton.disabled = true;

  try {
    await endSession();
    window.location.href = '../auth/login.html';
  } catch (error) {
    logoutButton.disabled = false;
    if (message) {
      showMessage(message, error.message, 'error');
    } else {
      window.alert(error.message);
    }
  }
});