/**
 * render.js — Renderização dos resultados BaZi (8 abas)
 */
import { t, te, tp, tpl } from './i18n.js';

const p2  = n => String(Math.floor(n)).padStart(2, '0');
const ft  = (h, m) => `${p2(h)}:${p2(m)}`;
const sgn = n => (n >= 0 ? '+' : '') + n.toFixed(1);

const EL = {
  Wood:  { bg: 'rgba(74,124,78,.18)',   tx: '#7dba82' },
  Fire:  { bg: 'rgba(176,58,46,.18)',   tx: '#e05c4a' },
  Earth: { bg: 'rgba(139,105,20,.16)',  tx: '#c9a84c' },
  Metal: { bg: 'rgba(110,125,138,.16)', tx: '#b0bec5' },
  Water: { bg: 'rgba(36,113,163,.16)',  tx: '#5b9fc9' },
};
const GC = { peer:'#8888a4', output:'#7dba82', resource:'#5b9fc9', wealth:'#c9a84c', power:'#e05c4a' };

function badge(el) {
  const c = EL[el] || {};
  return `<span class="bdg-el" style="background:${c.bg};color:${c.tx}">${te(el)}</span>`;
}
function badgeTG(tg) {
  if (!tg) return '';
  return `<span class="bdg-tg" style="color:${GC[tg.cat]||'#888'}" title="${tg.en}">${tg.zh}</span>`;
}
function gc(cat) { return GC[cat] || '#888'; }

// ── ABA 1 — QUATRO PILARES ─────────────────
function tab1(r) {
  const p  = r.pillars;
  const dm = r.dayMaster.stemIndex;

  function col(hdr, pl, isDM) {
    const hs = pl.hiddenStems.map(h =>
      `<div class="hs-row">
        <span class="hs-zh" style="color:${(EL[h.stem.el]||{}).tx}">${h.stem.zh}</span>
        <span class="hs-w">${h.weight}%</span>
        ${h.tenGod ? `<span style="color:${gc(h.tenGod.cat)};font-size:.65rem">${h.tenGod.zh}</span>` : ''}
      </div>`
    ).join('');

    return `<div class="p-col">
      <div class="p-hdr${isDM?' p-hdr--dm':''}">${hdr}</div>
      <div class="p-stem">
        ${!isDM && pl.tenGodStem ? badgeTG(pl.tenGodStem) : ''}
        <div class="p-big">${pl.stemData.zh}</div>
        <div class="p-sm">${pl.stemData.py}</div>
        ${badge(pl.stemData.el)}
        <div class="p-po">${tp(pl.stemData.po)}</div>
        ${pl.growthPhase ? `<div class="p-phase">${pl.growthPhase.name}</div>` : ''}
      </div>
      <div class="p-branch">
        <div class="p-big">${pl.branchData.zh}</div>
        <div class="p-sm">${pl.branchData.py}</div>
        ${badge(pl.branchData.el)}
        <div class="p-po">${pl.branchData.an}</div>
      </div>
      <div class="p-hs">${hs}</div>
    </div>`;
  }

  return `
    <div class="p-grid">
      ${col(t('pH'), p.hour)}
      ${col(t('pD'), p.day, true)}
      ${col(t('pM'), p.month)}
      ${col(t('pY'), p.year)}
    </div>
    <div class="info-chips">
      <div class="chip"><span class="chip-l">${t('rstLbl')}</span>
        <span class="chip-v">${ft(r.rst.h, r.rst.m)} <span class="muted">(corr. ${sgn(r.rst.corr)} min)</span></span></div>
      <div class="chip"><span class="chip-l">${t('yr')}</span>
        <span class="chip-v">${p.year.stemData.zh}${p.year.branchData.zh} · ${p.year.baziYear} <span class="muted">${t('yrSub')}</span></span></div>
      <div class="chip"><span class="chip-l">${t('sun')}</span>
        <span class="chip-v">${r.sunLongitude.toFixed(3)}°</span></div>
    </div>`;
}

// ── ABA 2 — MESTRE DO DIA ─────────────────
function tab2(r) {
  const dm  = r.dayMaster;
  const str = dm.strength;
  const pct = str.pct;
  const col = pct >= 55 ? '#7dba82' : pct >= 42 ? '#c9a84c' : '#e05c4a';
  const lbl = { Strong: 'Forte', Neutral: 'Neutro', Weak: 'Fraco' }[str.label] || str.label;
  const seasons = ['🌱 Primavera','☀️ Verão','🍂 Outono','❄️ Inverno'];

  return `
    <div class="dm-hero">
      <div class="dm-char" style="color:${(EL[dm.stem.el]||{}).tx||'var(--gold)'}">${dm.stem.zh}</div>
      <div class="dm-info">
        <div class="dm-name">${dm.stem.py} — ${te(dm.stem.el)} ${tp(dm.stem.po)}</div>
      </div>
    </div>
    <div class="sep-label">Força (旺衰)</div>
    <div class="str-bar-wrap">
      <div class="str-track"><div class="str-fill" style="width:${pct}%;background:${col}"></div></div>
      <div class="str-labels"><span>Fraco</span><span>Neutro</span><span>Forte</span></div>
    </div>
    <div class="str-detail" style="color:${col}">${pct}% · ${lbl}</div>
    <div class="sep-label" style="margin-top:18px">Estação do Nascimento</div>
    <div class="season-chip">${seasons[r.pillars.month.season]} — ${r.pillars.month.termName}</div>`;
}

