/**
 * @file src/app.js
 * @description Orquestrador principal da aplicação BaZi.
 *   Captura input do usuário → calcula pilares → passa ao renderer.
 *   Registra o Service Worker (sw.js) com Update Notification Pattern (UNP).
 *
 * RESTRIÇÕES:
 *   - Vanilla JS ES6 Modules (sem frameworks)
 *   - Não reimplementa lógica de cálculo — usa fachadas core/
 *   - Feature flags apenas via FLAGS (import.meta.env via flags.js)
 *
 * @see interfaces.d.ts — BirthInput, FourPillars, LuckPillar, Interaction
 * @sprint S3 — formulário restaurado
 */

import { computeFourPillars, computeLuckPillars, detectInteractions } from './core/bazi-engine.js';
import { computeTenGods, getDayMasterStrength, getFavorableElements } from './core/ten-gods.js';
import { calcularTempoSolarReal } from './adapters/solarTime.adapter.js';
import { elemBalance, findStars } from './modules/pillars.js';
import { sunLon, termJD, calcRST, fromJD } from './modules/engine.js';
import { MT } from './modules/data.js';
import { renderBaziChart } from './renderer.js';
import { FLAGS } from './config/flags.js';

// ── Referências DOM ────────────────────────────────────────────────────────────

const inName    = document.getElementById('inName');
const inD       = document.getElementById('inD');
const inM       = document.getElementById('inM');
const inY       = document.getElementById('inY');
const inT       = document.getElementById('inT');
const gF        = document.getElementById('gF');
const gM        = document.getElementById('gM');
const inCity    = document.getElementById('inCity');
const sugBox    = document.getElementById('sugBox');
const geoSpin   = document.getElementById('geoSpin');
const locPrev   = document.getElementById('locPrev');
const inLo      = document.getElementById('inLo');
const inLa      = document.getElementById('inLa');
const inTZ      = document.getElementById('inTZ');
const tzHint    = document.getElementById('tzHint');
const tzHintTxt = document.getElementById('tzHintTxt');
const inDST     = document.getElementById('inDST');
const rstBox    = document.getElementById('rstBox');
const rstV      = document.getElementById('rstV');
const rstD      = document.getElementById('rstD');
const ziSelector = document.getElementById('ziSelector');
const ziToggle   = document.getElementById('ziToggle');
const ziOpts     = document.getElementById('ziOpts');
const ziEarly    = document.getElementById('ziEarly');
const ziLate     = document.getElementById('ziLate');
const hemiN      = document.getElementById('hemiN');
const hemiS      = document.getElementById('hemiS');
const calcBtn    = document.getElementById('calcBtn');
const results    = document.getElementById('results');
const emptyState = document.getElementById('emptyState');
const themeBtn   = document.getElementById('themeBtn');
const themeIcon  = document.getElementById('themeIcon');

// ── Estado da aplicação ────────────────────────────────────────────────────────

const state = {
  gender:    null,
  earlyZi:   true,
  southernHemisphere: false,
  geoDebounce: null,
  lastNominatimReq: 0,
};

// ── Tema dark/light ────────────────────────────────────────────────────────────

function inicializarTema() {
  const salvo = localStorage.getItem('bazilar-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', salvo);
  if (themeIcon) themeIcon.textContent = salvo === 'dark' ? '☀️' : '🌙';
}

themeBtn?.addEventListener('click', () => {
  const atual = document.documentElement.getAttribute('data-theme');
  const novo  = atual === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  localStorage.setItem('bazilar-theme', novo);
  if (themeIcon) themeIcon.textContent = novo === 'dark' ? '☀️' : '🌙';
});

// ── Botões de gênero ───────────────────────────────────────────────────────────

function setGender(g) {
  state.gender = g;
  gF?.classList.toggle('active', g === 'F');
  gM?.classList.toggle('active', g === 'M');
  gF?.setAttribute('aria-pressed', String(g === 'F'));
  gM?.setAttribute('aria-pressed', String(g === 'M'));
}

gF?.addEventListener('click', () => setGender('F'));
gM?.addEventListener('click', () => setGender('M'));

// ── Seletor Early / Late Zǐ ──────────────────────────────────────────────────

