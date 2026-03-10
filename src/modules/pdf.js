/* ══════════════════════════════════════════════════════════════════
   BAZILAR — pdf.js  v6.1 PT-only
   SOLLUN Design System v2.0 · Quiet Luxury Digital

   LAYOUT
   ──────────────────────────────────────────────────────────────
   Página: A4 (210 × 297 mm)
   Margens: 25,4 mm (1 polegada) em todos os lados
   Área útil: 159,2 mm × 246,2 mm

   Grid: 2fr (≈103 mm) | 4 mm gap | 1fr (≈52 mm)
   Coluna direita: bloco de anotações pautado (1/3 da largura)

   Coluna de conteúdo — flex column, gap 3 mm entre seções:
     Header fixo:        15 mm
     Quatro Pilares:     62 mm  (flex: 62)
     Info Grid:          26 mm  (flex: 26)
     Balanço + Força DM: 25 mm  (flex: 25)
     Termos Solares:     20 mm  (flex: 20)
     Grandes Ciclos:     22 mm  (flex: 22)
     Estrelas + Interaç: 50 mm  (flex: 50)
     Footer fixo:         5 mm
     7 gaps × 3 mm:       21 mm
     ─────────────────────────
     Total:             246 mm ✓

   TIPOGRAFIA (SOLLUN DS v2)
   ──────────────────────────────────────────────────────────────
   PT Serif 400    → marca, títulos de seção
   Noto Sans SC    → caracteres CJK (stems, branches, termos)
   JetBrains Mono  → dados técnicos, labels, badges, coords
   ZERO bold — o peso vem da cor e do tamanho

   PALETA (light mode para impressão em papel)
   ──────────────────────────────────────────────────────────────
   --bg     #f5f2ea   off-white algodão (papel artesanal)
   --panel  #ffffff   cards
   --text   #1a1814   preto-grafite quente
   --muted  #6b6458   cinza-sépia
   --dim    #9a9488   labels
   --gold   #c9a84c   sangue do sistema (bordas, marca, acentos)
   Elementos: confinados aos pilares calculados

   ROOT CAUSE CORRIGIDO (v4 → v5 → v6)
   ──────────────────────────────────────────────────────────────
   v4: position:fixed → Chrome âncora ao viewport → PDF landscape
   v5: corrigido → mas layout não preenchia A4 e ignorava DS
   v6: grid normal + flex proporcional + DS v2.0 + 1 polegada
══════════════════════════════════════════════════════════════════ */

import { ST, EB, HIDDEN, tenGod }          from './data.js';
import { p2, ft, sgn }                     from './engine.js';
import { t, te, tp, tan, tsrc, tpl, LANG } from './i18n.js';
import { calcDayMasterStrength }            from './pillars.js';

/* ══════════════════════════════════════════════════════════════════
   PONTO DE ENTRADA
══════════════════════════════════════════════════════════════════ */

