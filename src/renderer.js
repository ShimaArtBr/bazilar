/**
 * @file src/renderer.js
 * @description Renderização completa do Mapa BaZi no DOM.
 *   Restaura todas as seções do site anterior:
 *   - Avisos (Zi, Hemisfério Sul)
 *   - Quatro Pilares com Ten Gods e Troncos Ocultos
 *   - Cards de info: Mestre do Dia, TSR, Ano BaZi, Longitude Solar
 *   - Balanço dos 5 Elementos
 *   - Força do Mestre do Dia
 *   - Termos Solares do Ano
 *   - Grandes Ciclos (Da Yun) com Direção e Ten Gods
 *   - Estrelas Simbólicas (神煞)
 *   - Interações entre Ramos
 *   - Exportar PDF (botão conectado a pdf.js)
 */

import { exportBaziPDF } from './modules/pdf.js';

/** Ano atual — usado para marcar o ciclo de sorte vigente. */
const ANO_ATUAL = new Date().getFullYear();

// ── Tabelas ───────────────────────────────────────────────────────────────────

/** Último mapa renderizado — mantido para exportação PDF sob demanda. */
let _lastMapa = null;
let _natalFourPillars = null;  // cópia dos pilares natais para restaurar após Da Yun

/**
 * Substitui o conteúdo do .bazi-map com os pilares de um ciclo Da Yun.
 * Exibe Tronco + Ramo do ciclo nos pilares Ano/Mês e dados natais nos pilares Dia/Hora.
 * Operação DOM pura — sem recalcular o mapa BaZi.
 */
function _swapMapaToDaYun(ciclo, tronco, ramo, startAge, endAge) {
  const mapaEl = document.querySelector('.bazi-map');
  if (!mapaEl || !_lastMapa) return;

  // Guardar pilares natais antes da primeira troca
  if (!_natalFourPillars) {
    _natalFourPillars = _lastMapa.fourPillars;
  }

  // Atualizar header de cada pilar para indicar modo Da Yun
  const headers = mapaEl.querySelectorAll('.bazi-pillar__header');
  const chars   = mapaEl.querySelectorAll('.bazi-pillar__char');
  const pinyins = mapaEl.querySelectorAll('.bazi-pillar__pinyin');

  // Pilar 0 (Hora) e 1 (Dia) — manter natais; Pilar 2 (Mês) e 3 (Ano) — mostrar ciclo
  const labels = ['Hora', 'Dia', 'Mês · 大運', 'Ano · 大運'];
  headers.forEach((h, i) => {
    const zh = ['时', '日', '月', '年'][i];
    h.textContent = `${labels[i].toUpperCase()} · ${zh}`;
  });

  // Pilares Mês e Ano recebem os caracteres do ciclo (tronco e ramo)
  // Pilar 2 = Mês → Tronco do ciclo; Pilar 3 = Ano → Ramo do ciclo
  if (chars.length >= 8) {
    // Posições: pilares × 2 (stem char + branch char por pilar)
    // [0]=Hora stem, [1]=Hora branch, [2]=Dia stem, [3]=Dia branch
    // [4]=Mês stem, [5]=Mês branch, [6]=Ano stem, [7]=Ano branch
    chars[4].textContent = tronco.zh;
    chars[5].textContent = ramo.zh;
    chars[6].textContent = tronco.zh;
    chars[7].textContent = ramo.zh;
  }
  if (pinyins.length >= 8) {
    pinyins[4].textContent = tronco.py;
    pinyins[5].textContent = ramo.py;
    pinyins[6].textContent = `${startAge}–${endAge}`;
    pinyins[7].textContent = `${ciclo.startYear}–${ciclo.startYear + 9}`;
  }

  // Aplicar stagger de entrada nos pilares atualizados
  mapaEl.classList.remove('bazi-map--revealed');
  requestAnimationFrame(() => requestAnimationFrame(() => mapaEl.classList.add('bazi-map--revealed')));
}

/**
 * Restaura o .bazi-map ao estado natal original.
 */
function _swapMapaToNatal() {
  const mapaEl = document.querySelector('.bazi-map');
  if (!mapaEl || !_lastMapa) return;

  // Re-renderizar a grade natal via renderQuatroPilares
  const { fourPillars, tenGods } = _lastMapa;
  mapaEl.replaceWith((() => {
    const tempDiv = document.createElement('div');
    renderQuatroPilares(fourPillars, tenGods, tempDiv);
    return tempDiv.querySelector('.bazi-map') || tempDiv.firstElementChild;
  })());

  _natalFourPillars = null;
}

const TRONCOS = [
  { zh: '甲', py: 'Jiǎ',  el: 'Wood',  yin: false },
  { zh: '乙', py: 'Yǐ',   el: 'Wood',  yin: true  },
  { zh: '丙', py: 'Bǐng', el: 'Fire',  yin: false },
  { zh: '丁', py: 'Dīng', el: 'Fire',  yin: true  },
  { zh: '戊', py: 'Wù',   el: 'Earth', yin: false },
  { zh: '己', py: 'Jǐ',   el: 'Earth', yin: true  },
  { zh: '庚', py: 'Gēng', el: 'Metal', yin: false },
  { zh: '辛', py: 'Xīn',  el: 'Metal', yin: true  },
  { zh: '壬', py: 'Rén',  el: 'Water', yin: false },
  { zh: '癸', py: 'Guǐ',  el: 'Water', yin: true  },
];

const RAMOS = [
  { zh: '子', py: 'Zǐ',   el: 'Water', animal: 'Rato',     yin: false },
  { zh: '丑', py: 'Chǒu', el: 'Earth', animal: 'Boi',      yin: true  },
  { zh: '寅', py: 'Yín',  el: 'Wood',  animal: 'Tigre',    yin: false },
  { zh: '卯', py: 'Māo',  el: 'Wood',  animal: 'Coelho',   yin: true  },
  { zh: '辰', py: 'Chén', el: 'Earth', animal: 'Dragão',   yin: false },
  { zh: '巳', py: 'Sì',   el: 'Fire',  animal: 'Serpente', yin: true  },
  { zh: '午', py: 'Wǔ',   el: 'Fire',  animal: 'Cavalo',   yin: false },
  { zh: '未', py: 'Wèi',  el: 'Earth', animal: 'Cabra',    yin: true  },
  { zh: '申', py: 'Shēn', el: 'Metal', animal: 'Macaco',   yin: false },
  { zh: '酉', py: 'Yǒu',  el: 'Metal', animal: 'Galo',     yin: true  },
  { zh: '戌', py: 'Xū',   el: 'Earth', animal: 'Cão',      yin: false },
  { zh: '亥', py: 'Hài',  el: 'Water', animal: 'Porco',    yin: true  },
];