// ── ABA 3 — DEZ DEUSES ────────────────────
function tab3(r) {
  const p = r.pillars;
  const rows = [
    { lbl: t('pY'), tg: p.year.tenGodStem,  hs: p.year.hiddenStems  },
    { lbl: t('pM'), tg: p.month.tenGodStem, hs: p.month.hiddenStems },
    { lbl: t('pD'), tg: null,               hs: p.day.hiddenStems   },
    { lbl: t('pH'), tg: p.hour.tenGodStem,  hs: p.hour.hiddenStems  },
  ].map(({ lbl, tg, hs }) => {
    const trunk = tg
      ? `<span style="color:${gc(tg.cat)}">${tg.zh} <small class="muted">${tg.py}</small></span>`
      : `<span class="dm-tag">日主</span>`;
    const hidden = hs.filter(h => h.tenGod).map(h =>
      `<span class="tg-hs" style="color:${gc(h.tenGod.cat)}" title="${h.stem.zh} ${h.weight}%">${h.tenGod.zh}</span>`
    ).join('');
    return `<tr><td class="muted" style="font-size:.72rem">${lbl}</td><td>${trunk}</td><td>${hidden}</td></tr>`;
  }).join('');

  return `
    <div class="sep-label">Dez Deuses por Pilar (十神)</div>
    <table class="tg-table">
      <thead><tr><th>Pilar</th><th>Tronco</th><th>Hastes Ocultas</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── ABA 4 — HASTES OCULTAS ────────────────
function tab4(r) {
  const p = r.pillars;
  const blocks = [
    { lbl: t('pY'), pl: p.year  },
    { lbl: t('pM'), pl: p.month },
    { lbl: t('pD'), pl: p.day   },
    { lbl: t('pH'), pl: p.hour  },
  ].map(({ lbl, pl }) => {
    const bars = pl.hiddenStems.map(h => {
      const c = EL[h.stem.el] || {};
      return `<div class="cg-item">
        <span class="cg-char" style="color:${c.tx}">${h.stem.zh}</span>
        <div class="cg-bar-wrap"><div class="cg-bar" style="width:${h.weight}%;background:${c.bg};border-left:2px solid ${c.tx}"></div></div>
        <span class="cg-meta">${h.stem.py} · ${h.weight}%${h.tenGod?` · <span style="color:${gc(h.tenGod.cat)}">${h.tenGod.zh}</span>`:''}</span>
      </div>`;
    }).join('');
    return `<div class="cg-block">
      <div class="cg-hdr"><span class="p-big" style="font-size:1.8rem">${pl.branchData.zh}</span> <span class="muted">${lbl} · ${pl.branchData.py}</span></div>
      ${bars}
    </div>`;
  }).join('');

  return `<div class="sep-label">Hastes Ocultas (藏干)</div><div class="cg-grid">${blocks}</div>`;
}

// ── ABA 5 — BALANÇO ───────────────────────
function tab5(r) {
  const bal = r.elementBalance;
  const max = Math.max(...bal.map(e => e.pct));
  const bars = bal.map(e => {
    const c = EL[e.element] || {};
    return `<div class="el-row">
      <div style="width:90px">${badge(e.element)}</div>
      <div class="el-bar-wrap"><div class="el-bar" style="width:${max?e.pct/max*100:0}%;background:${c.bg};border-left:3px solid ${c.tx}"></div></div>
      <div style="width:42px;text-align:right;color:${c.tx};font-weight:700;font-size:.82rem">${e.pct}%</div>
    </div>`;
  }).join('');
  const sorted = [...bal].sort((a,b)=>b.pct-a.pct);
  return `
    <div class="sep-label">Balanço dos 5 Elementos (五行)</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin:14px 0">${bars}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px">
      <div class="chip"><span class="chip-l">Dominante</span><span class="chip-v">${badge(sorted[0].element)} ${sorted[0].pct}%</span></div>
      <div class="chip"><span class="chip-l">Deficiente</span><span class="chip-v">${badge(sorted[4].element)} ${sorted[4].pct}%</span></div>
    </div>`;
}

// ── ABA 6 — INTERAÇÕES ────────────────────
function tab6(r) {
  const ix = r.branchInteractions;
  const sc = { high:'#e05c4a', medium:'#c9a84c' };

  function sec(title, items, fn) {
    if (!items.length) return '';
    return `<div class="sep-label">${title}</div><div class="ix-list">${items.map(fn).join('')}</div>`;
  }

  const html = [
    sec('六冲 Seis Choques', ix.clashes, c =>
      `<div class="ix-item" style="border-left:3px solid ${sc[c.severity]||'#888'}">
        <span class="ix-name">${c.name}</span>
        <span style="color:${sc[c.severity]||'#888'};font-size:.7rem">${c.severity}</span>
      </div>`),
    sec('六合 Seis Harmonias', ix.harmonies, h =>
      `<div class="ix-item" style="border-left:3px solid #7dba82">
        <span class="ix-name">${h.name}</span>${badge(h.result)}
      </div>`),
    sec('三合 Três Harmonias', ix.threeHarmonies, h =>
      `<div class="ix-item" style="border-left:3px solid #5b9fc9">
        <span class="ix-name">${h.name}</span>${badge(h.result)}
        ${!h.complete?'<span class="muted" style="font-size:.65rem">parcial</span>':''}
      </div>`),
    sec('刑 Penalidades', ix.penalties, p =>
      `<div class="ix-item" style="border-left:3px solid #c9a84c">
        <span class="ix-name">${p.name}</span><span class="muted" style="font-size:.7rem">${p.type}</span>
      </div>`),
    sec('害 Danos', ix.harms, h =>
      `<div class="ix-item" style="border-left:3px solid #8888a4"><span class="ix-name">${h.name}</span></div>`),
  ].join('');

  return html || '<div class="muted" style="padding:20px;text-align:center">Nenhuma interação neste mapa.</div>';
}

// ── ABA 7 — DA YUN ────────────────────────
function tab7(r) {
  const dy = r.daYun;
  const cards = dy.pillars.map(p => {
    const c = EL[p.stemData.el] || {};
    return `<div class="dy-card${p.current?' dy-card--cur':''}">
      <div class="dy-age">${p.age}–${p.endAge}${p.current?' ★':''}</div>
      <div class="dy-chars" style="color:${c.tx}">${p.stemData.zh}${p.branchData.zh}</div>
      <div class="muted" style="font-size:.62rem">${p.stemData.py} ${p.branchData.py}</div>
      ${badge(p.stemData.el)}
      ${p.tenGod?`<div style="color:${gc(p.tenGod.cat)};font-size:.7rem;margin-top:4px">${p.tenGod.zh}</div>`:''}
      ${p.growthPhase?`<div class="muted" style="font-size:.62rem">${p.growthPhase.name}</div>`:''}
    </div>`;
  }).join('');

  return `
    <div class="muted" style="font-size:.78rem;margin-bottom:12px">
      ${dy.forward ? '⟳ Progressivo' : '⟲ Regressivo'} · Início: <strong style="color:var(--text)">${dy.startAge} anos</strong>
    </div>
    <div class="dy-scroll">${cards}</div>`;
}

// ── ABA 8 — TERMOS SOLARES ────────────────
function tab8(r) {
  const rows = r.solarTerms.map((td, i) => {
    const cls = td.past ? (i === r.solarTerms.filter(t=>t.past).length-1 ? 'cur' : 'past') : '';
    return `<div class="term-row ${cls}">
      <span class="term-zh">${td.name}</span>
      <span class="term-date">${p2(td.date.day)}/${p2(td.date.month)}</span>
      <span class="muted" style="font-size:.65rem">${td.pinyin}</span>
    </div>`;
  }).join('');
  return `<div class="sep-label">Termos Solares de ${r.input.year}</div><div class="terms-grid">${rows}</div>`;
}

// ── PRINCIPAL ─────────────────────────────
export function renderResults(r) {
  const tabs = [
    { id:'t1', zh:'四柱', sub:'Quatro Pilares',   fn: tab1 },
    { id:'t2', zh:'日主', sub:'Mestre do Dia',     fn: tab2 },
    { id:'t3', zh:'十神', sub:'Dez Deuses',        fn: tab3 },
    { id:'t4', zh:'藏干', sub:'Hastes Ocultas',    fn: tab4 },
    { id:'t5', zh:'五行', sub:'Balanço Elementos', fn: tab5 },
    { id:'t6', zh:'地支', sub:'Interações',        fn: tab6 },
    { id:'t7', zh:'大運', sub:'Ciclos de Sorte',   fn: tab7 },
    { id:'t8', zh:'節氣', sub:'Termos Solares',    fn: tab8 },
  ];

  const name = r._name ? `<div class="result-name">${r._name}</div>` : '';

  const btns = tabs.map((tb, i) =>
    `<button class="rtab${i===0?' rtab--on':''}" data-tab="${tb.id}">
      <span class="rtab-zh">${tb.zh}</span>
      <span class="rtab-sub">${tb.sub}</span>
    </button>`
  ).join('');

  const panels = tabs.map((tb, i) =>
    `<div id="${tb.id}" class="rpanel${i===0?' rpanel--on':''}">${tb.fn(r)}</div>`
  ).join('');

  return `${name}<div class="rtabs"><div class="rbar">${btns}</div><div class="rbody">${panels}</div></div>`;
}
