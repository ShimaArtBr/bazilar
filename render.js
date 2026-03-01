/**
 * render.js — Renderização completa dos resultados BAZILAR
 * Recebe JSON da API e constrói as abas de resultado.
 * Sem lógica astronômica — apenas apresentação.
 */

import { t, te, tp, tpl, LANG } from './i18n.js';

// ─── UTILITÁRIOS ───────────────────────────
const p2  = n => String(Math.floor(n)).padStart(2, '0');
const ft  = (h, m) => `${p2(h)}:${p2(m)}`;
const sgn = n => (n >= 0 ? '+' : '') + n.toFixed(1);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Cores por elemento
const EL_STYLE = {
  Wood:  { bg: 'rgba(74,124,78,.18)',    tx: '#7dba82' },
  Fire:  { bg: 'rgba(176,58,46,.18)',    tx: '#e05c4a' },
  Earth: { bg: 'rgba(139,105,20,.16)',   tx: '#c9a84c' },
  Metal: { bg: 'rgba(110,125,138,.16)',  tx: '#b0bec5' },
  Water: { bg: 'rgba(36,113,163,.16)',   tx: '#5b9fc9' },
};

function badge(el) {
  const c = EL_STYLE[el] || {};
  return `<span class="badge-el" style="background:${c.bg};color:${c.tx}">${te(el)}</span>`;
}

function badgeTG(tg) {
  if (!tg) return '';
  const catColor = {
    peer: '#8888a4', output: '#7dba82', resource: '#5b9fc9',
    wealth: '#c9a84c', power: '#e05c4a',
  };
  const col = catColor[tg.cat] || 'var(--muted)';
  return `<span class="badge-tg" style="color:${col}" title="${tg.en}">${tg.zh}</span>`;
}

// ─── ABA 1 — OS QUATRO PILARES ────────────────
export function renderTab1(r) {
  const p = r.pillars;
  const dm = r.dayMaster;

  function pillar(hdr, pl, isDM) {
    const hs = pl.hiddenStems.map(h =>
      `<div class="hs-item">
        <span class="hs-char" title="${h.stem.py}">${h.stem.zh}</span>
        <span class="hs-w">${h.weight}%</span>
        ${h.tenGod ? `<span class="hs-god" style="color:${godColor(h.tenGod.cat)}">${h.tenGod.zh}</span>` : ''}
      </div>`
    ).join('');

    const phase = pl.growthPhase ? `<div class="p-phase">${pl.growthPhase.name}</div>` : '';

    return `
    <div class="pillar-col">
      <div class="pillar-hdr ${isDM ? 'pillar-hdr--dm' : ''}">${hdr}</div>
      <div class="pillar-stem">
        ${!isDM && pl.tenGodStem ? badgeTG(pl.tenGodStem) : ''}
        <span class="p-big">${pl.stemData.zh}</span>
        <span class="p-py">${pl.stemData.py}</span>
        ${badge(pl.stemData.el)}
        <span class="p-po">${tp(pl.stemData.po)}</span>
        ${phase}
      </div>
      <div class="pillar-branch">
        <span class="p-big">${pl.branchData.zh}</span>
        <span class="p-py">${pl.branchData.py}</span>
        ${badge(pl.branchData.el)}
        <span class="p-po">${pl.branchData.an} · ${tp(pl.branchData.po)}</span>
      </div>
      <div class="pillar-hidden">${hs}</div>
    </div>`;
  }

  const rstLine = `${ft(r.rst.h, r.rst.m)} <span class="muted">(${t('clk')} ${ft(r.input.hour, r.input.minute)}, corr. ${sgn(r.rst.corr)} min)</span>`;

  return `
  <div class="pillars-wrap">
    <div class="pillars-grid">
      ${pillar(t('pH'), p.hour)}
      ${pillar(t('pD'), p.day, true)}
      ${pillar(t('pM'), p.month)}
      ${pillar(t('pY'), p.year)}
    </div>
  </div>

  <div class="info-row">
    <div class="info-chip">
      <span class="ic-l">${t('rstLbl')}</span>
      <span class="ic-v">${rstLine}</span>
    </div>
    <div class="info-chip">
      <span class="ic-l">${t('yr')}</span>
      <span class="ic-v">${p.year.stemData.zh}${p.year.branchData.zh} · ${p.year.baziYear}
        <span class="muted">${t('yrSub')}</span></span>
    </div>
    <div class="info-chip">
      <span class="ic-l">${t('sun')}</span>
      <span class="ic-v">${r.sunLongitude.toFixed(3)}°</span>
    </div>
  </div>`;
}