// Troncos ocultos por ramo — 主(main)/中(mid)/余(minor)
const HIDDEN = [[9],[5,9,7],[0,2,4],[1],[4,1,9],[2,6,4],[3,5],[5,3,1],[6,8,4],[7],[4,7,3],[8,0]];
const HIDDEN_ROLE = ['主', '中', '余'];

// Ten Gods zh labels (index → label)
const TEN_GOD_LABELS = {
  '比肩': '比肩', '劫財': '劫財', '食神': '食神', '傷官': '傷官',
  '正財': '正財', '偏財': '偏財', '正官': '正官', '七殺': '七殺',
  '正印': '正印', '偏印': '偏印',
};

// Cores Wu Xing
const EL_COLORS = {
  wood:  { bg: 'var(--ol,#A8DBBF)', fg: 'var(--od,#0B5233)', mid: 'var(--om,#147A48)' },
  fire:  { bg: 'var(--fl,#F5BBBF)', fg: 'var(--fd,#8C0A12)', mid: 'var(--fm,#D3232E)' },
  earth: { bg: 'var(--el2,#F0E0A0)', fg: 'var(--ed,#7A4C08)', mid: 'var(--em,#B87C14)' },
  metal: { bg: 'var(--ml,#E0E0E0)', fg: 'var(--md,#383838)', mid: 'var(--mm,#848484)' },
  water: { bg: 'var(--wl,#B8CCF0)', fg: 'var(--wd,#1C3A72)', mid: 'var(--wm,#2652A8)' },
};

const EL_PT = { wood: 'Madeira', fire: 'Fogo', earth: 'Terra', metal: 'Metal', water: 'Água' };

function elKey(e) { return e ? e.toLowerCase() : ''; }

const LABELS_PILAR = ['Hora', 'Dia', 'Mês', 'Ano'];
const LABELS_ZH    = ['时', '日', '月', '年'];

// ── Helpers DOM ───────────────────────────────────────────────────────────────

function el(tag, cls = [], attrs = {}) {
  const n = document.createElement(tag);
  if (cls.length) n.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

function secLabel(txt, zh = '') {
  const s = el('p', ['sec-label']);
  s.textContent = (zh ? zh + ' — ' : '') + txt;
  return s;
}

function elBadge(element, extra = '') {
  const key = elKey(element);
  const label = (EL_PT[key] || element) + (extra ? ' · ' + extra : '');
  // DS v2.3: classes semânticas bazi-pillar__element--{element} via tokens.css
  // Mantém fallback inline via EL_COLORS para contextos fora do componente bazi-map
  const c = EL_COLORS[key] || {};
  const b = el('span', ['bazi-pillar__element', `bazi-pillar__element--${key}`], {
    role: 'img',
    'aria-label': `Elemento ${label}`,
  });
  b.textContent = label;
  // Fallback inline para compatibilidade com usos em luck pillars, balance etc.
  if (!key) { b.style.background = c.bg || ''; b.style.color = c.fg || ''; }
  return b;
}

function p2(n) { return String(Math.floor(n)).padStart(2, '0'); }
function ft(h, m, s) { return p2(h) + ':' + p2(m) + (s !== undefined ? ':' + p2(s) : ''); }
function sgn(n) { return (n >= 0 ? '+' : '') + (typeof n === 'number' ? n.toFixed(1) : n); }

// ── Avisos ────────────────────────────────────────────────────────────────────

function renderAvisos(mapa, container) {
  const { birth, rst } = mapa;
  const rstH = rst ? (rst.h + rst.m / 60 + rst.s / 3600) : (birth.rawHour ?? birth.hour);
  const isZi = rstH >= 23 || rstH < 1;

  if (isZi) {
    const div = el('div', ['zi-notice']);
    const metodo = birth.lateZi ? '晚子時 Late Zǐ' : '早子時 Early Zǐ';
    div.textContent = `Aviso hora Zǐ: nascimento entre 23:00–00:59. Método: ${metodo}.`;
    container.appendChild(div);
  }

  if (birth.southernHemisphere) {
    const div = el('div', ['zi-notice', 'hemi-notice']);
    div.textContent = '🌏 Hemisfério Sul — inversão sazonal ativa no pilar do mês.';
    container.appendChild(div);
  }
}

// ── Quatro Pilares ────────────────────────────────────────────────────────────
// Ordem de exibição: Hora · Dia · Mês · Ano (esquerda → direita, como site anterior)

function renderQuatroPilares(fourPillars, tenGods, container) {
  const wrap = el('div', []);
  wrap.appendChild(secLabel('OS QUATRO PILARES', '四柱'));

  // DS v2.3: .bazi-map substituindo .pillars-grid
  const grade = el('div', ['bazi-map']);

  // Ordem: hora=0, dia=1, mes=2, ano=3 (mapa[hora, dia, mes, ano])
  const pilares = [
    { pilar: fourPillars.hour,  label: 'Hora', zh: '时', isDia: false, tgIdx: 3 },
    { pilar: fourPillars.day,   label: 'Dia',  zh: '日', isDia: true,  tgIdx: 2 },
    { pilar: fourPillars.month, label: 'Mês',  zh: '月', isDia: false, tgIdx: 1 },
    { pilar: fourPillars.year,  label: 'Ano',  zh: '年', isDia: false, tgIdx: 0 },
  ];

  const tenGodMap = tenGods ? {
    hora:  tenGods[3],
    dia:   null,
    mes:   tenGods[1],
    ano:   tenGods[0],
  } : {};

  pilares.forEach(({ pilar, label, zh, isDia, tgIdx }) => {
    const tronco = TRONCOS[pilar.si];
    const ramo   = RAMOS[pilar.bi];
    if (!tronco || !ramo) return;

    const tgEntry = isDia ? null : tenGods?.[tgIdx];
    const tg = tgEntry?.tenGod;

    // DS v2.3: .bazi-pillar com tabindex para navegação por teclado (spec: Tab navega)
    const card = el('article', [
      'bazi-pillar',
      isDia ? 'is-day-master' : '',
    ].filter(Boolean), {
      'data-element':  elKey(ramo.el),
      'data-pillar':   label.toLowerCase(),
      'aria-label':    `Pilar do ${label}: Tronco ${tronco.zh} ${tronco.py}, Ramo ${ramo.zh} ${ramo.py}${tg ? ', Ten God ' + tg.zh : ''}`,
      'tabindex':      '0',
      'role':          'button',
    });

    // Feedback háptico no toque/clique (spec §4 — navigator.vibrate([20]))
    card.addEventListener('click', () => {
      if ('vibrate' in navigator) navigator.vibrate([20]);
    });
    // Enter abre detalhe (spec: Enter abre detalhe — placeholder para REQ-06 integração)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if ('vibrate' in navigator) navigator.vibrate([20]);
        card.dispatchEvent(new CustomEvent('bazi:pillar-activate', {
          bubbles: true,
          detail: { pilar, label, isDia, tronco, ramo },
        }));
      }
    });

    // ── Header: rótulo de posição ────────────────────────────────────────────
    const hd = el('div', ['bazi-pillar__header']);
    hd.textContent = `${label.toUpperCase()} · ${zh}${isDia ? ' ✦' : ''}`;
    card.appendChild(hd);

    // ── Tronco Celestial ─────────────────────────────────────────────────────
    const stemWrap = el('div', ['bazi-pillar__stem']);
    // Borda inferior colorida por elemento (mantida do design anterior)
    stemWrap.style.borderBottomColor = EL_COLORS[elKey(tronco.el)]?.mid || 'var(--color-gold-matte)';

    const stemChar = el('span', ['bazi-pillar__char'], {
      lang: 'zh-Hans',
      'aria-label': `${tronco.zh} — ${tronco.py}`,
    });
    stemChar.textContent = tronco.zh;
    stemWrap.appendChild(stemChar);

    const stemPy = el('span', ['bazi-pillar__pinyin']);
    stemPy.textContent = tronco.py;
    stemWrap.appendChild(stemPy);

    stemWrap.appendChild(elBadge(tronco.el));

    const stemYY = el('span', ['bazi-pillar__label']);
    stemYY.textContent = tronco.yin ? 'Yin' : 'Yang';
    stemWrap.appendChild(stemYY);

    if (tg) {
      const god = el('span', ['bazi-pillar__ten-god'], { lang: 'zh-Hans' });
      god.textContent = `${tg.zh} ${tg.py}`;
      stemWrap.appendChild(god);
    }
    card.appendChild(stemWrap);

    // ── Ramo Terrestre ───────────────────────────────────────────────────────
    const branchWrap = el('div', ['bazi-pillar__branch']);

    const branchChar = el('span', ['bazi-pillar__char'], {
      lang: 'zh-Hans',
      'aria-label': `${ramo.zh} — ${ramo.py}, ${ramo.animal}`,
    });
    branchChar.textContent = ramo.zh;
    branchWrap.appendChild(branchChar);

    const branchPy = el('span', ['bazi-pillar__pinyin']);
    branchPy.textContent = ramo.py;
    branchWrap.appendChild(branchPy);

    branchWrap.appendChild(elBadge(ramo.el));

    const branchSub = el('span', ['bazi-pillar__label']);
    branchSub.textContent = `${ramo.animal} · ${ramo.yin ? 'Yin' : 'Yang'}`;
    branchWrap.appendChild(branchSub);

    // ── Troncos Ocultos ──────────────────────────────────────────────────────
    const hiddenIdxs = HIDDEN[pilar.bi] || [];
    if (hiddenIdxs.length) {
      const hiddenDiv = el('div', ['bazi-pillar__hidden-stems']);
      hiddenIdxs.forEach((hsi, i) => {
        const ht = TRONCOS[hsi];
        if (!ht) return;
        const c = EL_COLORS[elKey(ht.el)] || {};
        const dmSi = fourPillars.day.si;
        const hGod = tenGods ? computeTenGodLabel(dmSi, hsi) : null;

        const s = el('span', ['bazi-pillar__hidden-stem'], { lang: 'zh-Hans' });
        s.textContent = `${ht.zh} ${HIDDEN_ROLE[i]}${hGod ? ' · ' + hGod : ''}`;
        // Mantém cores inline para troncos ocultos (contexto compacto)
        s.style.background = c.bg || '';
        s.style.color = c.fg || '';
        hiddenDiv.appendChild(s);
      });
      branchWrap.appendChild(hiddenDiv);
    }

    card.appendChild(branchWrap);
    grade.appendChild(card);
  });

  wrap.appendChild(grade);
  container.appendChild(wrap);

  // DS v2.3: stagger de entrada — adiciona .bazi-map--revealed após próximo frame
  // (spec §1: stagger 80ms entre células, translateY(12px)→0)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      grade.classList.add('bazi-map--revealed');
    });
  });
}

