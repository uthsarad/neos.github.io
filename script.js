const THEME_KEY = 'neos-theme-choice';
const THEMES = ['dawn', 'morning', 'afternoon', 'dusk', 'night'];
const RELEASES_API = 'https://api.github.com/repos/uthsarad/NeOS/releases';
const TIME_SERVER_API = 'https://worldtimeapi.org/api/timezone/Pacific/Kiritimati';

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
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  const btn = document.getElementById('nav-' + id);
  if (btn) btn.classList.add('active');
  const nav = document.getElementById('sticky-nav');
  const navTop = nav.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: navTop - 10, behavior: 'smooth' });
  setTimeout(triggerReveals, 80);
}

function showArticle(id, el) {
  document.querySelectorAll('.help-article').forEach((a) => a.classList.remove('active'));
  document.getElementById('article-' + id).classList.add('active');
  document.querySelectorAll('.help-nav-link').forEach((l) => l.classList.remove('active'));
  el.classList.add('active');
}

function formatReleaseDate(isoString) {
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return 'Unknown date';
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderReleases(releases) {
  const list = document.getElementById('release-list');
  const latestLink = document.getElementById('latest-release-link');
  const latestDetails = document.getElementById('latest-release-details');
  if (!list || !latestLink || !latestDetails) return;

  if (!Array.isArray(releases) || releases.length === 0) {
    latestDetails.textContent = 'No public releases available right now.';
    list.innerHTML = '<li class="release-item release-item-muted">No releases found.</li>';
    return;
  }

  const latest = releases[0];
  latestLink.href = latest.html_url || 'https://github.com/uthsarad/NeOS/releases/latest';
  latestDetails.textContent = `${latest.name || latest.tag_name} · Published ${formatReleaseDate(latest.published_at)}`;

  list.innerHTML = releases
    .slice(0, 8)
    .map((release) => {
      const title = release.name || release.tag_name;
      return `<li class="release-item"><a href="${release.html_url}" target="_blank" rel="noopener noreferrer">${title}</a><span class="release-date">${formatReleaseDate(release.published_at)}</span></li>`;
    })
    .join('');
}

async function initReleaseFeed() {
  const list = document.getElementById('release-list');
  const latestDetails = document.getElementById('latest-release-details');
  if (!list || !latestDetails) return;

  try {
    const response = await fetch(RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github+json'
      }
    });

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

    const releases = await response.json();
    renderReleases(releases.filter((release) => !release.draft));
  } catch (error) {
    latestDetails.textContent = 'Unable to load the latest release automatically right now.';
    list.innerHTML = '<li class="release-item release-item-muted">Could not fetch release history.</li>';
  }
}

function setFooterYear(year) {
  const yearNode = document.getElementById('footer-year');
  if (yearNode) yearNode.textContent = String(year);
}

function getUtcPlus14YearFallback() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const utcPlus14 = new Date(utcMs + (14 * 60 * 60 * 1000));
  return utcPlus14.getUTCFullYear();
}

async function initFooterYearFromTimeServer() {
  try {
    const response = await fetch(TIME_SERVER_API);
    if (!response.ok) throw new Error(`Time server error: ${response.status}`);

    const payload = await response.json();
    const sourceDate = new Date(payload.datetime);
    if (Number.isNaN(sourceDate.getTime())) throw new Error('Invalid time payload');

    setFooterYear(sourceDate.getFullYear());
  } catch (error) {
    setFooterYear(getUtcPlus14YearFallback());
  }
}

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

function triggerReveals() {
  document.querySelectorAll('.page.active .reveal').forEach((el) => revealObs.observe(el));
}

window.addEventListener('load', () => {
  initTheme();
  initReleaseFeed();
  initFooterYearFromTimeServer();
  triggerReveals();
  document.querySelectorAll('.what-card, .stat-cell, .support-card, .dl-card').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.06) + 's';
  });
});