function godColor(cat) {
  return { peer:'#8888a4', output:'#7dba82', resource:'#5b9fc9',
           wealth:'#c9a84c', power:'#e05c4a' }[cat] || 'var(--muted)';
}

// ─── ABA 2 — MESTRE DO DIA ──────────────────
export function renderTab2(r) {
  const dm  = r.dayMaster;
  const str = dm.strength;
  const pct = str.pct;

  // Barra de força
  const barColor = pct >= 55 ? '#7dba82' : pct >= 42 ? '#c9a84c' : '#e05c4a';
  const bar = `
    <div class="strength-bar-wrap">
      <div class="strength-bar-track">
        <div class="strength-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        <div class="strength-bar-mid"></div>
      </div>
      <div class="strength-labels">
        <span>Weak</span><span>Neutral</span><span>Strong</span>
      </div>
    </div>`;

  // Descrição do DM por elemento
  const dmDesc = {
    Wood:  'Jiǎ/Yǐ — Crescimento, visão, generosidade. Busca expansão e propósito.',
    Fire:  'Bǐng/Dīng — Clareza, paixão, carisma. Ilumina e aquece o entorno.',
    Earth: 'Wù/Jǐ — Estabilidade, confiança, mediação. Centro e fundamento.',
    Metal: 'Gēng/Xīn — Precisão, justiça, determinação. Corta o que é supérfluo.',
    Water: 'Rén/Guǐ — Adaptação, inteligência, profundidade. Flui e permeia.',
  };

  return `
  <div class="dm-hero">
    <div class="dm-char">${dm.stem.zh}</div>
    <div class="dm-info">
      <div class="dm-name">${dm.stem.py} — ${te(dm.stem.el)} ${tp(dm.stem.po)}</div>
      <div class="dm-desc">${dmDesc[dm.stem.el] || ''}</div>
    </div>
  </div>

  <div class="section-sep">${t('dm')} · Força (旺衰)</div>
  ${bar}
  <div class="strength-detail">
    <span class="strength-score" style="color:${barColor}">${pct}% · ${str.label}</span>
    <span class="muted">Método: fatores sazonais clássicos (旺相休囚死)</span>
  </div>

  <div class="section-sep" style="margin-top:20px">Estação do Nascimento</div>
  <div class="season-chip">
    ${ ['🌱 Primavera','☀️ Verão','🍂 Outono','❄️ Inverno'][r.pillars.month.season] }
    — ${r.pillars.month.termName} (${r.pillars.month.branchData.zh})
  </div>`;
}