// Calcula o Ten God label de um tronco em relação ao Mestre do Dia
function computeTenGodLabel(dmSi, stemSi) {
  if (dmSi < 0 || stemSi < 0) return null;
  const dmEl = Math.floor(dmSi / 2);
  const stEl = Math.floor(stemSi / 2);
  const sameYin = (dmSi % 2) === (stemSi % 2);
  const rel = (stEl - dmEl + 5) % 5;
  const GODS = [
    sameYin ? '比肩' : '劫財',    // same element
    sameYin ? '食神' : '傷官',    // DM generates
    sameYin ? '偏財' : '正財',    // DM controls
    sameYin ? '七殺' : '正官',    // controls DM
    sameYin ? '偏印' : '正印',    // generates DM
  ];
  return GODS[rel] || null;
}

// ── Cards de Informação (grid 2×2) ───────────────────────────────────────────

function renderInfoGrid(mapa, container) {
  const { fourPillars, birth, sl, rst } = mapa;
  const dm = fourPillars.day.si;
  const dmTronco = TRONCOS[dm];
  const yP = fourPillars.year;
  const yTronco = TRONCOS[yP.si];
  const yRamo   = RAMOS[yP.bi];

  const grid = el('div', ['info-grid']);

  // Card: Mestre do Dia
  const cDM = el('div', ['info-card']);
  const cDMtitle = el('p', ['ic-title']); cDMtitle.textContent = 'MESTRE DO DIA · 日主';
  const cDMval = el('p', ['ic-val']);
  cDMval.textContent = dmTronco ? `${dmTronco.zh} ${dmTronco.py} — ${EL_PT[elKey(dmTronco.el)] || dmTronco.el} ${dmTronco.yin ? 'Yin' : 'Yang'}` : '—';
  const cDMsub = el('p', ['ic-sub']); cDMsub.textContent = 'Pilar central do mapa';
  cDM.appendChild(cDMtitle); cDM.appendChild(cDMval); cDM.appendChild(cDMsub);
  grid.appendChild(cDM);

  // Card: Tempo Solar Real
  const cTSR = el('div', ['info-card']);
  const cTSRtitle = el('p', ['ic-title']); cTSRtitle.textContent = 'TEMPO SOLAR REAL · TSR';
  const cTSRval = el('p', ['ic-val', 'ic-val--gold']);
  cTSRval.style.fontFamily = "'JetBrains Mono', monospace";
  if (rst) {
    cTSRval.textContent = ft(rst.h, rst.m, rst.s);
    const cTSRsub = el('p', ['ic-sub']);
    const rawH = birth.rawHour ?? birth.hour;
    const rawMin = birth.minute ?? 0;
    cTSRsub.textContent = `Relógio: ${p2(rawH)}:${p2(rawMin)}:00 · Correção: ${sgn(rst.corr)} min`;
    cTSR.appendChild(cTSRtitle); cTSR.appendChild(cTSRval); cTSR.appendChild(cTSRsub);
  } else {
    cTSRval.textContent = '—';
    const cTSRsub = el('p', ['ic-sub']); cTSRsub.textContent = 'Informe longitude e fuso para cálculo';
    cTSR.appendChild(cTSRtitle); cTSR.appendChild(cTSRval); cTSR.appendChild(cTSRsub);
  }
  grid.appendChild(cTSR);

  // Card: Ano BaZi
  const cYr = el('div', ['info-card']);
  const cYrtitle = el('p', ['ic-title']); cYrtitle.textContent = 'ANO BAZI · 八字年';
  const cYrval = el('p', ['ic-val']);
  cYrval.setAttribute('lang', 'zh-Hans');
  cYrval.textContent = yTronco && yRamo ? `${yTronco.zh}${yRamo.zh} · ${yP.by}` : String(birth.year);
  const cYrsub = el('p', ['ic-sub']); cYrsub.textContent = 'Muda em 立春 (~4 Fev)';
  cYr.appendChild(cYrtitle); cYr.appendChild(cYrval); cYr.appendChild(cYrsub);
  grid.appendChild(cYr);

  // Card: Longitude Solar
  const cSun = el('div', ['info-card']);
  const cSuntitle = el('p', ['ic-title']); cSuntitle.textContent = 'LONGITUDE SOLAR';
  const cSunval = el('p', ['ic-val']);
  cSunval.style.fontFamily = "'JetBrains Mono', monospace";
  cSunval.textContent = sl != null ? `${sl.toFixed(3)}°` : '—';
  const cSunsub = el('p', ['ic-sub']);
  const locStr = birth.latitude != null && birth.longitude != null
    ? `(${birth.latitude.toFixed(2)}, ${birth.longitude.toFixed(2)})`
    : '';
  cSunsub.textContent = locStr || 'Posição solar no nascimento';
  cSun.appendChild(cSuntitle); cSun.appendChild(cSunval); cSun.appendChild(cSunsub);
  grid.appendChild(cSun);

  container.appendChild(grid);
}

