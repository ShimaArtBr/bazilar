// nav.js — BAZILAR Didático

export function initNav({ current = 0, total = 12 } = {}) {
  // ── Toggle de tema ──────────────────────────────────
  const saved = localStorage.getItem('bz-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  window.toggleTheme = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bz-theme', next);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
  };

  // ── Progress bar de scroll ──────────────────────────
  const fill = document.querySelector('.scroll-bar-fill');
  if (fill) {
    const onScroll = () => {
      const t = document.documentElement.scrollHeight - window.innerHeight;
      const pct = t > 0 ? (window.scrollY / t) * 100 : 0;
      fill.style.width = pct + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ── Indicador de nível ──────────────────────────────
  const badge = document.querySelector('.nav-progress');
  if (badge && current > 0) {
    badge.innerHTML = `Nível <span>${current}</span> / ${total}`;
  }

  // ── Ícone de tema ───────────────────────────────────
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = saved === 'dark' ? '☀️' : '🌙';

  // ── Ocultar cards locked ────────────────────────────
  document.querySelectorAll('.trail-card.locked').forEach(el => {
    el.style.display = 'none';
  });

  // ── Animação escalonada por grupo ───────────────────
  if (!('IntersectionObserver' in window)) return;

  // Agrupa cards por grid pai para calcular delay individual dentro do grupo
  const grids = document.querySelectorAll('.trail-grid');
  grids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll('[data-glyph]:not(.locked)'));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx = cards.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 80}ms`;
        entry.target.classList.add('glyph-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    cards.forEach(el => obs.observe(el));
  });

  // Páginas de nível — hero-glyph e outros [data-glyph] fora de grids
  document.querySelectorAll('[data-glyph]:not(.trail-grid [data-glyph])').forEach((el, i) => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${i * 60}ms`;
        entry.target.classList.add('glyph-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    obs.observe(el);
  });
}