// ─── ABA 3 — DEZ DEUSES ─────────────────────
export function renderTab3(r) {
  const p  = r.pillars;
  const dm = r.dayMaster;

  const cats = {
    peer:     { label: 'Companheiros (比劫)', color: '#8888a4' },
    output:   { label: 'Expressão (食傷)',     color: '#7dba82' },
    resource: { label: 'Recurso (印)',          color: '#5b9fc9' },
    wealth:   { label: 'Riqueza (財)',          color: '#c9a84c' },
    power:    { label: 'Poder (官殺)',          color: '#e05c4a' },
  };

  // Coleta todos os Ten Gods do mapa (troncos + hastes ocultas)
  const gods = [];
  const pillars = [
    { label: t('pY'), stemTG: p.year.tenGodStem,  hs: p.year.hiddenStems  },
    { label: t('pM'), stemTG: p.month.tenGodStem, hs: p.month.hiddenStems },
    { label: t('pD'), stemTG: null,                hs: p.day.hiddenStems   },
    { label: t('pH'), stemTG: p.hour.tenGodStem,  hs: p.hour.hiddenStems  },
  ];

  const rows = pillars.map(({ label, stemTG, hs }) => {
    const stemCell = stemTG
      ? `<span class="tg-cell" style="color:${godColor(stemTG.cat)}">${stemTG.zh} <small>${stemTG.py}</small></span>`
      : `<span class="tg-dm">日主</span>`;
    const hsCell = hs.map(h => h.tenGod
      ? `<span class="tg-hs" style="color:${godColor(h.tenGod.cat)}" title="${h.stem.zh} ${h.weight}%">${h.tenGod.zh}</span>`
      : ''
    ).join(' ');
    return `<tr><td class="tg-pillar">${label}</td><td>${stemCell}</td><td>${hsCell}</td></tr>`;
  }).join('');

  // Contagem por categoria
  const count = {};
  for (const pl of pillars) {
    if (pl.stemTG) count[pl.stemTG.cat] = (count[pl.stemTG.cat] || 0) + 2;
    for (const h of pl.hs) {
      if (h.tenGod) count[h.tenGod.cat] = (count[h.tenGod.cat] || 0) + (h.weight / 100);
    }
  }

  const summary = Object.entries(cats).map(([cat, info]) => `
    <div class="tg-cat-chip" style="border-color:${info.color}20;background:${info.color}10">
      <span style="color:${info.color}">${info.label}</span>
      <span class="tg-cat-score">${(count[cat] || 0).toFixed(1)}</span>
    </div>`).join('');

  return `
  <div class="section-sep">Mapa dos Dez Deuses</div>
  <table class="tg-table">
    <thead><tr><th>Pilar</th><th>Tronco</th><th>Hastes Ocultas</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="section-sep" style="margin-top:20px">Distribuição por Categoria</div>
  <div class="tg-cats">${summary}</div>`;
}

