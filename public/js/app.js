/**
 * app.js — Controlador BAZILAR
 */
import { renderResults } from './render.js';
import { setLang }       from './i18n.js';
import { initGeo }       from './geo.js';

const $ = id => document.getElementById(id);

let _result = null;
let _gender = null;
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
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
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

// ── Checkbox "não sei a hora" ───────────────
$('noHour')?.addEventListener('change', e => {
  const ti = $('timeInput');
  if (ti) {
    ti.disabled = e.target.checked;
    ti.value    = e.target.checked ? '' : '';
    ti.placeholder = e.target.checked ? '—' : 'HH:MM';
  }
});

// ── Painel Avançado ─────────────────────────
$('advBtn')?.addEventListener('click', () => {
  const panel = $('advPanel');
  const open  = panel.style.display === 'block';
  panel.style.display = open ? 'none' : 'block';
  $('advBtn').textContent = open ? '▶ Opções avançadas' : '▼ Opções avançadas';
});

// ── Validação e Calcular ────────────────────
$('calcBtn')?.addEventListener('click', async () => {
  const errEl    = $('formErr');
  const spinner  = $('spinner');
  const resultEl = $('result');

  errEl.hidden = true;

  // Parse data
  const dateRaw = ($('dateInput')?.value || '').trim();
  const dm = dateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  // Parse hora
  const noHour  = $('noHour')?.checked;
  const timeRaw = ($('timeInput')?.value || '').trim();
  const tm      = timeRaw.match(/^(\d{1,2}):(\d{2})$/);

  // Validação: data obrigatória
  if (!dm) {
    errEl.textContent = '⚠ Preencha a data de nascimento no formato DD/MM/AAAA.';
    errEl.hidden = false;
    return;
  }

  // Validação: hora obrigatória se não marcou "não sei"
  if (!noHour && !tm) {
    errEl.textContent = '⚠ Preencha a hora de nascimento ou marque "Não sei a hora".';
    errEl.hidden = false;
    return;
  }

  // Validação: local obrigatório (longitude não pode ser o valor padrão vazio)
  const lng = $('lng').value.trim();
  const lat = $('lat').value.trim();
  if (!lng || !lat || !$('city').value.trim()) {
    errEl.textContent = '⚠ Preencha o local de nascimento.';
    errEl.hidden = false;
    return;
  }

  spinner.hidden = false;
  resultEl.innerHTML = '';

  $('day').value   = dm[1];
  $('month').value = dm[2];
  $('year').value  = dm[3];
  $('hour').value  = tm ? tm[1] : '12';
  $('min').value   = tm ? tm[2] : '0';

  const earlyZi = document.querySelector('input[name="earlyzi"]:checked')?.value === '1';

  const body = {
    year:      +$('year').value,
    month:     +$('month').value,
    day:       +$('day').value,
    hour:      +$('hour').value,
    minute:    +$('min').value,
    longitude: +lng,
    latitude:  +lat,
    timezone:  +$('tz').value,
    dst:       $('dst').checked,
    gender:    _gender || 'M',
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
    _result._name    = ($('name')?.value || '').trim();
    _result._gender  = _gender;
    _result._noHour  = noHour;
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
