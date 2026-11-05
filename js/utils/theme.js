const THEME_STORAGE_KEY = 'biblioteca-villa-theme';

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
}

function getActiveTheme() {
  const selectedTheme = document.documentElement.dataset.theme;

  if (selectedTheme === 'light' || selectedTheme === 'dark') {
    return selectedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function initializeTheme() {
  const savedTheme = getPreferredTheme();

  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }

  const button = document.createElement('button');
  button.className = 'theme-toggle';
  button.type = 'button';
  button.setAttribute('aria-pressed', String(getActiveTheme() === 'dark'));

  const updateButton = () => {
    const isDark = getActiveTheme() === 'dark';
    button.textContent = isDark ? '☼  Tema claro' : '◐  Tema noche';
    button.setAttribute('aria-label', isDark ? 'Cambiar al tema claro' : 'Cambiar al tema oscuro');
    button.setAttribute('aria-pressed', String(isDark));
  };

  button.addEventListener('click', () => {
    const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    updateButton();
  });

  updateButton();
  document.body.prepend(button);
}