// ── Balanço dos 5 Elementos ───────────────────────────────────────────────────

function renderBalance(balance, container) {
  if (!balance) return;

  const wrap = el('div', ['elem-section']);
  wrap.appendChild(secLabel('BALANÇO DOS 5 ELEMENTOS', '五行'));

  const bar = el('div', ['elem-bar']);
  const ELEMS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  const max = Math.max(...ELEMS.map(e => balance[e] || 0), 1);

  ELEMS.forEach(elem => {
    const v = balance[elem] || 0;
    const pct = Math.round((v / max) * 100);
    const c = EL_COLORS[elKey(elem)] || {};

    const row = el('div', ['elem-row']);
    const name = el('span', ['elem-name']);
    name.textContent = EL_PT[elKey(elem)] || elem;
    row.appendChild(name);

    const track = el('div', ['elem-track']);
    const fill = el('div', ['elem-fill']);
    fill.style.width = `${pct}%`;
    fill.style.background = c.mid || c.fg || '';
    track.appendChild(fill);
    row.appendChild(track);

    const count = el('span', ['elem-count']);
    count.textContent = v.toFixed(1);
    row.appendChild(count);

    bar.appendChild(row);
  });

  wrap.appendChild(bar);
  container.appendChild(wrap);
}

// ── Força do Mestre do Dia ────────────────────────────────────────────────────

function renderForca(strength, favorable, dmStemIdx, container) {
  if (!strength) return;

  const wrap = el('div', ['strength-section']);
  wrap.appendChild(secLabel('FORÇA DO MESTRE DO DIA', '日主強弱'));

  const card = el('div', ['strength-card']);

  // Header
  const hd = el('div', ['str-header']);
  const dmTronco = (typeof dmStemIdx === 'number' && dmStemIdx >= 0) ? TRONCOS[dmStemIdx] : null;
  if (dmTronco) {
    const dmSpan = el('span', ['str-dm'], { lang: 'zh-Hans' });
    dmSpan.textContent = `${dmTronco.zh} ${dmTronco.py}`;
    hd.appendChild(dmSpan);
  }
  const verdict = el('span', ['str-verdict']);
  verdict.textContent = strength.strong ? 'Forte (旺)' : 'Fraco (弱)';
  hd.appendChild(verdict);

  const score = el('span', ['str-score']);
  const scoreVal = strength.score ?? 0;
  score.textContent = `Pontuação: ${scoreVal >= 0 ? '+' : ''}${scoreVal.toFixed(2)}`;
  hd.appendChild(score);
  card.appendChild(hd);

  // Barra
  const norm = Math.min(1, Math.max(0, (Math.abs(scoreVal)) / 10));
  const barWrap = el('div', ['str-bar-wrap']);
  const barEl = el('div', ['str-bar']);
  barEl.style.width = `${norm * 100}%`;
  const dmBarKey = elKey(strength.dmEl || (dmTronco ? dmTronco.el : 'water'));
  barEl.style.background = EL_COLORS[dmBarKey]?.mid || (strength.strong ? 'var(--om)' : 'var(--wm)');
  barWrap.appendChild(barEl);
  card.appendChild(barWrap);

  // Favoráveis
  if (favorable?.favorable?.length) {
    const row = el('div', ['str-row']);
    const lbl = el('span', ['str-lbl']); lbl.textContent = 'Elementos Favoráveis (用神)';
    row.appendChild(lbl);
    const els = el('span', ['str-els']);
    favorable.favorable.forEach(e => els.appendChild(elBadge(e)));
    row.appendChild(els);
    card.appendChild(row);
  }

  // Desfavoráveis
  if (favorable?.unfavorable?.length) {
    const row = el('div', ['str-row']);
    const lbl = el('span', ['str-lbl']); lbl.textContent = 'Elementos Desfavoráveis (忌神)';
    row.appendChild(lbl);
    const els = el('span', ['str-els']);
    favorable.unfavorable.forEach(e => els.appendChild(elBadge(e)));
    row.appendChild(els);
    card.appendChild(row);
  }

  wrap.appendChild(card);
  container.appendChild(wrap);
}

