/**
 * app.js — Controlador principal do BAZILAR
 */
import { renderResults } from './render.js';
import { setLang, LANG }  from './i18n.js';
import { geoDebounce, setTZSelect } from './geocoding.js';

// ── Estado global ──────────────────────────
let _result  = null;
let _gender  = 'M';
let _dark    = true;
let _lang    = 'pt';

// ── DOM ────────────────────────────────────
const $ = id => document.getElementById(id);
const form     = $('bazi-form');
const resultEl = $('result');
const spinner  = $('spinner');
const genderBtns = document.querySelectorAll('.gender-btn');
const langSel    = $('lang-sel');
const themeBtn   = $('theme-btn');
const cityIn     = $('city');
const latIn      = $('lat');
const lngIn      = $('lng');
const tzSel      = $('tz');
const dstChk     = $('dst');

// ── Tema ───────────────────────────────────
function applyTheme() {
  document.documentElement.dataset.theme = _dark ? 'dark' : 'light';
  if (themeBtn) themeBtn.textContent = _dark ? '☀️' : '🌙';
}
themeBtn?.addEventListener('click', () => { _dark = !_dark; applyTheme(); });
applyTheme();

// ── Género ─────────────────────────────────
genderBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    _gender = btn.dataset.g;
    genderBtns.forEach(b => b.classList.toggle('active', b === btn));
    if (_result) renderOut(_result);
  });
});

// ── Idioma ─────────────────────────────────
langSel?.addEventListener('change', () => {
  _lang = langSel.value;
  setLang(_lang);
  if (_result) renderOut(_result);
});

// ── Geocodificação ─────────────────────────
cityIn?.addEventListener('input', geoDebounce(cityIn, latIn, lngIn, tzSel));

// ── Hora agora ─────────────────────────────
$('now-btn')?.addEventListener('click', () => {
  const now = new Date();
  $('hour').value  = String(now.getHours()).padStart(2,'0');
  $('min').value   = String(now.getMinutes()).padStart(2,'0');
});

// ── Submissão ──────────────────────────────
form?.addEventListener('submit', async e => {
  e.preventDefault();
  spinner.hidden = false;
  resultEl.innerHTML = '';

  const body = {
    year:      +$('year').value,
    month:     +$('month').value,
    day:       +$('day').value,
    hour:      +($('hour').value || '0'),
    minute:    +($('min').value  || '0'),
    longitude: +lngIn.value,
    latitude:  +latIn.value,
    timezone:  +tzSel.value,
    dst:       dstChk.checked,
    gender:    _gender,
  };

  try {
    const res  = await fetch('/api/calculate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    _result = await res.json();
    renderOut(_result);
  } catch (err) {
    resultEl.innerHTML = `<div class="error-msg">Erro: ${err.message}</div>`;
  } finally {
    spinner.hidden = true;
  }
});

// ── Renderização ───────────────────────────
function renderOut(r) {
  resultEl.innerHTML = renderResults(r);
  activateTabs();
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Lógica de abas ─────────────────────────
function activateTabs() {
  const bar    = resultEl.querySelector('.rtab-bar');
  const panels = resultEl.querySelectorAll('.rtab-panel');
  if (!bar) return;

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.rtab-btn');
    if (!btn) return;
    const target = btn.dataset.tab;

    bar.querySelectorAll('.rtab-btn').forEach(b => {
      b.classList.toggle('rtab-btn--active', b === btn);
      b.setAttribute('aria-selected', b === btn);
    });
    panels.forEach(p => {
      p.classList.toggle('rtab-panel--active', p.id === `panel-${target}`);
    });
  });

  // Teclado
  bar.addEventListener('keydown', e => {
    const btns = [...bar.querySelectorAll('.rtab-btn')];
    const cur  = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowRight') btns[(cur + 1) % btns.length]?.click();
    if (e.key === 'ArrowLeft')  btns[(cur - 1 + btns.length) % btns.length]?.click();
  });
}
