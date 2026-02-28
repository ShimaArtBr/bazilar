/**
 * render.js — Renderização dos resultados BAZILAR
 *
 * Recebe o JSON retornado por /api/calculate e constrói o HTML.
 * NÃO contém nenhuma lógica astronômica ou de cálculo BaZi.
 * Toda a informação já chegou calculada do servidor.
 */

import { t, te, tp, tpl, LANG } from './i18n.js';

// ─────────────────────────────────────────────
// UTILITÁRIOS DE FORMATAÇÃO
// ─────────────────────────────────────────────

const p2  = n => String(Math.floor(n)).padStart(2, '0');
const ft  = (h, m) => `${p2(h)}:${p2(m)}`;
const sgn = n => (n >= 0 ? '+' : '') + n.toFixed(1);

// ─────────────────────────────────────────────
// BADGE DE ELEMENTO
// ─────────────────────────────────────────────

const ES = {
  Wood:  { bg: 'rgba(74,124,78,.2)',    tx: '#7dba82' },
  Fire:  { bg: 'rgba(176,58,46,.2)',    tx: '#e05c4a' },
  Earth: { bg: 'rgba(139,105,20,.18)',  tx: '#c9a84c' },
  Metal: { bg: 'rgba(110,125,138,.18)', tx: '#b0bec5' },
  Water: { bg: 'rgba(36,113,163,.18)',  tx: '#5b9fc9' },
};

function badge(el) {
  const c = ES[el] || {};
  return `<span class="p-elem" style="background:${c.bg};color:${c.tx}">${te(el)}</span>`;
}

// ─────────────────────────────────────────────
// CARD DE PILAR
// ─────────────────────────────────────────────

/**
 * Gera o HTML de um card de pilar.
 * @param {string} hdr      - cabeçalho (ex: "Dia · 日 ★")
 * @param {object} pillar   - { stemData, branchData, tenGodStem, hiddenStems, ... }
 * @param {boolean} isDay   - true para o Pilar do Dia (Mestre do Dia)
 */
export function pilCard(hdr, pillar, isDay = false) {
  if (!pillar) return `<div class="pillar-card"><div class="pillar-hd">—</div></div>`;

  const { stemData: s, branchData: b, tenGodStem: g, hiddenStems: hs } = pillar;

  // Hastes ocultas
  const hidH = `
    <div class="pillar-hidden">
      ${hs.map(h => `
        <span class="hidden-stem" title="${h.stem.py} ${te(h.stem.el)}">
          ${h.stem.zh}
          ${h.tenGod ? `<span class="hidden-god">${h.tenGod.zh}</span>` : ''}
        </span>
      `).join('')}
    </div>`;

  return `
    <div class="pillar-card">
      <div class="pillar-hd${isDay ? ' active' : ''}">${hdr}</div>
      <div class="p-stem">
        <span class="p-char">${s.zh}</span>
        <span class="p-py">${s.py}</span>
        ${badge(s.el)}
        <span class="p-py" style="margin-top:3px">${tp(s.po)}</span>
        ${g ? `<span class="p-god">${g.zh} ${g.py}</span>` : ''}
      </div>
      <div class="p-branch">
        <span class="p-char">${b.zh}</span>
        <span class="p-py">${b.py}</span>
        ${badge(b.el)}
        <span class="p-py" style="margin-top:3px">${b.an} · ${tp(b.po)}</span>
      </div>
      ${hidH}
    </div>`;
}

// ─────────────────────────────────────────────
// DA YUN
// ─────────────────────────────────────────────

/**
 * Renderiza a seção de Pilares de Sorte.
 * @param {object} daYun  - { forward, startAge, pillars }
 */
export function renderDaYun(daYun) {
  if (!daYun) return '';

  const dir = daYun.forward ? '⟳ Progressive' : '⟲ Regressive';

  const cards = daYun.pillars.map(p => `
    <div class="dayun-card${p.current ? ' dayun-current' : ''}">
      <div class="dayun-age">${p.age}–${p.endAge}${p.current ? ' ★' : ''}</div>
      <div class="dayun-chars">${p.stemData.zh}${p.branchData.zh}</div>
      <div class="dayun-py">${p.stemData.py} ${p.branchData.py}</div>
      <div class="dayun-badge">${badge(p.stemData.el)}</div>
      ${p.tenGod ? `<div class="dayun-god">${p.tenGod.zh}</div>` : ''}
    </div>`).join('');

  return `
    <p class="sec-label" style="margin-top:20px">大運 Luck Pillars</p>
    <div class="dayun-meta">${dir} · Start age: ${daYun.startAge}</div>
    <div class="dayun-row">${cards}</div>`;
}

// ─────────────────────────────────────────────
// INFO CARDS
// ─────────────────────────────────────────────