// ── Termos Solares do Ano ─────────────────────────────────────────────────────

function renderTermosSolares(solarTerms, birthYear, container) {
  if (!solarTerms?.length) return;

  const wrap = el('div', ['term-section']);
  const title = el('p', ['term-ttl']);
  title.textContent = `TERMOS SOLARES DE ${birthYear}`;
  wrap.appendChild(title);

  // Divide em duas linhas de 6
  const bar = el('div', ['term-bar']);
  const pastCount = solarTerms.filter(t => t.past).length;
  const curIdx = pastCount - 1;

  [solarTerms.slice(0, 6), solarTerms.slice(6)].forEach(half => {
    const row = el('div', ['term-row'], { role: 'list' });
    half.forEach(td => {
      const cls = td.idx < curIdx ? 'past' : td.idx === curIdx ? 'cur' : '';
      const dot = el('span', ['term-dot', cls].filter(Boolean), { role: 'listitem' });
      dot.textContent = `${td.n} ${p2(td.day)}/${p2(td.month)}`;
      row.appendChild(dot);
    });
    bar.appendChild(row);
  });

  wrap.appendChild(bar);
  container.appendChild(wrap);
}

// ── Grandes Ciclos (Da Yun) ───────────────────────────────────────────────────

/**
 * Executa troca animada do mapa BaZi entre modo Natal e modo Da Yun.
 * DS v2.3 §2: fade-out 200ms → pausa 50ms → fade-in 300ms
 * prefers-reduced-motion: tokens zeraram --duration-fast/normal → transição instantânea
 *
 * @param {HTMLElement} mapEl  — elemento .bazi-map a animar
 * @param {Function}    swapFn — callback executado no momento da troca (conteúdo invisível)
 */
function animateMapSwap(mapEl, swapFn) {
  if (!mapEl) { swapFn(); return; }

  const FADE_OUT = 200;  // var(--duration-fast)
  const PAUSE    =  50;
  const FADE_IN  = 300;  // var(--duration-normal)

  // Respeitar prefers-reduced-motion: se tokens zeraram durações, executar direto
  const style = getComputedStyle(document.documentElement);
  const fast  = parseFloat(style.getPropertyValue('--duration-fast') || '200');
  if (fast === 0) { swapFn(); return; }

  mapEl.classList.add('bazi-map--fade-out');
  mapEl.classList.remove('bazi-map--fade-in');

  setTimeout(() => {
    swapFn();
    setTimeout(() => {
      mapEl.classList.remove('bazi-map--fade-out');
      mapEl.classList.add('bazi-map--fade-in');
      // Limpar classe após conclusão
      setTimeout(() => mapEl.classList.remove('bazi-map--fade-in'), FADE_IN);
    }, PAUSE);
  }, FADE_OUT);
}

function renderGrandesCiclos(luckPillars, luckRaw, dmStemIdx, container) {
  if (!luckPillars?.length) return;

  const wrap = el('div', ['luck-section']);
  wrap.appendChild(secLabel('GRANDES CICLOS (10 ANOS)', '大運'));

  // Direção e início
  if (luckRaw) {
    const meta = el('div', ['luck-meta']);
    const dir = luckRaw.forward ? 'Crescente ♂' : 'Decrescente ♀';
    const startAge = luckRaw.startAge ?? '?';
    const startM   = luckRaw.startMonths > 0 ? ` + ${luckRaw.startMonths}m` : '';
    meta.textContent = `Direção: ${dir} · Início na idade: ${startAge}${startM}`;
    wrap.appendChild(meta);
  }

  const grid = el('div', ['luck-grid']);
  const grid1 = el('div', ['luck-row']);
  const grid2 = el('div', ['luck-row']);
  const isCur = (ciclo) => ANO_ATUAL >= ciclo.startYear && ANO_ATUAL < (ciclo.startYear + 10);
  let idx = 0;

  luckPillars.forEach(ciclo => {
    const tronco = TRONCOS[ciclo.si];
    const ramo   = RAMOS[ciclo.bi];
    if (!tronco || !ramo) return;

    const startYear = ciclo.startYear ?? (ciclo.age != null ? ciclo.age : 0);
    const startAge  = ciclo.age ?? ciclo.startAge;
    const endAge    = ciclo.ageEnd ?? (startAge + 9);
    const isCurrent = isCur(ciclo);

    const card = el('div', ['luck-card', isCurrent ? 'current' : ''].filter(Boolean), {
      'aria-label': `Ciclo ${startAge}–${endAge} (${ciclo.startYear}): ${tronco.py} ${ramo.py}`,
      'tabindex': '0',
      'role': 'button',
      'title': 'Clique para ver o mapa deste ciclo',
    });

    const ageEl = el('div', ['luck-age']);
    ageEl.textContent = `${startAge}–${endAge}${isCurrent ? ' ✦' : ''}`;
    card.appendChild(ageEl);

    const chars = el('div', ['luck-chars'], { lang: 'zh-Hans' });
    chars.textContent = tronco.zh + ramo.zh;
    card.appendChild(chars);

    const py = el('div', ['luck-py']);
    py.textContent = `${tronco.py} ${ramo.py}`;
    card.appendChild(py);

    const badgeWrap = el('div', ['luck-elem']);
    badgeWrap.appendChild(elBadge(tronco.el));
    card.appendChild(badgeWrap);

    // Ten God do tronco do ciclo em relação ao DM
    if (typeof dmStemIdx === 'number' && dmStemIdx >= 0) {
      const tgLabel = computeTenGodLabel(dmStemIdx, ciclo.si);
      if (tgLabel) {
        const tgEl = el('div', ['luck-tg'], { lang: 'zh-Hans' });
        tgEl.textContent = tgLabel;
        card.appendChild(tgEl);
      }
    }

    const yr = el('div', ['luck-years']);
    yr.textContent = `${ciclo.startYear}–${ciclo.startYear + 9}`;
    card.appendChild(yr);

    // DS v2.3 §2 — Troca Natal↔Da Yun: clique no luck card troca o mapa com fade
    const activateCiclo = () => {
      const mapaEl = document.querySelector('.bazi-map');
      const btnNatal = document.getElementById('_btnVoltarNatal');

      // Marcar card ativo visualmente
      document.querySelectorAll('.luck-card').forEach(c => c.classList.remove('active-cycle'));
      card.classList.add('active-cycle');

      animateMapSwap(mapaEl, () => {
        // Trocar o mapa para mostrar os pilares deste ciclo
        _swapMapaToDaYun(ciclo, tronco, ramo, startAge, endAge);
      });

      // Mostrar botão "Voltar ao Natal" se ainda não existe
      if (!btnNatal) {
        const btn = el('button', ['btn-voltar-natal'], {
          id: '_btnVoltarNatal',
          type: 'button',
          'aria-label': 'Voltar ao mapa natal',
        });
        btn.textContent = '← Mapa Natal';
        btn.addEventListener('click', () => {
          document.querySelectorAll('.luck-card').forEach(c => c.classList.remove('active-cycle'));
          const mapaEl2 = document.querySelector('.bazi-map');
          animateMapSwap(mapaEl2, () => _swapMapaToNatal());
          btn.remove();
        });
        // Inserir acima do mapa
        mapaEl?.closest('div')?.parentElement?.insertBefore(btn, mapaEl?.closest('div'));
      }
    };

    card.addEventListener('click', activateCiclo);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateCiclo(); }
    });

    (idx < 4 ? grid1 : grid2).appendChild(card);
    idx++;
  });

  grid.appendChild(grid1);
  if (grid2.children.length) grid.appendChild(grid2);
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

