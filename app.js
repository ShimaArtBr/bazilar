/**
 * app.js — Ponto de entrada BAZILAR
 *
 * Orquestra: formulário → POST /api/calculate → renderizar resultados.
 * Não contém nenhum cálculo astronômico ou BaZi.
 */

import { T, setLang, t, LANG } from './i18n.js';
import { renderResults }        from './render.js';
import { geoDebounce, hideSug, showSpin } from './geocoding.js';

// ─────────────────────────────────────────────
// ESTADO GLOBAL DA UI
// ─────────────────────────────────────────────

let gender = 'M';
let isDark  = true;
let lastResult = null;   // cache do último resultado para re-render ao trocar idioma

// ─────────────────────────────────────────────
// LEITURA DO FORMULÁRIO
// ─────────────────────────────────────────────

function getInput() {
  const tv = (document.getElementById('inT').value || '00:00').split(':');
  return {
    year:      parseInt(document.getElementById('inY').value)  || 1990,
    month:     parseInt(document.getElementById('inM').value)  || 6,
    day:       parseInt(document.getElementById('inD').value)  || 15,
    hour:      parseInt(tv[0]) || 0,
    minute:    parseInt(tv[1]) || 0,
    longitude: parseFloat(document.getElementById('inLo').value) || 0,
    latitude:  parseFloat(document.getElementById('inLa').value) || 0,
    timezone:  parseFloat(document.getElementById('inTZ').value) || 0,
    dst:       document.getElementById('inDST').checked,
    city:      (document.getElementById('inCity').value || '').trim(),
    gender,
  };
}

// ─────────────────────────────────────────────
// PREVIEW DE LOCALIZAÇÃO
// ─────────────────────────────────────────────

function updateLocPrev() {
  const c  = (document.getElementById('inCity').value || '').trim();
  const lo = parseFloat(document.getElementById('inLo').value);
  const la = parseFloat(document.getElementById('inLa').value);
  const pr = document.getElementById('locPrev');
  if (pr) pr.textContent = (c && !isNaN(lo) && !isNaN(la))
    ? `${c} (${la.toFixed(2)}, ${lo.toFixed(2)})` : '';
}

// ─────────────────────────────────────────────
// CÁLCULO PRINCIPAL → API
// ─────────────────────────────────────────────

async function runCalc() {
  const i = getInput();
  const resultsEl = document.getElementById('results');

  // Validação básica antes de chamar a API
  if (isNaN(i.hour) || isNaN(i.minute) || i.month < 1 || i.month > 12 || i.day < 1 || i.day > 31) {
    resultsEl.innerHTML = `<div class="err">${t('errFill')}</div>`;
    return;
  }

  // Estado de carregamento
  resultsEl.innerHTML = `
    <div class="loading">
      <div class="loading-spin" aria-hidden="true"></div>
      <span>${t('loading') || 'Calculando…'}</span>
    </div>`;

  try {
    const resp = await fetch('/api/calculate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(i),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
      resultsEl.innerHTML = `<div class="err">⚠ ${err.error || resp.statusText}</div>`;
      return;
    }

    const result = await resp.json();
    // Anexa cidade ao resultado para uso no render
    result.input.city = i.city;

    lastResult = result;
    resultsEl.innerHTML = renderResults(result);

  } catch (e) {
    resultsEl.innerHTML = `<div class="err">⚠ Falha na conexão com o servidor.</div>`;
    console.error('[BAZILAR] fetch error:', e);
  }
}

// ─────────────────────────────────────────────
// IDIOMA
// ─────────────────────────────────────────────

function applyLang(code) {
  setLang(code);
  const n = T[code] || T.pt;

  document.documentElement.lang = code;
  document.body.style.fontFamily = code === 'zh'
    ? "'Noto Sans SC','Inter',sans-serif"
    : "'Inter',sans-serif";

  // Atualiza botão do idioma
  document.getElementById('langFlag').textContent  = n.flag;
  document.getElementById('langLabel').textContent = n.lbl;
  document.querySelectorAll('.lang-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.lang === code);
    o.tabIndex = o.dataset.lang === code ? 0 : -1;
  });

  // Atualiza labels do formulário
  const map = {
    uiTitle: 'title', uiDate: 'date', uiYear: 'year', uiMonth: 'month', uiDay: 'day',
    uiTime: 'time', uiCity: 'city', uiLong: 'long', uiLat: 'lat', uiTZ: 'tz',
    uiDST: 'dst', uiRSTLbl: 'rstLbl', uiCalc: 'calc',
    uiEmpTitle: 'etitle', uiEmpSub: 'esub',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = n[key] || '';
  }

  const ci = document.getElementById('inCity');
  if (ci) ci.placeholder = n.cityPH || '';

  // Re-renderiza resultados no novo idioma sem chamar a API de novo
  if (lastResult) {
    document.getElementById('results').innerHTML = renderResults(lastResult);
  }

  updateLocPrev();
}

// ─────────────────────────────────────────────
// TEMA
// ─────────────────────────────────────────────

document.getElementById('themeBtn').addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
});

// ─────────────────────────────────────────────
// DROPDOWN DE IDIOMA
// ─────────────────────────────────────────────

const lWrap = document.getElementById('langWrap');
const lBtn  = document.getElementById('langBtn');

function openL() {
  lWrap.classList.add('open');
  lBtn.setAttribute('aria-expanded', 'true');
  lWrap.querySelector('.lang-opt')?.focus();
}
function closeL() {
  lWrap.classList.remove('open');
  lBtn.setAttribute('aria-expanded', 'false');
}

lBtn.addEventListener('click', e => { e.stopPropagation(); lWrap.classList.contains('open') ? closeL() : openL(); });
lBtn.addEventListener('keydown', e => {
  if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); openL(); }
  if (e.key === 'Escape') closeL();
});
document.addEventListener('click', e => { if (!e.target.closest('#langWrap')) closeL(); });

document.querySelectorAll('.lang-opt[data-lang]').forEach(b => {
  b.addEventListener('click', () => { applyLang(b.dataset.lang); closeL(); lBtn.focus(); });
  b.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyLang(b.dataset.lang); closeL(); lBtn.focus(); }
    if (e.key === 'Escape')    { closeL(); lBtn.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); b.nextElementSibling?.focus(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); b.previousElementSibling?.focus(); }
  });
});

// ─────────────────────────────────────────────
// BOTÕES DE GÊNERO
// ─────────────────────────────────────────────

document.querySelectorAll('.gender-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.gender-btn').forEach(x => {
      x.classList.remove('active');
      x.style.background   = 'var(--panel)';
      x.style.color        = 'var(--muted)';
      x.style.borderColor  = 'rgba(136,136,164,.25)';
    });
    b.classList.add('active');
    b.style.background  = 'var(--bg-gold)';
    b.style.color       = 'var(--gold)';
    b.style.borderColor = 'var(--bg-gold)';
    gender = b.dataset.g;
  });
});

// ─────────────────────────────────────────────
// EVENTOS DO FORMULÁRIO
// ─────────────────────────────────────────────

// Atualiza preview de localização ao editar coords manualmente
['inLo', 'inLa'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateLocPrev);
});

// Geocodificação ao digitar no campo de cidade
document.getElementById('inCity')?.addEventListener('input', function () {
  geoDebounce(this.value.trim(), document.documentElement.lang || 'pt', updateLocPrev);
});

// Botão principal
document.getElementById('calcBtn')?.addEventListener('click', runCalc);

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  applyLang('pt');
  updateLocPrev();
  // Não calcula automaticamente — usuário deve confirmar local de nascimento
});