ziToggle?.addEventListener('click', () => {
  const isOpen = ziSelector?.classList.toggle('open');
  ziToggle.setAttribute('aria-expanded', String(!!isOpen));
  const ziOpts = document.getElementById('ziOpts');
  if (ziOpts) ziOpts.setAttribute('aria-hidden', String(!isOpen));
});

// Suporte teclado no toggle (Enter / Space)
ziToggle?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ziToggle.click(); }
});

ziEarly?.addEventListener('click', () => {
  state.earlyZi = true;
  ziEarly.classList.add('active');   ziEarly.setAttribute('aria-checked', 'true');  ziEarly.tabIndex = 0;
  ziLate?.classList.remove('active'); ziLate?.setAttribute('aria-checked', 'false'); if (ziLate) ziLate.tabIndex = -1;
});

ziLate?.addEventListener('click', () => {
  state.earlyZi = false;
  ziLate.classList.add('active');    ziLate.setAttribute('aria-checked', 'true');   ziLate.tabIndex = 0;
  ziEarly?.classList.remove('active'); ziEarly?.setAttribute('aria-checked', 'false'); if (ziEarly) ziEarly.tabIndex = -1;
});

// Suporte teclado nos radio customizados — Arrow keys (WCAG 2.1.1 SC)
ziEarly?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); ziLate?.click(); ziLate?.focus(); }
});
ziLate?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); ziEarly?.click(); ziEarly?.focus(); }
});

// ── Seletor Hemisfério ────────────────────────────────────────────────────────

hemiN?.addEventListener('click', () => {
  state.southernHemisphere = false;
  hemiN.classList.add('active');   hemiN.setAttribute('aria-checked', 'true');  hemiN.tabIndex = 0;
  hemiS?.classList.remove('active'); hemiS?.setAttribute('aria-checked', 'false'); if (hemiS) hemiS.tabIndex = -1;
});

hemiS?.addEventListener('click', () => {
  state.southernHemisphere = true;
  hemiS.classList.add('active');   hemiS.setAttribute('aria-checked', 'true');  hemiS.tabIndex = 0;
  hemiN?.classList.remove('active'); hemiN?.setAttribute('aria-checked', 'false'); if (hemiN) hemiN.tabIndex = -1;
});

// Suporte teclado no radiogroup Hemisfério — Arrow keys (WCAG 2.1.1 SC)
hemiN?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); hemiS?.click(); hemiS?.focus(); }
});
hemiS?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); hemiN?.click(); hemiN?.focus(); }
});

// ── Fuso horário — detecção automática ────────────────────────────────────────

function detectarFusoDispositivo() {
  if (!inTZ) return;
  try {
    const offsetMin = -new Date().getTimezoneOffset();
    const offsetHrs = offsetMin / 60;
    selecionarFusoMaisProximo(offsetHrs);
    const sinal  = offsetHrs >= 0 ? '+' : '';
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tzHintTxt) tzHintTxt.textContent = `Detectado: ${tzName ? '(' + tzName + ')' : `GMT ${sinal}${offsetHrs}`}`;
    tzHint?.classList.add('tz-hint--set');
  } catch (_) {
    if (tzHintTxt) tzHintTxt.textContent = 'Não foi possível detectar o fuso.';
  }
}

function selecionarFusoMaisProximo(offsetH) {
  if (!inTZ) return;
  let melhor = null;
  let menorDiff = Infinity;
  for (const opt of inTZ.options) {
    if (opt.value === '' || opt.disabled) continue;
    const diff = Math.abs(parseFloat(opt.value) - offsetH);
    if (diff < menorDiff) { menorDiff = diff; melhor = opt; }
  }
  if (melhor) inTZ.value = melhor.value;
}

// ── Geocoding Nominatim ───────────────────────────────────────────────────────

function mostrarSpin(v) {
  if (geoSpin) geoSpin.style.opacity = v ? '1' : '0';
}

function fecharSugestoes() {
  if (sugBox) { sugBox.style.display = 'none'; sugBox.innerHTML = ''; }
}

function offsetParaGMT(offsetH) {
  const sinal = offsetH >= 0 ? '+' : '-';
  const abs   = Math.abs(offsetH);
  const h     = Math.floor(abs);
  const m     = Math.round((abs - h) * 60);
  return m > 0 ? `GMT ${sinal}${h}:${String(m).padStart(2,'0')}` : `GMT ${sinal}${h}`;
}