// ── Estrelas Simbólicas (神煞) ────────────────────────────────────────────────

function renderEstrelasSimbolicas(stars, allBranches, container) {
  if (!stars?.length) return;

  const wrap = el('div', ['stars-section']);
  wrap.appendChild(secLabel('ESTRELAS SIMBÓLICAS', '神煞'));

  const grid = el('div', ['stars-grid']);

  const STAR_NAMES = {
    starTianYi: 'TianYi 天乙 (Boa Fortuna)',
    starTaoHua: 'TaoHua 桃花 (Flor de Pêssego)',
    starYiMa:   'YiMa 驛馬 (Cavalo Viajante)',
  };
  const SOURCE_LABELS = { year: 'ano', day: 'dia', month: 'mês' };

  stars.forEach(star => {
    const ramo = RAMOS[star.branch];
    if (!ramo) return;
    const found = allBranches.indexOf(star.branch) !== -1;

    const card = el('div', ['star-card']);
    card.style.opacity = found ? '1' : '0.5';

    const nameEl = el('div', ['star-name']);
    nameEl.textContent = STAR_NAMES[star.name] || star.name;
    card.appendChild(nameEl);

    const valEl = el('div', ['star-val'], { lang: 'zh-Hans' });
    valEl.textContent = `${ramo.zh} ${ramo.py}${found ? ' ✓' : ' (—)'}`;
    card.appendChild(valEl);

    const descEl = el('div', ['star-desc']);
    descEl.textContent = [
      star.source ? `(${SOURCE_LABELS[star.source] || star.source})` : '',
      found ? '— presente no mapa' : '',
    ].filter(Boolean).join(' ');
    card.appendChild(descEl);

    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  container.appendChild(wrap);
}

// ── Interações entre Ramos ────────────────────────────────────────────────────

const LABEL_INTERACAO = {
  harmony6: 'HARMONIA HEXAGONAL (六合)',
  harmony3: 'HARMONIA TRIANGULAR (三合)',
  clash:    'CHOQUE (沖)',
  harm:     'DANO (害)',
  penalty:  'PENALIDADE (刑)',
};

function renderInteracoes(interactions, container) {
  if (!interactions?.length) return;

  const wrap = el('div', ['interact-section']);
  wrap.appendChild(secLabel('INTERAÇÕES ENTRE RAMOS TERRESTRES'));

  const lista = el('div', ['interact-list']);

  interactions.forEach(inter => {
    const item = el('div', ['interact-item']);

    if (inter.type === 'clash') {
      item.style.borderColor = 'rgba(196,74,53,.3)';
    } else if (inter.type === 'harm') {
      item.style.borderColor = 'rgba(192,105,43,.3)';
    } else if (inter.type === 'penalty') {
      item.style.borderColor = 'rgba(196,74,53,.4)';
    }

    const tipo = el('span', ['interact-type']);
    const isClash = inter.type === 'clash' || inter.type === 'penalty';
    if (isClash) tipo.style.color = 'var(--fire2, #e05c4a)';
    else if (inter.type === 'harm') tipo.style.color = '#e0883a';
    tipo.textContent = LABEL_INTERACAO[inter.type] ?? inter.type.toUpperCase();
    item.appendChild(tipo);

    const pair = el('span', ['interact-pair'], { lang: 'zh-Hans' });
    const branches = inter.branches || [];
    if (inter.type === 'clash' && branches.length === 2) {
      const [b0, b1] = branches;
      const r0 = RAMOS[b0], r1 = RAMOS[b1];
      pair.textContent = `${r0?.animal ?? ''} ${r0?.zh ?? ''} ↔ ${r1?.zh ?? ''} ${r1?.animal ?? ''}`;
    } else {
      pair.textContent = branches.map(b => {
        const r = RAMOS[b];
        return r ? `${r.zh} ${r.animal}` : '';
      }).join(' + ');
    }
    item.appendChild(pair);

    if (inter.el) {
      const res = el('span', ['interact-result']);
      res.textContent = `→ ${EL_PT[elKey(inter.el)] || inter.el}`;
      item.appendChild(res);
    } else if (inter.type === 'penalty' && inter.zh) {
      const res = el('span', ['interact-result']);
      if (isClash) res.style.color = 'var(--fire2, #e05c4a)';
      res.textContent = inter.zh;
      item.appendChild(res);
    } else if (inter.type === 'clash') {
      const res = el('span', ['interact-result']);
      res.style.color = 'var(--fire2, #e05c4a)';
      res.textContent = '⚡';
      item.appendChild(res);
    } else if (inter.type === 'harm') {
      const res = el('span', ['interact-result']);
      res.style.color = '#e0883a';
      res.textContent = '⚠';
      item.appendChild(res);
    }

    lista.appendChild(item);
  });

  wrap.appendChild(lista);
  container.appendChild(wrap);
}

// ── Botão Exportar PDF ────────────────────────────────────────────────────────

/**
 * Converte a estrutura `mapa` (API renderer) para o formato esperado por pdf.js
 * (compatível com a estrutura legada de ui.js).
 *
 * @param {{ fourPillars, luckRaw, interactions, balance, stars, sl, solarTerms, rst, birth }} mapa
 * @returns {object} data para exportBaziPDF()
 */
function _adaptMapaToPDFData(mapa) {
  const { fourPillars, luckRaw, interactions, balance, stars, sl, solarTerms, rst, birth } = mapa;

  const allBranches = [
    fourPillars.hour.bi, fourPillars.day.bi,
    fourPillars.month.bi, fourPillars.year.bi,
  ].filter(b => b != null);

  const pastCount = solarTerms ? solarTerms.filter(t => t.past).length : 0;
  const cti = pastCount - 1;

  // solarTerms tem {n, py, day, month, past, idx}; pdf.js espera {n, date:{day,month}, past, idx}
  const tds = solarTerms
    ? solarTerms.map(t => ({ n: t.n, date: { day: t.day, month: t.month }, past: t.past, idx: t.idx }))
    : [];

  // RST fallback se coords não foram fornecidas
  const rstData = rst || {
    h: birth.rawHour ?? birth.hour, m: birth.minute ?? 0, s: 0,
    lc: 0, e: 0, dc: 0, corr: 0,
  };

  // Formato de input legado (ui.js)
  const i = {
    name:   birth.name   || '',
    y:      birth.year,
    m:      birth.month,
    d:      birth.day,
    hh:     birth.rawHour  ?? birth.hour,
    mm:     birth.minute   ?? 0,
    lo:     birth.longitude ?? 0,
    la:     birth.latitude  ?? 0,
    tz:     birth.timezone  ?? 0,
    dst:    birth.dst       ?? false,
    city:   birth.city      || '',
    gender: birth.gender,
  };

  return {
    i,
    hP: fourPillars.hour,
    dP: fourPillars.day,
    mP: fourPillars.month,
    yP: fourPillars.year,
    dm: fourPillars.day.si,
    sl:  sl ?? 0,
    rst: rstData,
    balance:      balance      || {},
    luck:         luckRaw      || null,
    stars:        stars        || [],
    allBranches,
    interactions: interactions || [],
    tds,
    cti,
  };
}

// ── 10 Deuses — Interpretação Editorial (REQ-13 · B2) ────────────────────────
//
// Contrato de binding: computeTenGodLabel(dmSi, stemSi) → string zh
//   lookup: DEZ_DEUSES.find(d => d.caractere === zhLabel)
// Ver docs/TENGOD_CONTRACT.md para especificação completa.
//
// Tier: conteúdo marcado como PREMIUM na UI com gate visual.
//       Exibe arquétipo + expressão positiva/negativa + pergunta reflexiva.
//       Pilar do Dia não tem Ten God — omitido conforme contrato.

/** @type {Object[]|null} Cache do JSON após primeiro import */
let _dezDeusesCache = null;

/**
 * Carrega dez_deuses_bazi_app.json (lazy, uma vez por sessão).
 * Retorna array de deuses ou [] em caso de falha.
 * @returns {Promise<Object[]>}
 */
async function loadDezDeuses() {
  if (_dezDeusesCache) return _dezDeusesCache;
  try {
    const res = await fetch('/dez_deuses_bazi_app.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _dezDeusesCache = data.deuses ?? [];
    return _dezDeusesCache;
  } catch (err) {
    console.warn('[renderer] dez_deuses_bazi_app.json não carregado:', err.message);
    return [];
  }
}

/**
 * Lookup de entrada editorial pelo caractere zh.
 * @param {string|null} zhLabel
 * @param {Object[]} dezDeuses
 * @returns {Object|null}
 */
function lookupDeus(zhLabel, dezDeuses) {
  if (!zhLabel || !dezDeuses?.length) return null;
  return dezDeuses.find(d => d.caractere === zhLabel) ?? null;
}

/**
 * Renderiza a seção "10 Deuses" com interpretação editorial.
 * Pilares: Ano, Mês, Hora (Dia = Mestre do Dia, sem Ten God).
 *
 * @param {{ fourPillars: Object, tenGods: Object[] }} mapa
 * @param {number} dmStemIdx
 * @param {HTMLElement} container
 */
async function renderDezDeuses(mapa, dmStemIdx, container) {
  const { fourPillars, tenGods } = mapa;
  if (!fourPillars || !tenGods) return;

  const dezDeuses = await loadDezDeuses();
  if (!dezDeuses.length) return; // JSON não disponível — seção omitida silenciosamente

  // Monta os 3 pilares com Ten God (exclui Dia)
  const PILAR_LABELS = ['Ano', 'Mês', 'Hora'];
  const PILAR_KEYS   = ['year', 'month', 'hour'];
  const TENGOD_IDX   = [0, 1, 3]; // índices em tenGods[] correspondentes

  const entries = [];
  for (let i = 0; i < 3; i++) {
    const pillar = fourPillars[PILAR_KEYS[i]];
    const tgEntry = tenGods[TENGOD_IDX[i]];
    if (!pillar || !tgEntry) continue;
    const zhLabel = computeTenGodLabel(dmStemIdx, pillar.si);
    const deus = lookupDeus(zhLabel, dezDeuses);
    if (deus) entries.push({ label: PILAR_LABELS[i], zhLabel, deus });
  }

  if (!entries.length) return;

  // ── Seção wrapper ────────────────────────────────────────────────────────
  const sec = el('section', ['dez-deuses-sec']);
  sec.setAttribute('aria-labelledby', 'dezDeusesTitle');

  // Header
  const header = el('div', ['dez-deuses-header']);
  const title = el('h2', ['dez-deuses-title'], { id: 'dezDeusesTitle' });
  title.textContent = '10 Deuses · Shí Shén · 十神';
  header.appendChild(title);
  sec.appendChild(header);

  const subhead = el('p', ['dez-deuses-subhead']);
  subhead.textContent = 'Como cada pilar do seu mapa se relaciona com o Mestre do Dia.';
  sec.appendChild(subhead);

  // ── Cards por pilar ──────────────────────────────────────────────────────
  const grid = el('div', ['dez-deuses-grid']);

  for (const { label, zhLabel, deus } of entries) {
    const card = el('article', ['deus-card']);
    card.setAttribute('lang', 'pt-BR');

    // Cabeçalho accordion (sempre visível, clicável)
    const cardHead = el('div', ['deus-card__head']);
    cardHead.setAttribute('role', 'button');
    cardHead.setAttribute('tabindex', '0');
    cardHead.setAttribute('aria-expanded', 'false');
    const pillarLabel = el('span', ['deus-card__pilar']);
    pillarLabel.textContent = `Pilar do ${label}`;
    const charSpan = el('span', ['deus-card__char'], { lang: 'zh-Hans' });
    charSpan.textContent = zhLabel;
    const nomePt = el('span', ['deus-card__nome']);
    nomePt.textContent = deus.nome_pt;
    const arrow = el('span', ['deus-card__arrow'], { 'aria-hidden': 'true' });
    arrow.textContent = '▼';
    cardHead.appendChild(pillarLabel);
    cardHead.appendChild(charSpan);
    cardHead.appendChild(nomePt);
    cardHead.appendChild(arrow);
    card.appendChild(cardHead);

    // Corpo accordion (recolhido por padrão)
    const body = el('div', ['deus-card__body']);
    body.hidden = true;

    // Arquétipo
    if (deus.definicao?.psicologica) {
      const archetypeEl = el('p', ['deus-card__archetype']);
      archetypeEl.textContent = deus.definicao.psicologica;
      body.appendChild(archetypeEl);
    }

    // Expressão positiva / negativa
    const expr = el('div', ['deus-card__expr']);
    if (deus.expressao?.positiva) {
      const pos = el('div', ['deus-card__expr-block', 'deus-card__expr-block--pos']);
      const posLabel = el('span', ['deus-card__expr-label']);
      posLabel.textContent = '✦ Expressão Positiva';
      const posText = el('p', ['deus-card__expr-text']);
      posText.textContent = deus.expressao.positiva;
      pos.appendChild(posLabel);
      pos.appendChild(posText);
      expr.appendChild(pos);
    }
    if (deus.expressao?.negativa) {
      const neg = el('div', ['deus-card__expr-block', 'deus-card__expr-block--neg']);
      const negLabel = el('span', ['deus-card__expr-label']);
      negLabel.textContent = '◆ Expressão de Sombra';
      const negText = el('p', ['deus-card__expr-text']);
      negText.textContent = deus.expressao.negativa;
      neg.appendChild(negLabel);
      neg.appendChild(negText);
      expr.appendChild(neg);
    }
    if (expr.children.length) body.appendChild(expr);

    // Pergunta central
    if (deus.desenvolvimento_pessoal?.pergunta_central) {
      const qWrap = el('div', ['deus-card__question']);
      const qIcon = el('span', ['deus-card__question-icon'], { 'aria-hidden': 'true' });
      qIcon.textContent = '◎';
      const qText = el('p', ['deus-card__question-text']);
      qText.textContent = deus.desenvolvimento_pessoal.pergunta_central;
      qWrap.appendChild(qIcon);
      qWrap.appendChild(qText);
      body.appendChild(qWrap);
    }

    card.appendChild(body);

    // Toggle accordion
    const toggle = () => {
      const expanded = cardHead.getAttribute('aria-expanded') === 'true';
      cardHead.setAttribute('aria-expanded', String(!expanded));
      body.hidden = expanded;
      arrow.textContent = expanded ? '▼' : '▲';
    };
    cardHead.addEventListener('click', toggle);
    cardHead.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    grid.appendChild(card);
  }

  sec.appendChild(grid);

  // Gate premium — TEMPORARIAMENTE DESATIVADO para validação de conteúdo
  // TODO: reativar após validação

  container.appendChild(sec);
}

function renderBotaoPDF(container) {
  const btn = el('button', ['pdf-export-btn'], { id: 'pdfExportBtn', type: 'button' });
  btn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
         stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 1z"/>
      <polyline points="9 1 9 6 14 6"/>
      <line x1="5" y1="10" x2="11" y2="10"/>
      <line x1="5" y1="13" x2="8" y2="13"/>
    </svg>
    <span id="uiPdfBtnLabel">EXPORTAR PDF</span>`;

  btn.addEventListener('click', () => {
    if (!_lastMapa) return;
    const lbl = btn.querySelector('#uiPdfBtnLabel');
    btn.disabled = true;
    if (lbl) lbl.textContent = '…';
    exportBaziPDF(_adaptMapaToPDFData(_lastMapa)).finally(() => {
      btn.disabled = false;
      if (lbl) lbl.textContent = 'EXPORTAR PDF';
    });
  });

  container.appendChild(btn);
}

// ── Exportação principal ──────────────────────────────────────────────────────

/**
 * Renderiza o Mapa BaZi completo no container fornecido.
 * @param {{ fourPillars, luckPillars, luckRaw, interactions, tenGods,
 *           strength, favorable, balance, stars, sl, solarTerms, rst, birth }} mapa
 * @param {HTMLElement} container
 */
export function renderBaziChart(mapa, container) {
  if (!container) { console.error('[renderer] Container não fornecido.'); return; }

  // Armazena para exportação PDF sob demanda
  _lastMapa = mapa;

  const frag    = document.createDocumentFragment();
  const wrapper = el('div', ['bazi-chart']);

  const { fourPillars, luckPillars, luckRaw, interactions, tenGods,
          strength, favorable, balance, stars, solarTerms, birth } = mapa;

  const dmStemIdx = fourPillars?.day?.si;
  const allBranches = [
    fourPillars?.hour?.bi, fourPillars?.day?.bi,
    fourPillars?.month?.bi, fourPillars?.year?.bi,
  ].filter(b => b != null);

  // 1. Avisos (Zi, Hemisfério Sul)
  renderAvisos(mapa, wrapper);

  // 2. Quatro Pilares (com ten gods e troncos ocultos)
  renderQuatroPilares(fourPillars, tenGods, wrapper);

  // 3. Botão PDF — logo após o mapa
  renderBotaoPDF(wrapper);

  // 4. Cards info: DM · TSR · Ano BaZi · Longitude Solar
  renderInfoGrid(mapa, wrapper);

  // 5. Balanço dos 5 Elementos
  renderBalance(balance, wrapper);

  // 6. Força do Mestre do Dia
  renderForca(strength, favorable, dmStemIdx, wrapper);

  // 7. Termos Solares do Ano
  renderTermosSolares(solarTerms, birth?.year, wrapper);

  // 8. Grandes Ciclos com direção e ten gods
  renderGrandesCiclos(luckPillars, luckRaw, dmStemIdx, wrapper);

  // 9. Estrelas Simbólicas
  renderEstrelasSimbolicas(stars, allBranches, wrapper);

  // 10. Interações entre Ramos
  renderInteracoes(interactions, wrapper);

  // 11. 10 Deuses — interpretação editorial (REQ-13 · B2)
  renderDezDeuses(mapa, dmStemIdx, wrapper).catch(err =>
    console.warn('[renderer] renderDezDeuses:', err)
  );

  // ── Commit ao DOM ──
  // innerHTML limpo DEPOIS de construir o fragmento — evita tela em branco em caso de erro
  frag.appendChild(wrapper);
  container.innerHTML = '';
  container.appendChild(frag);

  requestAnimationFrame(() => container.classList.add('chart-visible'));
}
