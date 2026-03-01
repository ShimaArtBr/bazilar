/**
 * app.js — Controlador BAZILAR
 */
import { renderResults } from './render.js';
import { setLang }       from './i18n.js';
import { initGeo }       from './geo.js';

const $ = id => document.getElementById(id);

let _result = null;
let _gender = 'F';
let _dark   = true;

// ── Tema ───────────────────────────────────
function applyTheme() {
  document.documentElement.dataset.theme = _dark ? 'dark' : 'light';
  const b = $('theme-btn');
  if (b) b.textContent = _dark ? '☀️' : '🌙';
}
$('theme-btn')?.addEventListener('click', () => { _dark = !_dark; applyTheme(); });
applyTheme();

// ── Idioma ─────────────────────────────────
$('langBtn')?.addEventListener('click', () => {
  const m = $('langMenu');
  const open = m.style.display === 'block';
  m.style.display = open ? 'none' : 'block';
});
document.querySelectorAll('.lang-opt').forEach(b => {
  b.addEventListener('click', () => {
    const lang = b.dataset.lang;
    setLang(lang);
    document.documentElement.lang = lang;
    $('langLabel').textContent = lang.toUpperCase();
    $('langMenu').style.display = 'none';
    if (_result) renderOut(_result);
  });
});
document.addEventListener('click', e => {
  if (!e.target.closest('.lang-wrap')) $('langMenu').style.display = 'none';
});

// ── Género ─────────────────────────────────
document.querySelectorAll('.gender-btn').forEach(b => {
  b.addEventListener('click', () => {
    _gender = b.dataset.g;
    document.querySelectorAll('.gender-btn').forEach(x => x.classList.toggle('active', x === b));
    if (_result) renderOut(_result);
  });
});

// ── Geocodificação ─────────────────────────
initGeo();

// ── Máscaras de data e hora ─────────────────
$('dateInput')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
  if (v.length > 5) v = v.slice(0,5) + '/' + v.slice(5);
  if (v.length > 10) v = v.slice(0,10);
  e.target.value = v;
});
$('timeInput')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 2) v = v.slice(0,2) + ':' + v.slice(2);
  if (v.length > 5) v = v.slice(0,5);
  e.target.value = v;
});

// ── Painel Avançado ─────────────────────────
$('advBtn')?.addEventListener('click', () => {
  const panel = $('advPanel');
  const open  = panel.style.display === 'block';
  panel.style.display = open ? 'none' : 'block';
  $('advBtn').textContent = open ? '▶ Opções avançadas' : '▼ Opções avançadas';
});

// ── Calcular ───────────────────────────────
$('calcBtn')?.addEventListener('click', async () => {
  const spinner  = $('spinner');
  const resultEl = $('result');

  spinner.hidden  = false;
  resultEl.innerHTML = '';

  // Parse data DD/MM/AAAA
  const dateRaw = ($('dateInput')?.value || '').trim();
  const dm = dateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dm) {
    $('day').value   = dm[1];
    $('month').value = dm[2];
    $('year').value  = dm[3];
  }
  // Parse hora HH:MM
  const timeRaw = ($('timeInput')?.value || '').trim();
  const tm = timeRaw.match(/^(\d{1,2}):(\d{2})$/);
  if (tm) {
    $('hour').value = tm[1];
    $('min').value  = tm[2];
  } else {
    $('hour').value = '0';
    $('min').value  = '0';
  }

  const earlyZi = document.querySelector('input[name="earlyzi"]:checked')?.value === '1';

  const body = {
    year:      +$('year').value,
    month:     +$('month').value,
    day:       +$('day').value,
    hour:      +($('hour').value || 0),
    minute:    +($('min').value  || 0),
    longitude: +$('lng').value,
    latitude:  +$('lat').value,
    timezone:  +$('tz').value,
    dst:       $('dst').checked,
    gender:    _gender,
    earlyZi,
  };

  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    if (!res.ok) {
      resultEl.innerHTML = `<div class="err-msg">Erro ${res.status}: ${txt}</div>`;
      return;
    }
    _result = JSON.parse(txt);
    _result._name   = ($('name')?.value || '').trim();
    _result._gender = _gender;
    renderOut(_result);
  } catch(e) {
    resultEl.innerHTML = `<div class="err-msg">❌ ${e.message}</div>`;
    console.error('[BAZILAR]', e);
  } finally {
    spinner.hidden = true;
  }
});

// ── Renderiza resultado ─────────────────────
function renderOut(r) {
  const el = $('result');
  try {
    el.innerHTML = renderResults(r);
    // Ativa abas
    const bar = el.querySelector('.rbar');
    bar?.addEventListener('click', e => {
      const btn = e.target.closest('.rtab');
      if (!btn) return;
      const tid = btn.dataset.tab;
      el.querySelectorAll('.rtab').forEach(b => b.classList.toggle('rtab--on', b === btn));
      el.querySelectorAll('.rpanel').forEach(p => p.classList.toggle('rpanel--on', p.id === tid));
    });
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(e) {
    el.innerHTML = `<div class="err-msg">Erro ao renderizar: ${e.message}</div>`;
    console.error('[BAZILAR render]', e);
  }
}