export function renderInfoCards(result) {
  const { dayMaster: dm, rst, pillars, input, sunLongitude } = result;
  const locStr = input.city
    ? `${input.city} (${input.latitude.toFixed(2)}, ${input.longitude.toFixed(2)})`
    : t('sunSub');

  return `
    <div class="info-grid">
      <div class="info-card">
        <p class="ic-title">${t('dm')}</p>
        <p class="ic-val">${dm.stem.zh} ${dm.stem.py} — ${te(dm.stem.el)} ${tp(dm.stem.po)}</p>
        <p class="ic-sub">${t('dmSub')}</p>
      </div>
      <div class="info-card">
        <p class="ic-title">${t('rst')}</p>
        <p class="ic-val">${ft(rst.h, rst.m)}</p>
        <p class="ic-sub">${t('clk')}: ${ft(input.hour, input.minute)} · ${t('corr')}: ${sgn(rst.corr)} min</p>
      </div>
      <div class="info-card">
        <p class="ic-title">${t('yr')}</p>
        <p class="ic-val">${pillars.year.stemData.zh}${pillars.year.branchData.zh} · ${pillars.year.baziYear}</p>
        <p class="ic-sub">${t('yrSub')}</p>
      </div>
      <div class="info-card">
        <p class="ic-title">${t('sun')}</p>
        <p class="ic-val">${sunLongitude.toFixed(3)}°</p>
        <p class="ic-sub">${locStr}</p>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// TERMOS SOLARES
// ─────────────────────────────────────────────

export function renderSolarTerms(terms, year) {
  const curIdx = terms.filter(t => t.past).length - 1;
  const dots = terms.map((td, i) => {
    const cls = i < curIdx ? 'past' : i === curIdx ? 'cur' : '';
    return `<span class="term-dot ${cls}" role="listitem">
      ${td.name} ${p2(td.date.day)}/${p2(td.date.month)}
    </span>`;
  }).join('');

  return `
    <div class="term-bar">
      <p class="term-ttl">${tpl('terms', { '%y': year })}</p>
      <div class="term-track" role="list">${dots}</div>
    </div>`;
}

// ─────────────────────────────────────────────
// LOG DO CÁLCULO
// ─────────────────────────────────────────────

function L(key, map = {}) {
  const s = tpl(key, map);
  if (s.trim().startsWith('//')) {
    return `<p class="fl"><span class="hc">${s}</span></p>`;
  }
  if (s.includes(' = ')) {
    const parts = s.split(' = ');
    return `<p class="fl"><span class="hg">${parts[0]}</span> = <span class="hv">${parts.slice(1).join(' = ')}</span></p>`;
  }
  return `<p class="fl">${s}</p>`;
}

export function buildLog(result) {
  const { input: i, julianDay: jd, sunLongitude, pillars, rst, dayMaster: dm } = result;
  const p = pillars;

  return [
    L('lTitle', { '%d': p2(i.day), '%m': p2(i.month), '%y': i.year }),
    '<br>',
    L('lSun',   { '%d': p2(i.day), '%m': p2(i.month), '%y': i.year }),
    `<p class="fl"><span class="hg">sunLon</span> = <span class="hv">${sunLongitude.toFixed(4)}°</span></p>`,
    '<br>',
    L('lJD',    { '%d': p2(i.day), '%m': p2(i.month), '%y': i.year }),
    `<p class="fl"><span class="hg">JD</span> = <span class="hv">${jd.toFixed(1)}</span></p>`,
    '<br>',
    L('lYC'),
    L('lYS', { '%Y': p.year.baziYear, '%si': p.year.stem, '%sc': p.year.stemData.zh }),
    L('lYB', { '%Y': p.year.baziYear, '%bi': p.year.branch, '%bc': p.year.branchData.zh }),
    '<br>',
    L('lMC', { '%tn': p.month.termName, '%tl': p.month.termLon }),
    L('lMB', { '%mi': p.month.termIndex, '%bi': p.month.branch, '%bc': p.month.branchData.zh }),
    L('lMS', { '%ys': p.year.stem, '%mi': p.month.termIndex, '%si': p.month.stem, '%sc': p.month.stemData.zh }),
    '<br>',
    L('lDC'),
    L('lDF', { '%jd': Math.round(jd), '%di': p.day.cycleIndex }),
    '<br>',
    L('lHC', { '%rst': ft(rst.h, rst.m) }),
    L('lHB', { '%rh': rst.h, '%bi': p.hour.branch, '%bc': p.hour.branchData.zh, '%hrs': p.hour.branchData.hr }),
    L('lHS', { '%ds': p.day.stem, '%hi': p.hour.branch, '%si': p.hour.stem, '%sc': p.hour.stemData.zh }),
    '<br>',
    L('lRC'),
    L('lRF', { '%ct': ft(i.hour, i.minute), '%lc': sgn(rst.lc), '%eot': sgn(rst.eot), '%dst': rst.dst, '%rst': ft(rst.h, rst.m) }),
  ].join('');
}

// ─────────────────────────────────────────────
// RENDER COMPLETO
// ─────────────────────────────────────────────

/**
 * Monta todo o HTML de resultados a partir do JSON da API.
 * @param {object} result - resposta de /api/calculate
 * @returns {string} HTML
 */
export function renderResults(result) {
  const { pillars: p } = result;

  return `
    <p class="sec-label">${t('secPil')}</p>
    <div class="pillars-grid">
      ${pilCard(t('pH'), p.hour)}
      ${pilCard(t('pD'), p.day, true)}
      ${pilCard(t('pM'), p.month)}
      ${pilCard(t('pY'), p.year)}
    </div>
    ${renderInfoCards(result)}
    ${renderDaYun(result.daYun)}
    ${renderSolarTerms(result.solarTerms, result.input.year)}
    <p class="sec-label">${t('secLog')}</p>
    <div class="log-card">${buildLog(result)}</div>
    <div class="acc">${t('acc')}</div>`;
}