async function buscarCidade(query) {
  if (!query || query.length < 3) { fecharSugestoes(); return; }

  const agora = Date.now();
  const delta = agora - state.lastNominatimReq;
  if (delta < 1000) await new Promise(r => setTimeout(r, 1000 - delta));

  mostrarSpin(true);
  state.lastNominatimReq = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BAZILAR-PWA/1.0 (https://bazilar.app)' }
    });
    if (!res.ok) throw new Error('Nominatim HTTP ' + res.status);
    const data = await res.json();
    renderizarSugestoes(data);
  } catch (e) {
    console.warn('[geo] Erro Nominatim:', e);
    fecharSugestoes();
  } finally {
    mostrarSpin(false);
  }
}

// Formata resultado Nominatim: "Município, Estado, País" ou "Cidade, País"
function formatarLocalidade(r) {
  const a = r.address || {};
  const partes = [
    a.city || a.town || a.municipality || a.village || a.county,
    a.state,
    a.country,
  ].filter(Boolean);
  return partes.length ? partes.join(', ') : r.display_name.split(',').slice(0, 3).join(',').trim();
}

function renderizarSugestoes(resultados) {
  if (!sugBox) return;
  sugBox.innerHTML = '';

  if (!resultados || resultados.length === 0) {
    sugBox.innerHTML = '<div class="sug-none">Nenhum resultado encontrado.</div>';
    sugBox.style.display = 'block';
    return;
  }

  resultados.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'sug-item';
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', 'false');
    btn.type = 'button';

    const lat   = parseFloat(r.lat);
    const lon   = parseFloat(r.lon);
    const tzEst = Math.round(lon / 15 * 2) / 2;

    const nome   = document.createElement('span');
    nome.className = 'sug-name';
    nome.textContent = formatarLocalidade(r);

    const coords = document.createElement('span');
    coords.className = 'sug-coords';
    coords.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)} — ${offsetParaGMT(tzEst)}`;

    btn.appendChild(nome);
    btn.appendChild(coords);
    btn.addEventListener('click', () => selecionarSugestao(r, lat, lon, tzEst));
    sugBox.appendChild(btn);
  });

  const attr = document.createElement('div');
  attr.className = 'sug-attr';
  attr.innerHTML = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
  sugBox.appendChild(attr);
  sugBox.style.display = 'block';
}

function selecionarSugestao(resultado, lat, lon, tzEst) {
  const label = formatarLocalidade(resultado);
  if (inCity) inCity.value = label;
  if (inLo)   inLo.value  = lon.toFixed(4);
  if (inLa)   inLa.value  = lat.toFixed(4);
  selecionarFusoMaisProximo(tzEst);

  // Atualizar hint com o fuso estimado pela longitude da cidade
  if (tzHintTxt) {
    const sinal = tzEst >= 0 ? '+' : '';
    tzHintTxt.textContent = `Estimado por coordenada: GMT ${sinal}${tzEst}`;
  }
  tzHint?.classList.add('tz-hint--set');

  if (locPrev) {
    locPrev.textContent = '📍 ' + label;
  }

  fecharSugestoes();
  calcularRSTTempoReal();
}

inCity?.addEventListener('input', () => {
  clearTimeout(state.geoDebounce);
  state.geoDebounce = setTimeout(() => buscarCidade(inCity.value.trim()), 350);
});

document.addEventListener('click', e => {
  if (!e.target.closest('.geo-wrap')) fecharSugestoes();
});

// ── Cálculo de RST em tempo real ──────────────────────────────────────────────

function calcularRSTTempoReal() {
  if (!rstBox) return;

  const d    = parseInt(inD?.value, 10);
  const m    = parseInt(inM?.value, 10);
  const y    = parseInt(inY?.value, 10);
  const [hStr, minStr] = (inT?.value?.trim() || ':').split(':');
  const h    = parseInt(hStr,   10);
  const min  = parseInt(minStr, 10) || 0;
  const lon  = parseFloat(inLo?.value);
  const tz   = parseFloat(inTZ?.value);
  const dst  = inDST?.checked ? 1 : 0;

  const dadosOk = d && m && y && !isNaN(h) && !isNaN(lon) && !isNaN(tz);
  if (!dadosOk) { rstBox.style.display = 'none'; return; }

  const hCorr = h - dst;

  try {
    const rst = calcularTempoSolarReal(y, m, d, hCorr, min, 0, lon, tz);
    if (!rst || rst.erro) { rstBox.style.display = 'none'; return; }

    const rstHoras = rst.ast;
    const hh = Math.floor(rstHoras) % 24;
    const mmFrac = (rstHoras % 1) * 60;
    const mm = Math.floor(mmFrac);
    const ss = Math.round((mmFrac % 1) * 60);

    if (rstV) rstV.textContent = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    if (rstD) rstD.textContent =
      `Eq. do Tempo: ${(rst.equacaoDoTempo ?? 0).toFixed(1)} min · ` +
      `Ajuste Long.: ${(rst.ajusteLongitude ?? 0).toFixed(1)} min · ` +
      `Total: ${(rst.totalAjuste_min ?? 0).toFixed(1)} min`;

    rstBox.style.display = 'block';
  } catch (_) {
    rstBox.style.display = 'none';
  }
}

// Nota: inT é registrado APÓS os handlers de máscara (abaixo) para que
// calcularRSTTempoReal leia sempre o valor já mascarado.
[inD, inM, inY, inLo, inLa].forEach(el =>
  el?.addEventListener('input', calcularRSTTempoReal)
);
inDST?.addEventListener('change', calcularRSTTempoReal);
inTZ?.addEventListener('change', calcularRSTTempoReal);

// ── Service Worker ─────────────────────────────────────────────────────────────

async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    reg.addEventListener('updatefound', () => {
      const novoSW = reg.installing;
      if (!novoSW) return;
      novoSW.addEventListener('statechange', () => {
        if (novoSW.state === 'installed' && navigator.serviceWorker.controller) {
          exibirToastAtualizacao(novoSW);
        }
      });
    });
    console.log('[SW] Registrado:', reg.scope);
  } catch (e) {
    console.warn('[SW] Falha:', e);
  }
}

function exibirToastAtualizacao(novoSW) {
  const toast = document.getElementById('update-toast');
  if (!toast) return;
  toast.hidden = false;
  toast.setAttribute('aria-live', 'polite');
  const btn = toast.querySelector('[data-action="update"]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    novoSW.postMessage({ type: 'SKIP_WAITING' });
    toast.hidden = true;
    navigator.serviceWorker.addEventListener('controllerchange',
      () => window.location.reload(), { once: true });
  }, { once: true });
}

// ── Coleta e validação do input ────────────────────────────────────────────────

function coletarBirthInput() {
  const d    = parseInt(inD?.value, 10);
  const m    = parseInt(inM?.value, 10);
  const y    = parseInt(inY?.value, 10);
  const [hStr, minStr] = (inT?.value?.trim() || ':').split(':');
  let   h    = parseInt(hStr,   10);
  const min  = parseInt(minStr, 10) || 0;
  const dst  = inDST?.checked ? 1 : 0;

  if (!y || y < 1 || y > 2200)     throw new Error('Ano inválido (1–2200).');
  if (!m || m < 1 || m > 12)       throw new Error('Mês inválido (1–12).');
  if (!d || d < 1 || d > 31)       throw new Error('Dia inválido (1–31).');
  if (isNaN(h) || h < 0 || h > 23) throw new Error('Hora inválida (0–23).');
  if (!state.gender)                throw new Error('Selecione o gênero biológico.');

  // Guardar hora bruta (pré-DST) e flag DST para cálculo do RST no renderer
  const rawHour = h;

  // Corrigir DST (subtrair 1h se DST ativo)
  h = ((h - dst) + 24) % 24;

  /** @type {import('../interfaces.d.ts').BirthInput} */
  const input = {
    year: y, month: m, day: d,
    hour: h, minute: min,
    gender: state.gender,
    southernHemisphere: state.southernHemisphere,
  };

  const lon = parseFloat(inLo?.value);
  const lat = parseFloat(inLa?.value);
  const tz  = parseFloat(inTZ?.value);

  if (!isNaN(lon)) input.longitude = lon;
  if (!isNaN(lat)) input.latitude  = lat;
  if (!isNaN(tz))  input.timezone  = tz;

  // Hora bruta e DST para calcRST no pipeline de renderização
  input.rawHour = rawHour;
  input.dst     = dst === 1;

  // Late Zǐ: sinalizar para o engine
  if (!state.earlyZi) input.lateZi = true;

  return input;
}

// ── Pipeline de cálculo ────────────────────────────────────────────────────────

function calcularMapa(birth) {
  const fourPillars = computeFourPillars(birth);


  if (!fourPillars?.year || !fourPillars?.month || !fourPillars?.day || !fourPillars?.hour) {
    throw new Error('[calcularMapa] computeFourPillars retornou estrutura incompleta: ' + JSON.stringify(fourPillars));
  }

  // calcLuckPillars pode retornar null (gender inválido ou JD inválido)
  // e também retorna { pillars: [...] } — o renderer espera o array direto
  const luckRaw     = computeLuckPillars(
    fourPillars,
    { year: birth.year, month: birth.month, day: birth.day },
    birth.gender
  );
  const luckPillars = luckRaw?.pillars ?? [];

  const ramos = [
    fourPillars.year.bi,
    fourPillars.month.bi,
    fourPillars.day.bi,
    fourPillars.hour.bi,
  ];
  // Normalizar interações: renderer.js espera sempre inter.branches[]
  // mas findInteractions retorna {a, b} para harmony6/clash/harm e
  // {branches[]} apenas para harmony3/penalty.
  const interactions  = detectInteractions(ramos).map(inter => {
    if (!inter.branches) {
      return { ...inter, branches: [inter.a, inter.b].filter(x => x != null) };
    }
    return inter;
  });
  const dmStemIdx     = fourPillars.day.si;
  const todosTroncos  = [
    fourPillars.year.si, fourPillars.month.si,
    fourPillars.day.si,  fourPillars.hour.si,
  ];
  const tenGods   = computeTenGods(dmStemIdx, todosTroncos);
  const strength  = getDayMasterStrength(dmStemIdx, todosTroncos, ramos, 1);
  // Ordem [hora, dia, mês, ano] para elemBalance e stars (convencional BAZILAR)
  const stemsOrdered   = [fourPillars.hour.si, fourPillars.day.si, fourPillars.month.si, fourPillars.year.si];
  const branchesOrdered = [fourPillars.hour.bi, fourPillars.day.bi, fourPillars.month.bi, fourPillars.year.bi];

  const balance = elemBalance(stemsOrdered, branchesOrdered);

  const favorable = getFavorableElements(strength, { balance });

  if (import.meta.env?.DEV) {
    console.debug('[app] FLAGS:', FLAGS);
    console.debug('[app] FourPillars:', fourPillars);
  }

  // ── Dados adicionais para renderização completa ──────────────────────────────



  const stars = findStars(
    fourPillars.year.bi, fourPillars.day.bi,
    fourPillars.year.si, fourPillars.day.si,
  );

  const sl = sunLon(fourPillars.jd);

  // Termos Solares do ano de nascimento
  const solarTerms = MT.map((mt, idx) => {
    const tjd = termJD(mt.l, birth.year);
    const { day: tDay, month: tMonth } = fromJD(tjd);
    const past = fourPillars.jd >= tjd;
    return { n: mt.n, py: mt.py, day: tDay, month: tMonth, past, idx };
  });

  // Tempo Solar Real — usa hora bruta (pré-DST) e coordenadas se disponíveis
  let rst = null;
  if (birth.longitude != null && birth.timezone != null) {
    const rawH = birth.rawHour ?? birth.hour;
    const dstFlag = birth.dst ?? false;
    rst = calcRST(birth.year, birth.month, birth.day, rawH, birth.minute ?? 0, birth.longitude, birth.timezone, dstFlag);
  }

  return { fourPillars, luckPillars, luckRaw, interactions, tenGods, strength, favorable,
           balance, stars, sl, solarTerms, rst, birth };
}

// ── Controle de estado UI ──────────────────────────────────────────────────────

function mostrarErro(msg) {
  document.getElementById('_errBanner')?.remove();
  const div = document.createElement('div');
  div.id = '_errBanner';
  div.className = 'err';
  div.setAttribute('role', 'alert');
  div.textContent = msg;
  results?.prepend(div);
}

function limparErro() {
  document.getElementById('_errBanner')?.remove();
}

// ── Handler do botão Calcular ──────────────────────────────────────────────────

calcBtn?.addEventListener('click', async () => {
  limparErro();

  // DS v2.3 §3 — Shimmer loading: exibe placeholder animado enquanto calcula
  // Injeta 4 células .bazi-pillar.is-loading antes do cálculo real
  let shimmerGrid = null;
  if (results && emptyState) {
    emptyState.style.display = 'none';
    // Limpar resultados anteriores
    Array.from(results.children).forEach(c => {
      if (c.id !== 'emptyState') c.remove();
    });

    const shimmerWrap = document.createElement('div');
    shimmerWrap.id = '_shimmerWrap';
    shimmerGrid = document.createElement('div');
    shimmerGrid.className = 'bazi-map bazi-map--revealed';

    for (let i = 0; i < 4; i++) {
      const cell = document.createElement('article');
      cell.className = 'bazi-pillar is-loading';
      cell.setAttribute('aria-hidden', 'true');

      // Header placeholder
      const hd = document.createElement('div');
      hd.className = 'bazi-pillar__header';
      hd.textContent = '\u00a0'; // non-breaking space para manter altura
      cell.appendChild(hd);

      // Stem placeholder
      const stem = document.createElement('div');
      stem.className = 'bazi-pillar__stem';
      const char1 = document.createElement('span');
      char1.className = 'bazi-pillar__char';
      char1.textContent = '\u4e00'; // 一 — caractere placeholder
      const py1 = document.createElement('span');
      py1.className = 'bazi-pillar__pinyin';
      py1.textContent = 'loading';
      stem.appendChild(char1);
      stem.appendChild(py1);
      cell.appendChild(stem);

      // Branch placeholder
      const branch = document.createElement('div');
      branch.className = 'bazi-pillar__branch';
      const char2 = document.createElement('span');
      char2.className = 'bazi-pillar__char';
      char2.textContent = '\u4e00';
      const lbl = document.createElement('span');
      lbl.className = 'bazi-pillar__label';
      lbl.textContent = '\u00a0';
      branch.appendChild(char2);
      branch.appendChild(lbl);
      cell.appendChild(branch);

      shimmerGrid.appendChild(cell);
    }

    shimmerWrap.appendChild(shimmerGrid);
    results.appendChild(shimmerWrap);
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  try {
    const birth = coletarBirthInput();
    const mapa  = calcularMapa(birth);

    // Remover shimmer antes de renderizar
    document.getElementById('_shimmerWrap')?.remove();

    // Limpar quaisquer outros resultados anteriores
    Array.from(results?.children || []).forEach(c => {
      if (c.id !== 'emptyState') c.remove();
    });

    renderBaziChart(mapa, results);
  } catch (err) {
    // Remover shimmer em caso de erro
    document.getElementById('_shimmerWrap')?.remove();
    mostrarErro(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    console.error('[app] Erro no pipeline:', err);
  }
});

// ── Auto-avanço de campos numéricos ───────────────────────────────────────────

function autoTab(el, maxLen, proxEl) {
  el?.addEventListener('input', () => {
    if (el.value.length >= maxLen && proxEl) proxEl.focus();
  });
}
autoTab(inD, 2, inM);
autoTab(inM, 2, inY);
autoTab(inY, 4, inT);

// ── Máscara HH:MM para o campo de hora ────────────────────────────────────────

inT?.addEventListener('input', (e) => {
  // Permitir apenas dígitos e ':'
  let v = e.target.value.replace(/[^\d:]/g, '');

  // Inserir ':' automaticamente após os dois primeiros dígitos
  if (v.length === 2 && !v.includes(':')) {
    v = v + ':';
  }

  // Limitar a 5 caracteres (HH:MM)
  if (v.length > 5) v = v.slice(0, 5);

  e.target.value = v;

  // Após HH:MM completo (5 chars), mover foco para o botão ♀ Feminino
  if (v.length === 5) gF?.focus();
});

// Ao pressionar Backspace sobre o ':', apagar o dígito anterior também
inT?.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace') {
    const v = e.target.value;
    if (v.endsWith(':')) {
      e.preventDefault();
      e.target.value = v.slice(0, -2);
    }
  }
});

// Registrado APÓS máscara: garante que calcularRSTTempoReal lê valor já formatado
inT?.addEventListener('input', calcularRSTTempoReal);

// ── Inicialização ──────────────────────────────────────────────────────────────

function inicializar() {
  inicializarTema();
  detectarFusoDispositivo();
  registrarServiceWorker();
  console.log('[app] BaZi 八字 inicializado. FLAGS:', FLAGS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
