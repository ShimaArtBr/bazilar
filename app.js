/**
 * app.js — Controlador principal do BAZILAR
 */
import { renderResults } from './render.js';
import { setLang }       from './i18n.js';
import { initGeocoding } from './geocoding.js';
import { initDrumPicker } from './drum.js';

const $ = id => document.getElementById(id);

let _result = null;
let _gender = 'M';
let _dark   = true;

// ── Tema ───────────────────────────────────
function applyTheme() {
  document.documentElement.dataset.theme = _dark ? 'dark' : 'light';
  const btn = $('theme-btn');
  if (btn) btn.textContent = _dark ? '☀️' : '🌙';
}
$('theme-btn')?.addEventListener('click', () => { _dark = !_dark; applyTheme(); });
applyTheme();

// ── Idioma ─────────────────────────────────
$('langBtn')?.addEventListener('click', () => {
  const menu     = $('langMenu');
  const expanded = $('langBtn').getAttribute('aria-expanded') === 'true';
  menu.style.display = expanded ? 'none' : 'block';
  $('langBtn').setAttribute('aria-expanded', String(!expanded));
});

document.querySelectorAll('.lang-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    setLang(lang);
    document.documentElement.lang = lang;
    const lbl = $('langLabel');
    if (lbl) lbl.textContent = lang.toUpperCase();
    $('langMenu').style.display = 'none';
    $('langBtn')?.setAttribute('aria-expanded', 'false');
    if (_result) renderOut(_result);
  });
});

// Fecha menu de idioma ao clicar fora
document.addEventListener('click', e => {
  if (!e.target.closest('.lang-wrap')) {
    const m = $('langMenu');
    if (m) m.style.display = 'none';
    $('langBtn')?.setAttribute('aria-expanded', 'false');
  }
});

// ── Género ─────────────────────────────────
document.querySelectorAll('.gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    _gender = btn.dataset.g;
    document.querySelectorAll('.gender-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
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

// ── Advanced panel (Early Zǐ) ──────────────
const advToggle = $('advToggle');
const advPanel  = $('advPanel');
if (advToggle && advPanel) {
  advToggle.addEventListener('click', () => {
    const isOpen = advPanel.style.display === 'block';
    advPanel.style.display = isOpen ? 'none' : 'block';
    advToggle.classList.toggle('open', !isOpen);
  });
}

// ── Calcular ───────────────────────────────
$('calcBtn')?.addEventListener('click', async () => {
  const spinner  = $('spinner');
  const resultEl = $('result');

  spinner.hidden = false;
  resultEl.innerHTML = '';

  const earlyZi = document.querySelector('input[name="early-zi"]:checked')?.value === '1';

  const body = {
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

  // Mostra erro legível se dados inválidos
  if (!body.year || !body.month || !body.day) {
    resultEl.innerHTML = `<div class="error-msg">⚠ Preencha data, hora e localização.</div>`;
    spinner.hidden = true;
    return;
  }

  try {
    const res = await fetch('/api/calculate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const txt = await res.text();

    if (!res.ok) {
      resultEl.innerHTML = `<div class="error-msg">Erro ${res.status}: ${txt}</div>`;
      return;
    }

    _result = JSON.parse(txt);
    _result._name   = ($('name')?.value || '').trim();
    _result._gender = _gender;
    renderOut(_result);

  } catch (err) {
    resultEl.innerHTML = `<div class="error-msg">❌ ${err.message}<br><small>Verifique o console do browser para detalhes.</small></div>`;
    console.error('[BAZILAR]', err);
  } finally {
    spinner.hidden = true;
  }
});

// ── Renderização ───────────────────────────
function renderOut(r) {
  const resultEl = $('result');
  try {
    resultEl.innerHTML = renderResults(r);
    activateTabs();
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(err) {
    resultEl.innerHTML = `<div class="error-msg">Erro ao renderizar: ${err.message}</div>`;
    console.error('[BAZILAR render]', err);
  }
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
      b.setAttribute('aria-selected', String(b === btn));
    });
    resultEl.querySelectorAll('.rtab-panel').forEach(p => {
      p.classList.toggle('rtab-panel--active', p.id === `panel-${target}`);
    });
  });
}