// ─── ABA 4 — CANG GAN ───────────────────────
export function renderTab4(r) {
  const p  = r.pillars;
  const dm = r.dayMaster;

  function hsBlock(label, branch, branchData, hs) {
    const bars = hs.map(h => {
      const c = EL_STYLE[h.stem.el] || {};
      return `
      <div class="cg-item">
        <div class="cg-char" style="color:${c.tx}">${h.stem.zh}</div>
        <div class="cg-bar-wrap">
          <div class="cg-bar" style="width:${h.weight}%;background:${c.bg};border-left:2px solid ${c.tx}"></div>
        </div>
        <div class="cg-meta">
          ${h.stem.py} · ${te(h.stem.el)} · ${h.weight}%
          ${h.tenGod ? `· <span style="color:${godColor(h.tenGod.cat)}">${h.tenGod.zh}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    return `
    <div class="cg-block">
      <div class="cg-header">
        <span class="cg-branch">${branchData.zh}</span>
        <span class="cg-label">${label} — ${branchData.py} · ${te(branchData.el)}</span>
      </div>
      ${bars}
    </div>`;
  }

  return `
  <div class="section-sep">Hastes Ocultas dos Quatro Pilares (藏干)</div>
  <div class="cg-grid">
    ${hsBlock(t('pY'), p.year.branch,  p.year.branchData,  p.year.hiddenStems)}
    ${hsBlock(t('pM'), p.month.branch, p.month.branchData, p.month.hiddenStems)}
    ${hsBlock(t('pD'), p.day.branch,   p.day.branchData,   p.day.hiddenStems)}
    ${hsBlock(t('pH'), p.hour.branch,  p.hour.branchData,  p.hour.hiddenStems)}
  </div>`;
}

// ─── ABA 5 — BALANÇO DOS 5 ELEMENTOS ────────
export function renderTab5(r) {
  const bal = r.elementBalance;
  const max = Math.max(...bal.map(e => e.pct));

  const bars = bal.map(e => {
    const c   = EL_STYLE[e.element] || {};
    const wPct = max > 0 ? (e.pct / max * 100) : 0;
    return `
    <div class="el-row">
      <div class="el-name">${badge(e.element)}</div>
      <div class="el-bar-wrap">
        <div class="el-bar" style="width:${wPct}%;background:${c.bg};border-left:3px solid ${c.tx}"></div>
      </div>
      <div class="el-pct" style="color:${c.tx}">${e.pct}%</div>
    </div>`;
  }).join('');

  // Elemento mais forte e mais fraco
  const sorted = [...bal].sort((a,b) => b.pct - a.pct);
  const strongest = sorted[0];
  const weakest   = sorted[sorted.length - 1];

  return `
  <div class="section-sep">Balanço dos 5 Elementos (五行)</div>
  <div class="el-chart">${bars}</div>

  <div class="el-summary">
    <div class="el-chip el-chip--strong">
      <span>Dominante</span>
      ${badge(strongest.element)}
      <strong>${strongest.pct}%</strong>
    </div>
    <div class="el-chip el-chip--weak">
      <span>Deficiente</span>
      ${badge(weakest.element)}
      <strong>${weakest.pct}%</strong>
    </div>
  </div>

  <div class="acc" style="margin-top:16px">
    Ponderação: Troncos recebem pesos 1–3 por posição (Dia=3, Mês/Hora=2, Ano=1).
    Hastes ocultas são calculadas com peso 0.5 × percentual da haste × fator sazonal.
  </div>`;
}

// ─── ABA 6 — INTERAÇÕES ─────────────────────
export function renderTab6(r) {
  const ix = r.branchInteractions;
  const p  = r.pillars;
  const branches = [p.year.branchData, p.month.branchData, p.day.branchData, p.hour.branchData];

  function section(title, items, renderItem) {
    if (!items.length) return '';
    return `
    <div class="section-sep">${title}</div>
    <div class="ix-list">${items.map(renderItem).join('')}</div>`;
  }

  const sevColor = { high: '#e05c4a', medium: '#c9a84c', low: '#8888a4' };

  return `
  <div class="ix-branches">
    ${branches.map(b => `<div class="ix-branch-chip">${badge(b.el)} ${b.zh} ${b.py}</div>`).join('')}
  </div>

  ${section('六冲 Seis Choques', ix.clashes, c =>
    `<div class="ix-item ix-clash">
      <span class="ix-name">${c.name}</span>
      <span class="ix-sev" style="color:${sevColor[c.severity]||'#8888a4'}">${c.severity}</span>
    </div>`)}

  ${section('六合 Seis Harmonias', ix.harmonies, h =>
    `<div class="ix-item ix-harmony">
      <span class="ix-name">${h.name}</span>
      <span class="ix-result">${badge(h.result)}</span>
    </div>`)}

  ${section('三合 Três Harmonias', ix.threeHarmonies, h =>
    `<div class="ix-item ix-three">
      <span class="ix-name">${h.name}</span>
      <span class="ix-result">${badge(h.result)}</span>
      ${!h.complete ? '<span class="ix-partial">parcial</span>' : ''}
    </div>`)}

  ${section('刑 Penalidades', ix.penalties, p =>
    `<div class="ix-item ix-penalty">
      <span class="ix-name">${p.name}</span>
      <span class="ix-type muted">${p.type}</span>
    </div>`)}

  ${section('害 Danos', ix.harms, h =>
    `<div class="ix-item ix-harm">
      <span class="ix-name">${h.name}</span>
    </div>`)}

  ${section('破 Destruições', ix.destructions, d =>
    `<div class="ix-item">
      <span class="ix-name">${d.name}</span>
    </div>`)}

  ${!ix.clashes.length && !ix.harmonies.length && !ix.penalties.length && !ix.harms.length
    ? '<div class="muted" style="padding:20px;text-align:center">Nenhuma interação entre ramos neste mapa.</div>'
    : ''}`;
}

// ─── ABA 7 — DA YUN ─────────────────────────
export function renderTab7(r) {
  const dy = r.daYun;
  const dir = dy.forward ? '⟳ Progressivo' : '⟲ Regressivo';

  const cards = dy.pillars.map(p => {
    const c = EL_STYLE[p.stemData.el] || {};
    return `
    <div class="dy-card ${p.current ? 'dy-card--current' : ''}">
      <div class="dy-age">${p.age}–${p.endAge}${p.current ? ' ★' : ''}</div>
      <div class="dy-chars" style="color:${c.tx}">${p.stemData.zh}${p.branchData.zh}</div>
      <div class="dy-py">${p.stemData.py} ${p.branchData.py}</div>
      <div style="margin:4px 0">${badge(p.stemData.el)}</div>
      ${p.tenGod ? `<div class="dy-god" style="color:${godColor(p.tenGod.cat)}">${p.tenGod.zh}</div>` : ''}
      ${p.growthPhase ? `<div class="dy-phase muted">${p.growthPhase.name}</div>` : ''}
      <div class="dy-hs">
        ${p.hiddenStems.slice(0,1).map(h =>
          `<span style="color:${(EL_STYLE[h.stem.el]||{}).tx}">${h.stem.zh}</span>`).join('')}
      </div>
    </div>`;
  }).join('');

  return `
  <div class="dy-meta">
    <span>${dir}</span>
    <span>Início: <strong>${dy.startAge} anos</strong></span>
  </div>
  <div class="dy-scroll">${cards}</div>`;
}

// ─── ABA 8 — TERMOS SOLARES ─────────────────
export function renderTab8(r) {
  const curIdx = r.solarTerms.filter(t => t.past).length - 1;
  const dots = r.solarTerms.map((td, i) => {
    const cls = i < curIdx ? 'past' : i === curIdx ? 'cur' : '';
    return `<div class="term-row ${cls}">
      <div class="term-char">${td.name}</div>
      <div class="term-date">${p2(td.date.day)}/${p2(td.date.month)}/${td.date.year}</div>
      <div class="term-py muted">${td.pinyin}</div>
      <div class="term-lon muted">${td.lon}°</div>
    </div>`;
  }).join('');

  return `
  <div class="section-sep">${tpl('terms', { '%y': r.input.year })}</div>
  <div class="terms-grid">${dots}</div>
  <div class="acc" style="margin-top:16px">${t('acc')}</div>`;
}

// ─── LOG ─────────────────────────────────────
function buildLog(r) {
  const { input: i, julianDay: jd, sunLongitude, pillars, rst } = r;
  const p = pillars;
  const L = (key, map={}) => {
    let s = tpl(key, map);
    if (s.trim().startsWith('//'))
      return `<p class="fl"><span class="hc">${s}</span></p>`;
    if (s.includes(' = '))
      return `<p class="fl"><span class="hg">${s.split(' = ')[0]}</span> = <span class="hv">${s.split(' = ').slice(1).join(' = ')}</span></p>`;
    return `<p class="fl">${s}</p>`;
  };
  return [
    L('lTitle',{  '%d':p2(i.day),'%m':p2(i.month),'%y':i.year }),
    '<br>',
    L('lSun',{    '%d':p2(i.day),'%m':p2(i.month),'%y':i.year }),
    `<p class="fl"><span class="hg">sunLon</span> = <span class="hv">${sunLongitude.toFixed(4)}°</span></p>`,
    '<br>',
    L('lJD',{     '%d':p2(i.day),'%m':p2(i.month),'%y':i.year }),
    `<p class="fl"><span class="hg">JD</span> = <span class="hv">${jd.toFixed(1)}</span></p>`,
    '<br>',
    L('lYC'),
    L('lYS',{ '%Y':p.year.baziYear,'%si':p.year.stem,'%sc':p.year.stemData.zh }),
    L('lYB',{ '%Y':p.year.baziYear,'%bi':p.year.branch,'%bc':p.year.branchData.zh }),
    '<br>',
    L('lMC',{ '%tn':p.month.termName,'%tl':p.month.termLon }),
    L('lMB',{ '%mi':p.month.termIndex,'%bi':p.month.branch,'%bc':p.month.branchData.zh }),
    L('lMS',{ '%ys':p.year.stem,'%mi':p.month.termIndex,'%si':p.month.stem,'%sc':p.month.stemData.zh }),
    '<br>',
    L('lDC'),
    L('lDF',{ '%jd':Math.round(jd),'%di':p.day.cycleIndex }),
    '<br>',
    L('lHC',{ '%rst':ft(rst.h, rst.m) }),
    L('lHB',{ '%rh':rst.h,'%bi':p.hour.branch,'%bc':p.hour.branchData.zh,'%hrs':p.hour.branchData.hr }),
    L('lHS',{ '%ds':p.day.stem,'%hi':p.hour.branch,'%si':p.hour.stem,'%sc':p.hour.stemData.zh }),
    '<br>',
    L('lRC'),
    L('lRF',{ '%ct':ft(i.hour,i.minute),'%lc':sgn(rst.lc),'%eot':sgn(rst.eot),'%dst':rst.dst,'%rst':ft(rst.h,rst.m) }),
  ].join('');
}

// ─── RENDERIZAÇÃO PRINCIPAL ──────────────────
export function renderResults(result) {
  const tabs = [
    { id: 'tab1', label: '四柱',    labelSub: 'Os Quatro Pilares' },
    { id: 'tab2', label: '日主',    labelSub: 'Mestre do Dia'     },
    { id: 'tab3', label: '十神',    labelSub: 'Dez Deuses'        },
    { id: 'tab4', label: '藏干',    labelSub: 'Hastes Ocultas'    },
    { id: 'tab5', label: '五行',    labelSub: 'Balanço Elementos' },
    { id: 'tab6', label: '地支',    labelSub: 'Interações Ramos'  },
    { id: 'tab7', label: '大運',    labelSub: 'Ciclos de Sorte'   },
    { id: 'tab8', label: '節氣',    labelSub: 'Termos Solares'    },
  ];

  const tabHeaders = tabs.map((tb, i) => `
    <button class="rtab-btn ${i === 0 ? 'rtab-btn--active' : ''}"
      data-tab="${tb.id}" role="tab" aria-selected="${i===0}"
      aria-controls="panel-${tb.id}">
      <span class="rtab-zh">${tb.label}</span>
      <span class="rtab-sub">${tb.labelSub}</span>
    </button>`).join('');

  const contents = {
    tab1: renderTab1(result),
    tab2: renderTab2(result),
    tab3: renderTab3(result),
    tab4: renderTab4(result),
    tab5: renderTab5(result),
    tab6: renderTab6(result),
    tab7: renderTab7(result),
    tab8: renderTab8(result),
  };

  const panels = tabs.map((tb, i) => `
    <div id="panel-${tb.id}" class="rtab-panel ${i === 0 ? 'rtab-panel--active' : ''}"
      role="tabpanel" aria-labelledby="${tb.id}">
      ${contents[tb.id] || ''}
    </div>`).join('');

  const logHtml = `
    <details class="log-details">
      <summary class="log-summary">Log astronômico</summary>
      <div class="log-card">${buildLog(result)}</div>
    </details>`;

  return `
  <div class="rtabs" role="tablist">
    <div class="rtab-bar">${tabHeaders}</div>
    <div class="rtab-body">${panels}</div>
  </div>
  ${logHtml}`;
}
