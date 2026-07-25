const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const themeToggle = document.querySelector('.theme-toggle');

function effectiveTheme() {
  return document.documentElement.dataset.theme
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function updateThemeToggle() {
  if (!themeToggle) return;
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  themeToggle.textContent = next === 'dark' ? '☾ Dark' : '☀ Light';
  themeToggle.setAttribute('aria-label', `Use ${next} theme`);
}

themeToggle?.addEventListener('click', () => {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('opalinx-theme', next);
  updateThemeToggle();
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!localStorage.getItem('opalinx-theme')) updateThemeToggle();
});

updateThemeToggle();

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

nav?.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
});
