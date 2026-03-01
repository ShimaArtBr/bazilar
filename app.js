/**
 * app.js — Controlador principal do BAZILAR
 */
import { renderResults } from './render.js';
import { setLang }       from './i18n.js';
import { initGeocoding } from './geocoding.js';
import { initDrumPicker, getDrumValues } from './drum.js';

// ── Helpers ────────────────────────────────
const $ = id => document.getElementById(id);

// ── Estado ─────────────────────────────────
let _result = null;
let _gender = 'M';
let _dark   = true;
let _lang   = 'pt';

// ── Tema ───────────────────────────────────
function applyTheme() {
  document.documentElement.dataset.theme = _dark ? 'dark' : 'light';
  const btn = $('theme-btn');
  if (btn) btn.textContent = _dark ? '☀️' : '🌙';
}
$('theme-btn')?.addEventListener('click', () => { _dark = !_dark; applyTheme(); });
applyTheme();

// ── Idioma ─────────────────────────────────
document.querySelectorAll('.lang-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    _lang = btn.dataset.lang;
    setLang(_lang);
    document.documentElement.lang = _lang;
    const lbl = $('langLabel');
    if (lbl) lbl.textContent = _lang.toUpperCase();
    $('langMenu').style.display = 'none';
    $('langBtn')?.setAttribute('aria-expanded', 'false');
    if (_result) renderOut(_result);
  });
});
$('langBtn')?.addEventListener('click', () => {
  const menu     = $('langMenu');
  const expanded = $('langBtn').getAttribute('aria-expanded') === 'true';
  menu.style.display = expanded ? 'none' : 'block';
  $('langBtn').setAttribute('aria-expanded', !expanded);
});

// ── Gérero ─────────────────────────────────
document.querySelectorAll('.gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    _gender = btn.dataset.g;
    document.querySelectorAll('.gender-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    if (_result) renderOut(_result);
  });
});

// ── Geocodificação ─────────────────────────
initGeocoding();

// ── Drum Picker ────────────────────────────
const drumEl = $('drum-picker');
if (drumEl) {
  initDrumPicker(drumEl);
  drumEl.addEventListener('drum-change', e => {
    const el = $(e.detail.id);
    if (el) el.value = e.detail.value;
  });
}

// ── Advanced (Early Zǐ) ────────────────────
$('advToggle')?.addEventListener('click', () => {
  $('advToggle').classList.toggle('open');
  $('advPanel').classList.toggle('open');
});

// ── Calcular ───────────────────────────────
$('calcBtn')?.addEventListener('click', async () => {
  const spinner  = $('spinner');
  const resultEl = $('result');

  spinner.hidden = false;
  resultEl.innerHTML = '';

  const earlyZi = document.querySelector('input[name="early-zi"]:checked')?.value === '1';

  const body = {
    name:      ($('name')?.value || '').trim() || undefined,
    year:      +$('year').value,
    month:     +$('month').value,
    day:       +$('day').value,
    hour:      +($('hour').value  || '0'),
    minute:    +($('min').value   || '0'),
    longitude: +$('lng').value,
    latitude:  +$('lat').value,
    timezone:  +$('tz').value,
    dst:       $('dst').checked,
    gender:    _gender,
    earlyZi,
  };

  try {
    const res = await fetch('/api/calculate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt);
    }
    _result = await res.json();
    _result._name   = body.name;
    _result._gender = _gender;
    renderOut(_result);
  } catch (err) {
    resultEl.innerHTML = `<div class="error-msg">Erro: ${err.message}</div>`;
  } finally {
    spinner.hidden = true;
  }
});

// ── Renderização ───────────────────────────
function renderOut(r) {
  const resultEl = $('result');
  resultEl.innerHTML = renderResults(r);
  activateTabs();
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Abas ───────────────────────────────────
function activateTabs() {
  const resultEl = $('result');
  const bar      = resultEl?.querySelector('.rtab-bar');
  if (!bar) return;

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.rtab-btn');
    if (!btn) return;
    const target = btn.dataset.tab;
    bar.querySelectorAll('.rtab-btn').forEach(b => {
      b.classList.toggle('rtab-btn--active', b === btn);
      b.setAttribute('aria-selected', b === btn);
    });
    resultEl.querySelectorAll('.rtab-panel').forEach(p => {
      p.classList.toggle('rtab-panel--active', p.id === `panel-${target}`);
    });
  });

  bar.addEventListener('keydown', e => {
    const btns = [...bar.querySelectorAll('.rtab-btn')];
    const cur  = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowRight') btns[(cur + 1) % btns.length]?.click();
    if (e.key === 'ArrowLeft')  btns[(cur - 1 + btns.length) % btns.length]?.click();
  });
}
