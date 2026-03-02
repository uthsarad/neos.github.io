const THEME_KEY = 'neos-theme-choice';
const THEMES = ['dawn', 'morning', 'afternoon', 'dusk', 'night'];

function getThemeForHour(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function getAdaptiveTheme() {
  const hour = new Date().getHours();
  if (Number.isInteger(hour)) return getThemeForHour(hour);
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'morning';
}

function applyTheme(themeName) {
  const theme = THEMES.includes(themeName) ? themeName : getAdaptiveTheme();
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.themeChoice === theme);
  });
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored && THEMES.includes(stored)) {
    applyTheme(stored);
  } else {
    applyTheme(getAdaptiveTheme());
  }

  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const chosen = btn.dataset.themeChoice;
      localStorage.setItem(THEME_KEY, chosen);
      applyTheme(chosen);
    });
  });
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('nav-' + id);
  if (btn) btn.classList.add('active');
  const nav = document.getElementById('sticky-nav');
  const navTop = nav.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: navTop - 10, behavior: 'smooth' });
  setTimeout(triggerReveals, 80);
}

function showArticle(id, el) {
  document.querySelectorAll('.help-article').forEach(a => a.classList.remove('active'));
  document.getElementById('article-' + id).classList.add('active');
  document.querySelectorAll('.help-nav-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
}

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

function triggerReveals() {
  document.querySelectorAll('.page.active .reveal').forEach(el => revealObs.observe(el));
}

window.addEventListener('load', () => {
  initTheme();
  triggerReveals();
  document.querySelectorAll('.what-card, .stat-cell, .support-card, .dl-card').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.06) + 's';
  });
});
