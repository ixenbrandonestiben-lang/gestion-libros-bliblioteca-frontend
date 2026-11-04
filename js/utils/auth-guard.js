(function () {
  const script = document.currentScript;
  const allowedRoles = (script?.dataset.requiredRoles || '')
    .split(',')
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean);

  if (allowedRoles.length === 0) {
    return;
  }

  const loginUrl = script.dataset.loginUrl;
  const forbiddenUrl = script.dataset.forbiddenUrl;
  const sessionKey = 'biblioteca-villa-session';
  let session = null;

  try {
    session = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
  } catch {
    sessionStorage.removeItem(sessionKey);
  }

  if (!session?.role) {
    window.location.replace(loginUrl);
    return;
  }

  const role = String(session.role).toUpperCase();
  if (!allowedRoles.includes(role)) {
    window.location.replace(forbiddenUrl);
  }
})();