export async function exportBaziPDF(data) {
  const html = buildPrintHTML(data);
  const win  = window.open('', '_blank', 'width=920,height=680,resizable=yes,scrollbars=yes');

  if (!win) {
    const msgs = {
      pt: 'Pop-ups bloqueados. Permita pop-ups para este site e tente novamente.',
      zh: '\u5f39\u7a97\u88ab\u62e6\u622a\u3002\u8bf7\u5141\u8bb8\u672c\u7ad9\u5f39\u7a97\u540e\u91cd\u8bd5\u3002',
      es: 'Ventanas emergentes bloqueadas. Permite pop-ups para este sitio.',
      en: 'Pop-ups blocked. Allow pop-ups for this site and try again.',
    };
    alert(msgs[LANG] || msgs.en);
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  win.addEventListener('load', function () {
    const go = function () {
      win.focus();
      setTimeout(function () { win.print(); }, 400);
    };
    if (win.document.fonts && win.document.fonts.ready) {
      win.document.fonts.ready.then(go);
    } else {
      setTimeout(go, 1600);
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   UTILITÁRIOS
══════════════════════════════════════════════════════════════════ */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Paleta de elementos (SOLLUN DS — APENAS dentro de resultados) */
const ELC = {
  Wood:  { bg: '#D5EDD7', fg: '#165C1E' },  /* #7dba82 family */
  Fire:  { bg: '#FAD8D4', fg: '#A82010' },  /* #e05c4a family */
  Earth: { bg: '#F8ECC8', fg: '#6A5406' },  /* #c9a84c family */
  Metal: { bg: '#D6E4F2', fg: '#264A6C' },  /* #b0bec5 family */
  Water: { bg: '#C8DFF8', fg: '#13428A' },  /* #5b9fc9 family */
};

function elBadge(el) {
  const c = ELC[el] || { bg: '#EEE', fg: '#555' };
  return '<span class="el" style="background:' + c.bg + ';color:' + c.fg + '">'
    + esc(te(el)) + '</span>';
}

/* Rótulo de seção (JetBrains Mono, uppercase, --dim) */
function secLabel(txt) {
  return '<div class="sec-label mono">' + esc(txt) + '</div>';
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENTES HTML
══════════════════════════════════════════════════════════════════ */

/* ── CARD DE PILAR ── */
function pillarCard(hdrTxt, si, bi, dm, isDay) {
  const stem   = ST[si];
  const branch = EB[bi];
  const god    = (!isDay && dm >= 0) ? tenGod(dm, si) : null;
  const hs     = HIDDEN[bi] || [];
  const ecS    = ELC[stem.el]   || { bg: '#EEE', fg: '#444' };
  const ecB    = ELC[branch.el] || { bg: '#EEE', fg: '#444' };
  const LBLS   = ['\u4e3b', '\u4e2d', '\u4f59'];  /* 主 中 余 */

  let hsHtml = '';
  if (hs.length) {
    hsHtml = '<div class="hs-row">';
    hs.forEach(function (hsi, idx) {
      const hst = ST[hsi];
      const hc  = ELC[hst.el] || { bg: '#EEE', fg: '#444' };
      const hg  = (!isDay && dm >= 0) ? tenGod(dm, hsi) : null;
      hsHtml += '<div class="hs" style="background:' + hc.bg + ';color:' + hc.fg + '">'
        + '<span class="cjk hs-zh">' + esc(hst.zh) + '</span>'
        + '<span class="cjk hs-lbl">' + (LBLS[idx] || '') + '</span>'
        + (hg ? '<span class="hs-god">' + esc(hg.zh) + '</span>' : '')
        + '</div>';
    });
    hsHtml += '</div>';
  }

  const godHtml = god
    ? '<div class="p-god cjk">' + esc(god.zh)
        + ' <span class="p-godpy">' + esc(god.py) + '</span></div>'
    : (isDay ? '<div class="p-dm-badge">DM \u65e5\u4e3b</div>' : '');

  return '<div class="pcard' + (isDay ? ' pcard-dm' : '') + '">'
    + '<div class="pcard-hd' + (isDay ? ' pcard-hd-dm' : '') + '">'
        + esc(hdrTxt) + '</div>'
    + '<div class="p-stem" style="border-color:' + (isDay ? '#d4af37' : 'rgba(201,168,76,.18)') + '">'
      + '<div class="p-char cjk" style="color:' + ecS.fg + '">' + esc(stem.zh) + '</div>'
      + '<div class="p-meta">'
        + '<span class="p-py mono">' + esc(stem.py) + '</span>'
        + elBadge(stem.el)
        + '<span class="p-po mono">' + esc(tp(stem.po)) + '</span>'
      + '</div>'
      + godHtml
    + '</div>'
    + '<div class="p-branch">'
      + '<div class="p-bchar cjk" style="color:' + ecB.fg + '">' + esc(branch.zh) + '</div>'
      + '<div class="p-meta">'
        + '<span class="p-py mono">' + esc(branch.py) + '</span>'
        + elBadge(branch.el)
        + '<span class="p-po mono">' + esc(tan(branch.an)) + '\u00b7' + esc(tp(branch.po)) + '</span>'
      + '</div>'
      + hsHtml
    + '</div>'
  + '</div>';
}

/* ── INFO GRID (4 cards) ── */
function infoGridHtml(d, dm, rstStr, clkStr, corrStr, curTerm) {
  const dmStem = ST[dm];
  const ec     = ELC[dmStem.el] || { bg: '#EEE', fg: '#444' };
  const yZStr  = ST[d.yP.si].zh + EB[d.yP.bi].zh;

  function ic(lbl, valHtml, subHtml) {
    return '<div class="icard">'
      + '<div class="ic-lbl mono">' + esc(lbl) + '</div>'
      + '<div class="ic-val">' + valHtml + '</div>'
      + (subHtml ? '<div class="ic-sub mono">' + subHtml + '</div>' : '')
    + '</div>';
  }

  return '<div class="info-grid">'
    + ic(t('dm'),
        '<span class="cjk ic-cjk" style="color:' + ec.fg + '">' + esc(dmStem.zh) + '</span>'
          + ' <span class="mono" style="font-size:7.7pt;color:#9a9488">' + esc(dmStem.py) + '</span>',
        esc(te(dmStem.el)) + ' \u00b7 ' + esc(tp(dmStem.po)) + ' \u00b7 ' + esc(t('dmSub')))
    + ic(t('rst'),
        '<span class="mono ic-rst">' + esc(rstStr) + '</span>',
        esc(t('clk')) + ': ' + esc(clkStr) + '\u00b7' + esc(t('corr')) + ': ' + esc(corrStr))
    + ic(t('yr'),
        '<span class="cjk ic-cjk">' + esc(yZStr) + '</span>'
          + ' <span class="mono" style="font-size:7.7pt;color:#9a9488">' + d.yP.by + '</span>',
        esc(t('yrSub')))
    + ic(t('sun'),
        '<span class="mono">' + esc(d.sl.toFixed(3)) + '\u00b0</span>',
        esc(curTerm))
  + '</div>';
}

/* ── BALANÇO DOS 5 ELEMENTOS ── */
function balanceHtml(balance) {
  const ELEMS = ['Wood','Fire','Earth','Metal','Water'];
  const max   = ELEMS.reduce(function (m, e) { return Math.max(m, balance[e] || 0); }, 0) || 1;
  const rows  = ELEMS.map(function (el) {
    const v   = (balance[el] || 0).toFixed(1);
    const pct = Math.round(((balance[el] || 0) / max) * 100);
    const c   = ELC[el] || { bg: '#EEE', fg: '#444' };
    return '<div class="eb-row">'
      + '<span class="eb-name mono">' + esc(te(el)) + '</span>'
      + '<div class="eb-track"><div class="eb-fill" style="width:' + pct + '%;background:' + c.fg + '"></div></div>'
      + '<span class="eb-val mono">' + v + '</span>'
    + '</div>';
  }).join('');
  return rows;
}

/* ── FORÇA DO MESTRE DO DIA ── */
function dmStrengthHtml(dmA) {
  if (!dmA) return '';
  const pct    = Math.min(Math.abs(dmA.score) / 10 * 100, 100).toFixed(0);
  const barClr = dmA.strong ? '#165C1E' : '#13428A';
  const sign   = dmA.score >= 0 ? '+' : '';
  return '<div class="dms-hd">'
      + '<span class="dms-verdict">' + esc(t(dmA.strong ? 'dmStrong' : 'dmWeak')) + '</span>'
      + '<span class="mono dms-score">' + esc(t('dmScore')) + ': ' + sign + dmA.score + '</span>'
    + '</div>'
    + '<div class="dms-track"><div class="dms-bar" style="width:' + pct + '%;background:' + barClr + '"></div></div>'
    + '<div class="dms-row"><span class="dms-lbl mono">' + esc(t('dmFav')) + '</span>'
        + dmA.favorable.map(elBadge).join('') + '</div>'
    + '<div class="dms-row"><span class="dms-lbl mono">' + esc(t('dmUnfav')) + '</span>'
        + dmA.unfavorable.map(elBadge).join('') + '</div>';
}

/* ── TERMOS SOLARES ── */
function solarTermsHtml(tds, cti) {
  if (!tds || !tds.length) return '';
  return tds.map(function (td, idx) {
    const d   = td.date;
    const cls = idx < cti ? 'term-past' : idx === cti ? 'term-cur' : 'term-fut';
    return '<div class="term-dot ' + cls + '">'
      + '<span class="cjk term-zh">' + esc(td.n) + '</span>'
      + '<span class="mono term-dt">' + p2(d.day) + '/' + p2(d.month) + '</span>'
    + '</div>';
  }).join('');
}

/* ── GRANDES CICLOS ── */
function luckPillarsHtml(luck, dm, curYear) {
  if (!luck) return '';
  return luck.pillars.map(function (lp) {
    const s   = ST[lp.si];
    const b   = EB[lp.bi];
    const god = tenGod(dm, lp.si);
    const cur = curYear >= lp.startYear && curYear < lp.startYear + 10;
    const ec  = ELC[s.el] || { bg: '#EEE', fg: '#444' };
    return '<div class="lcard' + (cur ? ' lcard-cur' : '') + '">'
      + '<div class="mono lage">' + lp.age + '\u2013' + lp.ageEnd + '</div>'
      + '<div class="cjk lchars" style="color:' + ec.fg + '">' + esc(s.zh) + esc(b.zh) + '</div>'
      + '<div class="mono lpy">' + esc(s.py) + '</div>'
      + elBadge(s.el)
      + (god ? '<div class="cjk lgod">' + esc(god.zh) + '</div>' : '')
      + '<div class="mono lyrs">' + lp.startYear + '</div>'
    + '</div>';
  }).join('');
}

/* ── ESTRELAS SIMBÓLICAS ── */
function starsHtml(stars, allBranches) {
  if (!stars || !stars.length) return '';
  return stars.map(function (star) {
    const bd    = EB[star.branch];
    const found = allBranches.indexOf(star.branch) !== -1;
    return '<div class="star-row' + (found ? '' : ' star-abs') + '">'
      + '<span class="star-name">' + esc(t(star.name)) + '</span>'
      + '<span class="cjk star-zh">' + esc(bd.zh) + '</span>'
      + '<span class="mono star-py">' + esc(bd.py) + '</span>'
      + '<span class="star-ck">' + (found ? '\u2713' : '\u2014') + '</span>'
      + (star.source ? '<span class="mono star-src">(' + esc(tsrc(star.source)) + ')</span>' : '')
    + '</div>';
  }).join('');
}

/* ── INTERAÇÕES ENTRE RAMOS ── */
function interactionsHtml(ixs, fp) {
  if (!ixs || !ixs.length) return '';

  var PILAR_ORIGEM = {};
  if (fp) {
    PILAR_ORIGEM[fp.year.bi]  = 'ANO';
    PILAR_ORIGEM[fp.month.bi] = 'M\u00caS';
    PILAR_ORIGEM[fp.day.bi]   = 'DIA';
    PILAR_ORIGEM[fp.hour.bi]  = 'HORA';
  }

  var EL_COL = {
    'Wood':'#2E6B3E','Fire':'#A82010','Earth':'#7A5010',
    'Metal':'#4A5060','Water':'#2050A0'
  };
  var ANIMALS_PT = ['Rato','Boi','Tigre','Coelho','Drag\u00e3o','Serpente',
                    'Cavalo','Cabra','Macaco','Galo','C\u00e3o','Porco'];

  function branchCard(b) {
    var r = EB[b];
    if (!r) return '';
    var col = EL_COL[r.el] || '#555';
    var anPt = ANIMALS_PT[b] || r.an;
    var lbl = PILAR_ORIGEM[b] || '\u2014';
    return '<span class="ix-card">'
      + '<span class="ix-card__pilar">' + esc(lbl) + '</span>'
      + '<span class="ix-card__body" style="color:' + col + '">'
        + '<span class="cjk ix-card__zh">' + esc(r.zh) + '</span>'
        + '<span class="ix-card__name">' + esc(anPt) + '</span>'
      + '</span>'
    + '</span>';
  }

  return ixs.map(function (ix) {
    var ts, nt, cl, branches, sep;
    switch (ix.type) {
      case 'harmony6':
        ts = t('harmony6'); branches = [ix.a, ix.b];
        nt = '\u2192 ' + te(ix.el); cl = '#165C1E'; sep = '+'; break;
      case 'harmony3':
        ts = t('harmony3'); branches = ix.branches || [];
        nt = ix.zh || ''; cl = '#165C1E'; sep = '+'; break;
      case 'clash':
        ts = t('clash'); branches = ix.branches || [ix.a, ix.b];
        nt = '\u26a1'; cl = '#A82010'; sep = '\u2194'; break;
      case 'harm':
        ts = t('harm'); branches = ix.branches || [ix.a, ix.b];
        nt = '\u26a0'; cl = '#904010'; sep = '+'; break;
      case 'penalty':
        ts = t('penalty'); branches = ix.branches || [];
        nt = '\u25c8'; cl = '#A82010'; sep = '+'; break;
      default: return '';
    }
    var cardsHtml = branches.map(function(b, i) {
      return (i > 0 ? '<span class="ix-sep">' + sep + '</span>' : '') + branchCard(b);
    }).join('');

    return '<div class="ix-row">'
      + '<span class="mono ix-type" style="color:' + cl + '">' + esc(ts) + '</span>'
      + '<span class="ix-pair">' + cardsHtml + '</span>'
      + '<span class="mono ix-note" style="color:' + cl + '">' + esc(nt) + '</span>'
    + '</div>';
  }).join('');
}


/* ══════════════════════════════════════════════════════════════════
   CSS — SOLLUN DS v2.0 aplicado para impressão
══════════════════════════════════════════════════════════════════ */

function buildCSS() {
  return '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?'
        + 'family=PT+Serif:wght@400'
        + '&family=Noto+Sans+SC:wght@400;500'
        + '&family=JetBrains+Mono:wght@400;500'
        + '&display=swap" rel="stylesheet">'
    + '<style>'

    /* ── Reset ── */
    + '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }'
    + '*, b, strong, h1, h2, h3, h4, h5, h6 { font-weight: 400 !important; }' /* SOLLUN: sem bold */

    /* ── Tokens SOLLUN DS — light mode para papel ── */
    + ':root {'
      + '--bg: #f5f2ea;'           /* off-white algodão */
      + '--surface: #faf8f2;'
      + '--panel: #ffffff;'
      + '--panel2: #f0ede4;'
      + '--text: #1a1814;'         /* preto-grafite quente */
      + '--muted: #6b6458;'        /* cinza-sépia */
      + '--dim: #9a9488;'          /* labels */
      + '--gold: #c9a84c;'         /* sangue do sistema */
      + '--gold2: #e8c97a;'
      + '--gold-dim: #a08830;'
      + '--bg-gold: rgba(201,168,76,.10);'
      + '--bd-gold: rgba(201,168,76,.22);'
    + '}'

    /* ── @page: A4 com 1 polegada ── */
    + '@page {'
      + 'size: 210mm 297mm portrait;'  /* A4 portrait forçado */
      + 'margin: 17.5mm 17.5mm 1.75mm;'    /* topo/lados 17.5mm · inferior 1.75mm */
    + '}'
    + '@media print {'
      + 'body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }'
      + '.no-print { display: none !important; }'
    + '}'

    /* ── Base ── */
    + 'html, body { background: var(--bg); color: var(--text); }'
    + 'body { font-family: "PT Serif", Georgia, serif; font-size:11.8pt; line-height: 1.3; }'
    + '.cjk  { font-family: "Noto Sans SC", "Noto Sans CJK SC", sans-serif; }'
    + '.mono { font-family: "JetBrains Mono", "Courier New", monospace; }'

    /* ══ LAYOUT PRINCIPAL
       Área útil A4: 159,2 mm × 246,2 mm
       Grid: 2fr (≈103mm) | 4mm gap | 1fr (≈52mm)
       ZERO position:fixed/absolute                    ══ */
    + '.page-wrap {'
      + 'display: grid;'
      + 'grid-template-columns: 2fr 1fr;'
      + 'gap: 0 4mm;'
      + 'height: 277mm;'           /* 297 - 17.5 - 1.75 = 277.75mm */
      + 'overflow: hidden;'
    + '}'

    /* ── Coluna de conteúdo
       flex column, gap 3mm, altura exata para preencher a página ── */
    + '.content-col {'
      + 'height: 277mm;'
      + 'display: flex;'
      + 'flex-direction: column;'
      + 'gap: 5mm;'
      + 'padding: 3mm;'
      + 'min-width: 0;'
      + 'overflow: hidden;'
    + '}'

    /* Seções fixas */
    + '.report-hd { flex: none; height: 15mm; }'
    + '.report-ft { flex: none; height: 5mm; }'

    /* Seções variáveis — flex weights somam 205 (= mm disponíveis)
       → cada unidade = 1mm exato                               */
    + '.sec-pillars    { flex: 62; min-height: 0; overflow: hidden; }'
    + '.info-grid-sec  { flex: 26; min-height: 0; overflow: hidden; }'
    + '.balance-dm-row { flex: 25; min-height: 0; overflow: hidden; }'
    + '.sec-terms      { flex: 20; min-height: 0; overflow: hidden; }'
    + '.sec-luck       { flex: 22; min-height: 0; overflow: hidden; }'
    + '.stars-ix-row   { flex: 50; min-height: 0; overflow: hidden; }'

    /* Seções com label + conteúdo preenchem a altura */
    + '.sec-pillars, .info-grid-sec, .sec-terms, .sec-luck {'
      + 'display: flex; flex-direction: column;'
    + '}'
    + '.sec-pillars .sec-label,'
    + '.info-grid-sec .sec-label,'
    + '.sec-terms .sec-label,'
    + '.sec-luck .sec-label { flex: none; }'
    + '.sec-luck .ssub { flex: none; }'
    + '.sec-pillars .pillars-grid  { flex: 1; min-height: 0; }'
    + '.info-grid-sec .info-grid   { flex: 1; min-height: 0; }'
    + '.sec-terms .terms-grid      { flex: 1; min-height: 0; }'
    + '.sec-luck .lp-grid          { flex: 1; min-height: 0; }'

    /* Linhas de 2 colunas (balanço+força, estrelas+IX) */
    + '.balance-dm-row, .stars-ix-row {'
      + 'display: grid; grid-template-columns: 1fr 1fr; gap: 3mm;'
    + '}'
    + '.balance-dm-row .sub-sec,'
    + '.stars-ix-row .sub-sec {'
      + 'display: flex; flex-direction: column; min-height: 0; overflow: hidden;'
    + '}'
    + '.balance-dm-row .sub-sec .sec-label,'
    + '.stars-ix-row .sub-sec .sec-label { flex: none; }'
    + '.balance-dm-row .sub-sec > :last-child,'
    + '.stars-ix-row .sub-sec > :last-child {'
      + 'flex: 1; min-height: 0; overflow: hidden;'
    + '}'

    /* ══ COLUNA DE ANOTAÇÕES
       Elemento de grid normal (NUNCA position:fixed) ══ */
    + '.notes-col {'
      + 'height: 277mm;'
      + 'align-self: stretch;'
      + 'border-left: 0.4pt solid var(--bd-gold);'
      + 'background-color: var(--surface);'
      + 'background-image: repeating-linear-gradient('
          + 'to bottom,'
          + 'transparent 0mm, transparent 7.5mm,'
          + 'rgba(201,168,76,.25) 7.5mm, rgba(201,168,76,.25) 7.8mm'
      + ');'
      + '-webkit-print-color-adjust: exact;'
      + 'print-color-adjust: exact;'
      + 'padding: 3mm;'
    + '}'
    + '.notes-title {'
      + 'font-family: "JetBrains Mono", monospace;'
      + 'font-size:8.5pt; color: var(--dim);'
      + 'text-transform: uppercase; letter-spacing: .12em;'
      + 'border-bottom: 0.3pt solid var(--bd-gold);'
      + 'padding-bottom: 1mm;'
    + '}'

    /* ── Aviso de impressão (apenas tela) ── */
    + '.print-bar {'
      + 'background: var(--surface); border: 1px solid var(--bd-gold);'
      + 'border-radius: 6px; padding: 10px 14px;'
      + 'margin-bottom: 12px;'
      + 'font-family: "JetBrains Mono", monospace; font-size:16.9px;'
      + 'color: var(--muted); display: flex; align-items: center; gap: 12px;'
    + '}'
    + '.print-btn {'
      + 'padding: 6px 16px; background: var(--gold); color: #1a1814;'
      + 'border: none; border-radius: 5px; cursor: pointer;'
      + 'font-family: "JetBrains Mono", monospace;'
      + 'font-size:16.9px; letter-spacing: .08em; text-transform: uppercase;'
      + 'flex-shrink: 0;'
    + '}'
    + '.print-hint { font-size:15.2px; color: var(--dim); line-height: 1.5; }'

    /* ── Rótulo de seção (SOLLUN DS: JetBrains Mono uppercase --dim) ── */
    + '.sec-label {'
      + 'font-family: "JetBrains Mono", monospace !important;'
      + 'font-size:8.1pt; text-transform: uppercase;'
      + 'letter-spacing: .1em; color: var(--dim);'
      + 'border-bottom: 0.2pt solid var(--bg-gold);'
      + 'padding-bottom: 1mm; margin-bottom: 2mm;'
    + '}'
    + '.ssub {'
      + 'font-family: "JetBrains Mono", monospace;'
      + 'font-size:7.7pt; color: var(--dim);'
      + 'margin-bottom: 1.2mm;'
    + '}'

    /* ── Badge de elemento (confinado nos resultados) ── */
    + '.el {'
      + 'display: inline-block;'
      + 'font-family: "JetBrains Mono", monospace; font-size:7.7pt;'
      + 'padding: 0.2mm 1.2mm; border-radius: 8mm;'
      + 'line-height: 1.5; vertical-align: middle;'
    + '}'

    /* ══ CABEÇALHO ══ */
    + '.report-hd {'
      + 'display: flex; align-items: center; gap: 3mm;'
      + 'padding-bottom: 2.5mm;'
      + 'border-bottom: 0.4pt solid var(--gold);'
    + '}'

    /* Marca 八 em círculo dourado (SOLLUN DS: 32×32 circle) */
    + '.brand-ring {'
      + 'width: 10mm; height: 10mm; flex-shrink: 0;'
      + 'border: 1pt solid var(--gold); border-radius: 50%;'
      + 'display: flex; align-items: center; justify-content: center;'
      + 'font-family: "Noto Sans SC", sans-serif;'
      + 'font-size:10.1pt; color: var(--gold);'
    + '}'
    /* Nome da marca (SOLLUN DS: PT Serif, uppercase, .12em, --gold) */
    + '.brand-txt {'
      + 'font-family: "PT Serif", serif; font-size:20.3pt;'
      + 'color: var(--gold); letter-spacing: .12em; text-transform: uppercase;'
      + 'line-height: 1;'
    + '}'
    + '.brand-sub {'
      + 'font-family: "JetBrains Mono", monospace; font-size:7.7pt;'
      + 'color: var(--dim); letter-spacing: .08em; display: block;'
      + 'text-transform: uppercase; margin-top: 0.5mm;'
    + '}'
    + '.person { flex: 1; min-width: 0; }'
    /* Nome da pessoa (PT Serif, --text) */
    + '.person-name {'
      + 'font-family: "PT Serif", serif; font-size:16.9pt;'
      + 'color: var(--text); display: block; line-height: 1.1;'
    + '}'
    + '.person-meta {'
      + 'display: block; font-family: "JetBrains Mono", monospace;'
      + 'font-size:7.7pt; color: var(--muted);'
      + 'margin-top: 0.8mm; line-height: 1.55;'
    + '}'
    + '.hd-url {'
      + 'font-family: "JetBrains Mono", monospace;'
      + 'font-size:6.8pt; color: var(--gold-dim);'
      + 'align-self: flex-end; flex-shrink: 0;'
    + '}'

    /* ══ QUATRO PILARES ══ */
    + '.pillars-grid {'
      + 'display: grid; grid-template-columns: repeat(4,1fr); gap: 2.5mm;'
      + 'align-items: stretch;'
    + '}'
    + '.pcard {'
      + 'border: 0.3pt solid var(--bd-gold); border-radius: 1.5mm;'
      + 'overflow: hidden; display: flex; flex-direction: column;'
      + 'background: var(--panel);'
    + '}'
    + '.pcard-dm { border-color: var(--gold); border-width: 0.5pt; }'
    + '.pcard-hd {'
      + 'font-family: "JetBrains Mono", monospace; font-size:7.7pt;'
      + 'text-align: center; padding: 1.5mm 1mm;'
      + 'background: var(--surface); color: var(--muted);'
      + 'text-transform: uppercase; letter-spacing: .06em;'
      + 'flex: none;'
    + '}'
    + '.pcard-hd-dm { background: rgba(201,168,76,.12); color: var(--gold); }'
    + '.p-stem  {'
      + 'padding: 3mm 2mm; text-align: center;'
      + 'border-bottom: 0.4pt solid rgba(201,168,76,.18);'
      + 'flex: 1; display: flex; flex-direction: column; justify-content: center;'
    + '}'
    + '.p-branch {'
      + 'padding: 3mm 2mm; text-align: center;'
      + 'flex: 1; display: flex; flex-direction: column; justify-content: center;'
    + '}'
    + '.p-char  { font-size:30.4pt; line-height: 1.0; margin-bottom: 0.8mm; }'
    + '.p-bchar { font-size:22pt; line-height: 1.0; margin-bottom: 0.6mm; }'
    + '.p-meta {'
      + 'display: flex; flex-wrap: wrap; justify-content: center;'
      + 'align-items: center; gap: 0.5mm;'
    + '}'
    + '.p-py  { font-size:6.8pt; color: var(--muted); }'
    + '.p-po  { font-size:6.8pt; color: var(--dim); }'
    + '.p-god {'
      + 'font-size:9.4pt; color: var(--gold);'
      + 'background: rgba(201,168,76,.10); border-radius: 0.8mm;'
      + 'padding: 0.2mm 0.8mm; margin-top: 0.6mm;'
      + 'display: inline-block;'
    + '}'
    + '.p-godpy { font-family: "JetBrains Mono", monospace; font-size:5.9pt; color: var(--dim); }'
    + '.p-dm-badge {'
      + 'font-family: "JetBrains Mono", monospace; font-size:6.8pt;'
      + 'color: var(--gold); background: rgba(201,168,76,.12);'
      + 'border-radius: 0.8mm; padding: 0.2mm 0.8mm; margin-top: 0.6mm;'
      + 'display: inline-block;'
    + '}'
    + '.hs-row {'
      + 'border-top: 0.2pt dashed rgba(201,168,76,.20);'
      + 'padding-top: 0.8mm; margin-top: 0.8mm;'
      + 'display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5mm;'
    + '}'
    + '.hs { font-size:10.1pt; padding: 0.2mm 0.8mm; border-radius: 0.7mm; display: inline-flex; align-items: baseline; gap: 0.3mm; }'
    + '.hs-zh  { font-size:11.1pt; }'
    + '.hs-lbl { font-size:6.4pt; opacity: 0.6; }'
    + '.hs-god { font-size:6.4pt; opacity: 0.75; font-family: "JetBrains Mono", monospace; }'

    /* ══ INFO GRID ══ */
    + '.info-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2.5mm; align-items: stretch; }'
    + '.icard {'
      + 'border: 0.25pt solid var(--bd-gold); border-radius: 1.5mm;'
      + 'padding: 3mm 2.5mm; background: var(--surface);'
      + 'display: flex; flex-direction: column; justify-content: center;'
    + '}'
    + '.ic-lbl { font-family: "JetBrains Mono", monospace; font-size:6.8pt; color: var(--dim); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 0.8mm; }'
    + '.ic-val { font-size:12.7pt; color: var(--text); line-height: 1.2; }'
    + '.ic-cjk { font-size:16.9pt; }'
    + '.ic-rst { font-size:15.2pt; }'
    + '.ic-sub { font-size:6.8pt; color: var(--muted); margin-top: 0.4mm; line-height: 1.4; }'

    /* ══ BALANÇO DOS ELEMENTOS ══ */
    + '.eb-wrap { display: flex; flex-direction: column; justify-content: space-evenly; height: 100%; }'
    + '.eb-row  { display: flex; align-items: center; gap: 1.2mm; }'
    + '.eb-name { font-size:7.7pt; color: var(--muted); min-width: 12mm; }'
    + '.eb-track { flex: 1; height: 1.6mm; background: var(--panel2); border-radius: 1mm; overflow: hidden; }'
    + '.eb-fill  { height: 100%; border-radius: 1mm; }'
    + '.eb-val   { font-size:7.7pt; color: var(--dim); min-width: 5mm; text-align: right; }'

    /* ══ FORÇA DO MESTRE DO DIA ══ */
    + '.dms-inner { display: flex; flex-direction: column; justify-content: space-evenly; height: 100%; padding: 2mm; border: 0.25pt solid var(--bd-gold); border-radius: 1.5mm; background: var(--surface); }'
    + '.dms-hd    { display: flex; justify-content: space-between; align-items: baseline; }'
    + '.dms-verdict { font-size:11.1pt; color: var(--text); }'
    + '.dms-score   { font-size:7.7pt; color: var(--dim); }'
    + '.dms-track   { height: 1.6mm; background: var(--panel2); border-radius: 1mm; overflow: hidden; }'
    + '.dms-bar     { height: 100%; border-radius: 1mm; }'
    + '.dms-row     { display: flex; align-items: center; gap: 1mm; flex-wrap: wrap; }'
    + '.dms-lbl     { font-size:6.8pt; color: var(--dim); min-width: 24mm; }'

    /* ══ TERMOS SOLARES ══ */
    + '.terms-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 0.8mm; align-content: space-evenly; height: 100%; }'
    + '.term-dot   { text-align: center; padding: 1.8mm 0.8mm; border-radius: 0.8mm; background: var(--surface); }'
    + '.term-zh    { display: block; font-size:10.1pt; color: var(--text); }'
    + '.term-dt    { display: block; font-size:6.4pt; color: var(--dim); }'
    + '.term-cur   { background: var(--gold) !important; }'
    + '.term-cur .term-zh, .term-cur .term-dt { color: #1a1814 !important; }'
    + '.term-past  { background: transparent; }'
    + '.term-past .term-zh, .term-past .term-dt { color: var(--dim); }'
    + '.term-fut   { background: var(--surface); }'

    /* ══ GRANDES CICLOS ══ */
    + '.lp-grid { display: grid; grid-template-columns: repeat(8,1fr); gap: 0.8mm; align-items: stretch; }'
    + '.lcard {'
      + 'border: 0.25pt solid var(--bd-gold); border-radius: 1.2mm;'
      + 'padding: 2mm 1mm; text-align: center;'
      + 'background: var(--surface);'
      + 'display: flex; flex-direction: column; justify-content: space-evenly;'
    + '}'
    + '.lcard-cur { border-color: var(--gold); border-width: 0.5pt; background: rgba(201,168,76,.08); }'
    + '.lage  { font-size:6.4pt; color: var(--dim); }'
    + '.lchars { font-size:15.2pt; line-height: 1.05; }'
    + '.lpy   { font-size:5.9pt; color: var(--dim); }'
    + '.lgod  { font-size:7.7pt; color: var(--gold); }'
    + '.lyrs  { font-size:5.9pt; color: var(--dim); }'

    /* ══ ESTRELAS ══ */
    + '.stars-inner { display: flex; flex-direction: column; justify-content: space-evenly; height: 100%; }'
    + '.star-row {'
      + 'display: flex; align-items: center; gap: 1.2mm;'
      + 'font-size:8.5pt; padding: 1.8mm 2mm;'
      + 'border-radius: 0.8mm; background: var(--surface);'
    + '}'
    + '.star-abs   { opacity: 0.4; }'
    + '.star-name  { flex: 1; color: var(--text); font-size:8.1pt; }'
    + '.star-zh    { font-size:12.7pt; color: var(--text); }'
    + '.star-py    { font-size:6.4pt; color: var(--dim); }'
    + '.star-ck    { font-size:9.4pt; color: #165C1E; min-width: 3mm; text-align: center; }'
    + '.star-src   { font-size:6.4pt; color: var(--dim); }'

    /* ══ INTERAÇÕES ══ */
    + '.ix-inner { display: flex; flex-direction: column; justify-content: space-evenly; height: 100%; }'
    + '.ix-row { display: flex; align-items: center; gap: 2mm; padding: 1.5mm 2mm; border-radius: 0.8mm; border: 0.2pt solid rgba(201,168,76,.15); }'
    + '.ix-type { font-size:7pt; min-width: 14mm; flex-shrink:0; }'
    + '.ix-pair { display: flex; align-items: center; flex-wrap: wrap; gap: 1.5mm; flex: 1; }'
    + '.ix-sep { font-size:8pt; color: var(--muted); padding: 0 0.5mm; }'
    + '.ix-note { font-size:9pt; flex-shrink:0; }'
    + '.ix-card { display: inline-flex; flex-direction: column; align-items: center; background: var(--surface); border: 0.3pt solid rgba(201,168,76,.25); border-radius: 1mm; padding: 1mm 2mm; min-width: 10mm; }'
    + '.ix-card__pilar { font-family: "JetBrains Mono", monospace; font-size:5.5pt; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); }'
    + '.ix-card__body { display:flex; align-items:baseline; gap:1mm; }'
    + '.ix-card__zh { font-size:11pt; line-height:1; }'
    + '.ix-card__name { font-size:7pt; }'

    /* ══ RODAPÉ ══ */
    + '.report-ft {'
      + 'display: flex; justify-content: space-between; align-items: center;'
      + 'padding-top: 1mm;'
      + 'border-top: 0.2pt solid var(--bg-gold);'
      + 'font-family: "JetBrains Mono", monospace;'
      + 'font-size:6.8pt; color: var(--dim);'
      + 'letter-spacing: .06em;'
    + '}'

    + '</style>';
}

/* ══════════════════════════════════════════════════════════════════
   MONTAGEM DO HTML
══════════════════════════════════════════════════════════════════ */

function buildPrintHTML(data) {
  const d  = data;
  const i  = d.i;
  const dm = d.dm;

  /* Recalcula força do Mestre do Dia */
  const stems     = [d.hP.si, d.dP.si, d.mP.si, d.yP.si];
  const branchIdx = [d.hP.bi, d.dP.bi, d.mP.bi, d.yP.bi];
  const dmA = calcDayMasterStrength(dm, stems, branchIdx, 2);

  /* Strings auxiliares */
  const dateFmt  = p2(i.d) + '/' + p2(i.m) + '/' + i.y;
  const gStr     = i.gender === 'M' ? '\u2642 ' + t('gM') : i.gender === 'F' ? '\u2640 ' + t('gF') : '';
  const rstStr   = ft(d.rst.h, d.rst.m, d.rst.s);
  const clkStr   = ft(i.hh || 0, i.mm || 0, 0);
  const corrStr  = sgn(d.rst.corr) + ' min';
  const coordStr = (i.la != null && i.lo != null)
    ? i.la.toFixed(2) + '\u00b0 ' + i.lo.toFixed(2) + '\u00b0' : '';
  const tzStr    = 'GMT ' + (i.tz >= 0 ? '+' : '') + i.tz + (i.dst ? ' DST' : '');
  const curTerm  = (d.tds && d.tds[d.cti]) ? d.tds[d.cti].n : '';
  const curYear  = new Date().getFullYear();
  const genDate  = new Date().toLocaleDateString('pt-BR',
    { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* Nome para exibição */
  const NAMES = { pt: 'Mapa BaZi', zh: '\u547d\u76d8', es: 'Carta BaZi', en: 'BaZi Chart' };
  const nameDisplay = i.name ? esc(i.name) : (NAMES[LANG] || NAMES.pt);

  /* Header do pilar: pega só a parte antes do · */
  function hdr(key) { return (t(key) || key).split('\u00b7')[0].trim(); }

  /* Localização do botão de impressão */
  const PL = {
    pt: ['\ud83d\udda8\ufe0f Imprimir / Salvar PDF',
         'Papel: A4 \u00b7 Retrato \u00b7 Margens: Nenhuma \u00b7 Escala: 100% \u00b7 \u2611 Gr\u00e1ficos de segundo plano'],
    zh: ['\ud83d\udda8\ufe0f \u6253\u5370 / \u4fdd\u5b58PDF',
         '\u7eb8\u5f20: A4 \u00b7 \u7ad6\u5411 \u00b7 \u9875\u8fb9\u8ddd: \u65e0 \u00b7 \u7f29\u653e: 100% \u00b7 \u2611 \u80cc\u666f\u56fe\u5f62'],
    es: ['\ud83d\udda8\ufe0f Imprimir / Guardar PDF',
         'Papel: A4 \u00b7 Vertical \u00b7 M\u00e1rgenes: Ninguno \u00b7 Escala: 100% \u00b7 \u2611 Gr\u00e1ficos de fondo'],
    en: ['\ud83d\udda8\ufe0f Print / Save PDF',
         'Paper: A4 \u00b7 Portrait \u00b7 Margins: None \u00b7 Scale: 100% \u00b7 \u2611 Background graphics'],
  };
  const pl = PL[LANG] || PL.pt;

  /* Termos solares com título */
  const termsTitle = typeof tpl === 'function'
    ? tpl('terms', { '%y': i.y })
    : (t('terms') || '').replace('%y', i.y);

  /* Luck direction/age */
  let luckDir = '';
  let luckAge = '';
  if (d.luck) {
    luckDir = d.luck.forward ? t('luckFwd') : t('luckBwd');
    luckAge = t('luckStart') + ': ' + d.luck.startAge
      + (d.luck.startMonths > 0 ? ' + ' + d.luck.startMonths + 'm' : '');
  }

  /* Subtítulo da marca */
  const secPilSub = (t('secPil') || '').split('\u2014').pop().trim();

  return '<!DOCTYPE html>\n'
    + '<html lang="' + esc(LANG || 'pt') + '">\n'
    + '<head>\n'
    + '<meta charset="UTF-8">\n'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    + '<title>BAZILAR \u2014 ' + nameDisplay + '</title>\n'
    + buildCSS()
    + '\n</head>\n<body>\n'

    /* ── Aviso antes de imprimir (tela only) ── */
    + '<div class="print-bar no-print">'
      + '<button class="print-btn" onclick="window.print()">' + pl[0] + '</button>'
      + '<span class="print-hint">' + pl[1] + '</span>'
    + '</div>\n'

    /* ══ GRID PRINCIPAL ══ */
    + '<div class="page-wrap">\n'

    /* ─────────── COLUNA DE CONTEÚDO ─────────── */
    + '<div class="content-col">\n'

    /* CABEÇALHO */
    + '<header class="report-hd">'
      + '<div class="brand-ring">\u516b</div>'
      + '<div>'
        + '<div class="brand-txt">BAZILAR</div>'
        + '<span class="brand-sub">\u516b\u5b57 \u00b7 BaZi \u00b7 ' + esc(secPilSub) + '</span>'
      + '</div>'
      + '<div class="person">'
        + '<span class="person-name">' + nameDisplay + '</span>'
        + '<span class="person-meta">'
            + esc(dateFmt) + (gStr ? ' \u00b7 ' + esc(gStr) : '')
            + (i.city ? '<br>' + esc(i.city) : '')
            + (coordStr ? ' \u00b7 ' + esc(coordStr) : '')
            + (tzStr ? ' \u00b7 ' + esc(tzStr) : '')
        + '</span>'
      + '</div>'
      + '<div class="hd-url">bazilar.sollun.app</div>'
    + '</header>\n'

    /* QUATRO PILARES */
    + '<section class="sec-pillars">'
      + secLabel(t('secPil'))
      + '<div class="pillars-grid">'
        + pillarCard(hdr('pH'), d.hP.si, d.hP.bi, dm, false)
        + pillarCard(hdr('pD'), d.dP.si, d.dP.bi, dm, true)
        + pillarCard(hdr('pM'), d.mP.si, d.mP.bi, dm, false)
        + pillarCard(hdr('pY'), d.yP.si, d.yP.bi, dm, false)
      + '</div>'
    + '</section>\n'

    /* INFO GRID */
    + '<section class="info-grid-sec">'
      + secLabel(t('dm') + ' \u00b7 ' + t('rst') + ' \u00b7 ' + t('yr') + ' \u00b7 ' + t('sun'))
      + infoGridHtml(d, dm, rstStr, clkStr, corrStr, curTerm)
    + '</section>\n'

    /* BALANÇO + FORÇA DM */
    + '<div class="balance-dm-row">'
      + '<div class="sub-sec">'
        + secLabel(t('secElem'))
        + '<div class="eb-wrap">' + balanceHtml(d.balance) + '</div>'
      + '</div>'
      + '<div class="sub-sec">'
        + secLabel(t('secStrength'))
        + '<div class="dms-inner">' + dmStrengthHtml(dmA) + '</div>'
      + '</div>'
    + '</div>\n'

    /* TERMOS SOLARES */
    + '<section class="sec-terms">'
      + secLabel(esc(termsTitle))
      + '<div class="terms-grid">' + solarTermsHtml(d.tds, d.cti) + '</div>'
    + '</section>\n'

    /* GRANDES CICLOS */
    + '<section class="sec-luck">'
      + secLabel(t('secLuck'))
      + '<div class="ssub">' + esc(luckDir) + (luckDir && luckAge ? ' \u00b7 ' : '') + esc(luckAge) + '</div>'
      + '<div class="lp-grid">' + luckPillarsHtml(d.luck, dm, curYear) + '</div>'
    + '</section>\n'

    /* ESTRELAS + INTERAÇÕES */
    + '<div class="stars-ix-row">'
      + '<div class="sub-sec">'
        + secLabel(t('secStars'))
        + '<div class="stars-inner">' + starsHtml(d.stars, d.allBranches) + '</div>'
      + '</div>'
      + '<div class="sub-sec">'
        + secLabel(t('secInteract'))
        + '<div class="ix-inner">' + interactionsHtml(d.interactions, d.hP && d.dP && d.mP && d.yP ? {hour:d.hP,day:d.dP,month:d.mP,year:d.yP} : null) + '</div>'
      + '</div>'
    + '</div>\n'

    /* RODAPÉ — SOLLUN DS: "feito com tempo" */
    + '<footer class="report-ft">'
      + '<span>BAZILAR \u00b7 bazilar.sollun.app</span>'
      + '<span>' + esc(t('acc').split('.').slice(0,2).join('.') + '.') + '</span>'
      + '<span class="mono">feito com tempo \u00b7 ' + esc(genDate) + '</span>'
    + '</footer>\n'

    + '</div>\n'  /* /.content-col */

    /* ─────────── COLUNA DE ANOTAÇÕES ─────────── */
    + '<aside class="notes-col">'
      + '<div class="notes-title mono">Anota\u00e7\u00f5es</div>'
    + '</aside>\n'

    + '</div>\n'  /* /.page-wrap */
    + '</body>\n</html>';
}
