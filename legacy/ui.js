/**
 * @deprecated Módulo legado — não importado pela aplicação ativa.
 * Mantido para referência histórica. Remoção prevista em S4.
 * Não editar. Consultar src/renderer.js (renderer) e src/app.js (controller).
 */
/* ══════════════════════════════════════════════════
   BAZILAR — ui.js — Controlador UI, eventos, cálculo
   PT-only · v3.2
══════════════════════════════════════════════════ */

import { ST, EB, MT } from './data.js';
import { toJD, fromJD, sunLon, termJD, calcRST, p2, ft, sgn } from './engine.js';
import { yearPil, monthPil, dayPil, hourPil, calcLuckPillars, findStars, findInteractions, elemBalance, calcDayMasterStrength } from './pillars.js';
import { t, te, tp, tpl } from './i18n.js';
import { geoDebounce, hideSug, escH, initGeo } from './geo.js';
import { pilCard, renderElemBalance, renderLuckPillars, renderStars, renderInteractions, buildLog, renderDayMasterStrength } from './render.js';
import { exportBaziPDF } from './pdf.js';

/* ═══════ ESTADO DO MÓDULO ═══════ */
let GENDER = '';
let ZI_METHOD = 'early';
let HEMI = 'N';
let dark = true;
let _lastCalcData = null;

/* ═══════ TEMA CLARO / ESCURO ═══════ */
document.getElementById('themeBtn').addEventListener('click', function(){
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark?'dark':'light');
  document.getElementById('themeIcon').textContent = dark?'☀️':'🌙';
});

/* ═══════ BOTÕES DE GÊNERO ═══════ */
document.querySelectorAll('.gender-btn').forEach(function(btn){
  btn.addEventListener('click',function(){
    document.querySelectorAll('.gender-btn').forEach(function(b){b.classList.remove('active');});
    this.classList.add('active');
    GENDER = this.dataset.gender;
  });
});

/* ═══════ SELETOR ZI ═══════ */
document.getElementById('ziToggle').addEventListener('click',function(){
  document.getElementById('ziSelector').classList.toggle('open');
});
/* Método Zǐ — apenas .zi-opt[data-zi] */
document.querySelectorAll('.zi-opt[data-zi]').forEach(function(opt){
  opt.addEventListener('click',function(){
    document.querySelectorAll('.zi-opt[data-zi]').forEach(function(o){o.classList.remove('active');});
    this.classList.add('active');
    ZI_METHOD = this.dataset.zi;
  });
});
/* Hemisfério — apenas .zi-opt[data-hemi] */
document.querySelectorAll('.zi-opt[data-hemi]').forEach(function(opt){
  opt.addEventListener('click',function(){
    document.querySelectorAll('.zi-opt[data-hemi]').forEach(function(o){o.classList.remove('active');});
    this.classList.add('active');
    HEMI = this.dataset.hemi;
  });
});

/* ═══════ TSR EM TEMPO REAL ═══════ */
function getI() {
  const tv = (document.getElementById('inT').value||'00:00').split(':');
  return {
    name: (document.getElementById('inName').value||'').trim(),
    y:parseInt(document.getElementById('inY').value)||0,
    m:parseInt(document.getElementById('inM').value)||0,
    d:parseInt(document.getElementById('inD').value)||0,
    hh:parseInt(tv[0])||0, mm:parseInt(tv[1])||0,
    lo:parseFloat(document.getElementById('inLo').value)||0,
    la:parseFloat(document.getElementById('inLa').value)||0,
    tz:parseFloat(document.getElementById('inTZ').value)||0,
    dst:document.getElementById('inDST').checked,
    city:(document.getElementById('inCity').value||'').trim(),
    gender:GENDER,
  };
}

function updateRST() {
  const i = getI();
  if (!i.y || !i.m || !i.d) return;
  const r = calcRST(i.y,i.m,i.d,i.hh,i.mm,i.lo,i.tz,i.dst);
  document.getElementById('rstBox').style.display = 'block';
  document.getElementById('rstV').textContent = ft(r.h,r.m,r.s);
  document.getElementById('rstD').innerHTML =
    t('clk')+': '+ft(i.hh,i.mm,0)+' | '+t('corr')+': '+sgn(r.corr)+' min<br>'
    +'Lon: '+sgn(r.lc)+' min  EoT: '+sgn(r.e)+' min  DST: '+r.dc+' min';
}

function updateLocPrev() {
  const c=(document.getElementById('inCity').value||'').trim();
  const lo=parseFloat(document.getElementById('inLo').value);
  const la=parseFloat(document.getElementById('inLa').value);
  const pr=document.getElementById('locPrev');
  if(pr) pr.textContent = (c&&!isNaN(lo)&&!isNaN(la)) ? c+' ('+la.toFixed(2)+', '+lo.toFixed(2)+')' : '';
}

/* Registra callback que geo.js chama após selecionar localização */
initGeo(function(){ updateLocPrev(); updateRST(); });

/* ═══════ CÁLCULO PRINCIPAL ═══════ */
function runCalc() {
  const i = getI();

  /* Validação de campos obrigatórios */
  if (!i.y || i.m<1 || i.m>12 || i.d<1 || i.d>31) {
    document.getElementById('results').innerHTML = '<div class="err">'+t('errFill')+'</div>';
    return;
  }
  if (!i.gender) {
    document.getElementById('results').innerHTML = '<div class="err">'+t('errGender')+'</div>';
    return;
  }

  const jd = toJD(i.y, i.m, i.d, 12);
  const rst = calcRST(i.y, i.m, i.d, i.hh, i.mm, i.lo, i.tz, i.dst);
  const rstH = rst.h + rst.m/60 + rst.s/3600;
  const isZiHour = (rstH>=23 || rstH<1);

  /* Early vs Late Zǐ: afeta o tronco do dia para 23:00–23:59 */
  let dayJD = jd;
  if (rstH >= 23 && ZI_METHOD === 'early') dayJD = jd + 1;

  const exactJD = toJD(i.y, i.m, i.d, rstH);
  const yP=yearPil(jd), mP=monthPil(exactJD, HEMI==='S'), dP=dayPil(dayJD), hP=hourPil(rstH,dP.si);
  const dm=dP.si, sl=sunLon(jd);

  /* Termos Solares do ano */
  const tds = MT.map(function(mt,idx){
    const tj=termJD(mt.l,i.y), td=fromJD(tj);
    return {n:mt.n, jd:tj, date:td, past:jd>=tj, idx:idx};
  });
  const cti = tds.filter(function(x){return x.past;}).length - 1;

  const stems = [hP.si, dP.si, mP.si, yP.si];
  const branchIdxs = [hP.bi, dP.bi, mP.bi, yP.bi];
  const balance = elemBalance(stems, branchIdxs);
  const luck = calcLuckPillars(jd, yP.si, mP.si, mP.bi, i.gender, i.y);
  const dmAnalysis = calcDayMasterStrength(dm, stems, branchIdxs, 2);
  const currentYear = new Date().getFullYear();
  const stars = findStars(yP.bi, dP.bi, yP.si, dP.si);
  const allBranches = [hP.bi, dP.bi, mP.bi, yP.bi];
  const interactions = findInteractions(allBranches);

  const lp = {
    y:i.y,m:i.m,d:i.d,by:yP.by,jd:jd,sunL:sl,
    ys:yP.si,yb:yP.bi,ms:mP.si,mb:mP.bi,mi:mP.mi,
    ds:dP.si,db:dP.bi,di:dP.idx,hs:hP.si,hb:hP.bi,
    ch:i.hh,cm:i.mm,rst:rst,
  };

  const locStr = i.city ? (i.city+' ('+i.la.toFixed(2)+', '+i.lo.toFixed(2)+')') : '';
  const termTtl = tpl('terms',{'%y':i.y});

  /* Aviso hora Zǐ */
  let ziHtml = '';
  if (isZiHour) {
    const mName = ZI_METHOD==='early' ? '早子時 Early Zǐ' : '晚子時 Late Zǐ';
    ziHtml = '<div class="zi-notice">'+tpl('ziNotice',{'%method':mName})+'</div>';
  }

  /* Aviso Hemisfério Sul */
  const hemiHtml = HEMI === 'S'
    ? '<div class="zi-notice hemi-notice">🌏 '+t('hemiNotice')+'</div>'
    : '';

  /* Saudação com nome */
  let nameHtml = '';
  if (i.name) {
    nameHtml = '<div class="name-greet"><span class="name-label">'+t('greet')+'</span> <span class="name-val">'+escH(i.name)+'</span></div>';
  }

  /* ── MONTAGEM DOS RESULTADOS ── */
  const out = nameHtml + ziHtml + hemiHtml
    + '<p class="sec-label">'+t('secPil')+'</p>'
    + '<div class="pillars-grid">'
      + pilCard(t('pH'),hP.si,hP.bi,dm,false)
      + pilCard(t('pD'),dP.si,dP.bi,dm,true)
      + pilCard(t('pM'),mP.si,mP.bi,dm,false)
      + pilCard(t('pY'),yP.si,yP.bi,dm,false)
    + '</div>'
    + '<div class="info-grid">'
      + '<div class="info-card"><p class="ic-title">'+t('dm')+'</p><p class="ic-val">'+ST[dm].zh+' '+ST[dm].py+' — '+te(ST[dm].el)+' '+tp(ST[dm].po)+'</p><p class="ic-sub">'+t('dmSub')+'</p></div>'
      + '<div class="info-card"><p class="ic-title">'+t('rst')+'</p><p class="ic-val" style="font-family:\'JetBrains Mono\',monospace">'+ft(rst.h,rst.m,rst.s)+'</p><p class="ic-sub">'+t('clk')+': '+ft(i.hh,i.mm,0)+' · '+t('corr')+': '+sgn(rst.corr)+' min</p></div>'
      + '<div class="info-card"><p class="ic-title">'+t('yr')+'</p><p class="ic-val">'+ST[yP.si].zh+EB[yP.bi].zh+' · '+yP.by+'</p><p class="ic-sub">'+t('yrSub')+'</p></div>'
      + '<div class="info-card"><p class="ic-title">'+t('sun')+'</p><p class="ic-val" style="font-family:\'JetBrains Mono\',monospace">'+sl.toFixed(3)+'°</p><p class="ic-sub">'+locStr+'</p></div>'
    + '</div>'
    + renderElemBalance(balance)
    + renderDayMasterStrength(dmAnalysis, dm)
    + (function(){
        const rows=['',''];
        tds.forEach(function(td,idx){
          const c=idx<cti?'past':idx===cti?'cur':'';
          const d=td.date;
          const dot='<span class="term-dot '+c+'" role="listitem">'+td.n+' '+p2(d.day)+'/'+p2(d.month)+'</span>';
          rows[idx<6?0:1]+=dot;
        });
        return '<div class="term-bar">'
          +'<p class="term-ttl">'+termTtl+'</p>'
          +'<div class="term-row" role="list">'+rows[0]+'</div>'
          +'<div class="term-row" role="list">'+rows[1]+'</div>'
          +'</div>';
      })()
    + renderLuckPillars(luck, dm, currentYear)
    + renderStars(stars, allBranches)
    + renderInteractions(interactions)
    + '<div class="toggle-hd" id="logToggle" role="button" aria-expanded="false">'
      + '<span class="toggle-arrow">▶</span>'
      + '<p class="sec-label" style="border:none;margin:0;padding:0">'+t('secLog')+'</p>'
    + '</div>'
    + '<div class="toggle-body" id="logBody"><div class="log-card">'+buildLog(lp)+'</div></div>'
    + '<div class="acc">'+t('acc')+'</div>';

  /* ── Botão PDF ── */
  const pdfBtnHtml =
    '<button class="pdf-export-btn" id="pdfExportBtn" type="button">'
    + '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 1z"/><polyline points="9 1 9 6 14 6"/>'
    + '<line x1="5" y1="10" x2="11" y2="10"/><line x1="5" y1="13" x2="8" y2="13"/>'
    + '</svg>'
    + '<span id="uiPdfBtnLabel">'+t('pdfExport')+'</span>'
    + '</button>';

  document.getElementById('results').innerHTML = out + pdfBtnHtml;

  /* Guarda dados para PDF */
  _lastCalcData = {
    i: i,
    hP: hP, dP: dP, mP: mP, yP: yP,
    dm: dm, sl: sl, rst: rst,
    balance: balance, luck: luck, stars: stars,
    allBranches: allBranches, interactions: interactions,
    tds: tds, cti: cti,
  };

  /* Toggle de log */
  const logToggle = document.getElementById('logToggle');
  if (logToggle) {
    logToggle.addEventListener('click', function() {
      const open = document.getElementById('logBody').classList.toggle('open');
      this.setAttribute('aria-expanded', String(open));
    });
  }

  /* Exportação PDF */
  const pdfBtn = document.getElementById('pdfExportBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', function() {
      if (!_lastCalcData) return;
      const btn = this, lbl = document.getElementById('uiPdfBtnLabel');
      btn.disabled = true;
      if (lbl) lbl.textContent = '…';
      exportBaziPDF(_lastCalcData).finally(function() {
        btn.disabled = false;
        if (lbl) lbl.textContent = t('pdfExport');
      });
    });
  }
}

/* ════════════════════════════════════════════════
   SMART INPUT — avanço automático, máscara de hora
════════════════════════════════════════════════ */

function focusNext(id) {
  const el = document.getElementById(id);
  if (el) { el.focus(); if (el.select) el.select(); }
}
function setValid(el, ok) {
  el.classList.toggle('input-ok',  !!ok);
  el.classList.toggle('input-err', !ok && el.value !== '');
}
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

/* DIA: 01–31 */
(function() {
  const el = document.getElementById('inD');
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });
  el.addEventListener('input', function() {
    const raw = this.value.replace(/\D/g,'');
    if (!raw) { this.value=''; setValid(this,false); return; }
    let n = parseInt(raw,10);
    if (raw.length >= 2 || n > 3) {
      n = clamp(n,1,31); this.value = String(n).padStart(2,'0');
      setValid(this,true); focusNext('inM');
    } else { this.value = raw; setValid(this,false); }
    updateRST();
  });
  el.addEventListener('blur', function() {
    const n = parseInt(this.value,10);
    if (!isNaN(n) && n >= 1) { this.value=String(clamp(n,1,31)).padStart(2,'0'); setValid(this,true); }
    else setValid(this,false);
    updateRST();
  });
})();

/* MÊS: 01–12 */
(function() {
  const el = document.getElementById('inM');
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });
  el.addEventListener('input', function() {
    const raw = this.value.replace(/\D/g,'');
    if (!raw) { this.value=''; setValid(this,false); return; }
    let n = parseInt(raw,10);
    if (raw.length >= 2 || n > 1) {
      n = clamp(n,1,12); this.value = String(n).padStart(2,'0');
      setValid(this,true); focusNext('inY');
    } else { this.value = raw; setValid(this,false); }
    updateRST();
  });
  el.addEventListener('blur', function() {
    const n = parseInt(this.value,10);
    if (!isNaN(n) && n >= 1) { this.value=String(clamp(n,1,12)).padStart(2,'0'); setValid(this,true); }
    else setValid(this,false);
    updateRST();
  });
})();

/* ANO: 1900–2100 */
(function() {
  const el = document.getElementById('inY');
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });
  el.addEventListener('input', function() {
    const raw = this.value.replace(/\D/g,'').slice(0,4);
    this.value = raw;
    if (raw.length === 4) {
      const n = clamp(parseInt(raw,10),1900,2100);
      this.value = String(n); setValid(this,true); focusNext('inT');
    } else { setValid(this, raw.length > 0); }
    updateRST();
  });
  el.addEventListener('blur', function() {
    const n = parseInt(this.value,10);
    if (!isNaN(n)) { this.value=String(clamp(n,1900,2100)); setValid(this,true); }
    else setValid(this,false);
    updateRST();
  });
})();

/* HORA: HH:MM com máscara automática */
(function() {
  const el = document.getElementById('inT');
  el.setAttribute('inputmode','numeric');
  el.addEventListener('keydown', function(e) {
    const ctrl = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight'];
    if (ctrl.indexOf(e.key) !== -1) return;
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });
  el.addEventListener('input', function() {
    const digits = this.value.replace(/\D/g,'').slice(0,4);
    if (!digits) { this.value=''; setValid(this,false); updateRST(); return; }
    let masked;
    if (digits.length <= 2) {
      masked = digits;
    } else {
      const hh = clamp(parseInt(digits.slice(0,2),10),0,23);
      masked = String(hh).padStart(2,'0') + ':' + digits.slice(2);
    }
    if (digits.length === 4) {
      const hh2 = clamp(parseInt(digits.slice(0,2),10),0,23);
      const mm  = clamp(parseInt(digits.slice(2,4),10),0,59);
      this.value = String(hh2).padStart(2,'0')+':'+String(mm).padStart(2,'0');
      setValid(this,true); focusNext('inCity'); updateRST(); return;
    }
    this.value = masked; setValid(this,false); updateRST();
  });
  el.addEventListener('blur', function() {
    const digits = this.value.replace(/\D/g,'');
    if (!digits) { setValid(this,false); return; }
    const hh = clamp(parseInt((digits+'00').slice(0,2),10),0,23);
    const mm = clamp(parseInt((digits+'00').slice(2,4),10),0,59);
    this.value = String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    setValid(this,true); updateRST();
  });
})();

/* LONGITUDE / LATITUDE */
(function() {
  document.getElementById('inLo').addEventListener('blur', function() {
    const v = parseFloat(this.value);
    if (!isNaN(v)) { this.value=clamp(v,-180,180).toFixed(4); setValid(this,true); }
    else setValid(this,false);
    updateLocPrev(); updateRST();
  });
  document.getElementById('inLa').addEventListener('blur', function() {
    const v = parseFloat(this.value);
    if (!isNaN(v)) { this.value=clamp(v,-90,90).toFixed(4); setValid(this,true); }
    else setValid(this,false);
    updateLocPrev(); updateRST();
  });
  ['inLo','inLa'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
      updateLocPrev(); updateRST();
    });
  });
})();

/* Enter avança para o próximo campo */
(function() {
  const seq = ['inD','inM','inY','inT','inCity','inName'];
  seq.forEach(function(id, idx) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const next = seq[idx+1];
        if (next) focusNext(next);
        else document.getElementById('calcBtn').focus();
      }
    });
  });
})();

/* Fuso, DST, cidade e botão calcular */
['inTZ','inDST'].forEach(function(id){
  const el=document.getElementById(id);
  if(el){ el.addEventListener('input',updateRST); el.addEventListener('change',updateRST); }
});
document.getElementById('inCity').addEventListener('input',function(){ geoDebounce(this.value.trim()); });

/* Fecha sugestões ao clicar fora */
document.addEventListener('click',function(e){
  if(!e.target.closest('.geo-wrap')) hideSug();
});

document.getElementById('calcBtn').addEventListener('click', runCalc);

/* ═══════ INICIALIZAÇÃO ═══════ */
window.addEventListener('DOMContentLoaded', function(){
  updateLocPrev();
  autoDetectTimezone();
});

/* ═══════ AUTO-DETECÇÃO DE FUSO (Intl API) ═══════ */
function autoDetectTimezone() {
  try {
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tzName) return;
    const now    = new Date();
    const offset = -(now.getTimezoneOffset() / 60);
    const sel = document.getElementById('inTZ');
    if (!sel) return;
    let matched = false;
    for (let i = 0; i < sel.options.length; i++) {
      if (parseFloat(sel.options[i].value) === offset) {
        sel.value = sel.options[i].value;
        matched = true;
        break;
      }
    }
    if (!matched) {
      let best = 0, bestD = 999;
      for (let j = 0; j < sel.options.length; j++) {
        const v = parseFloat(sel.options[j].value);
        if (isNaN(v)) continue;
        const d = Math.abs(v - offset);
        if (d < bestD) { bestD = d; best = j; }
      }
      sel.selectedIndex = best;
    }
    const hint    = document.getElementById('tzHint');
    const hintTxt = document.getElementById('tzHintTxt');
    if (hint && hintTxt) {
      const sign = offset >= 0 ? '+' : '';
      const city = tzName.split('/').pop().replace(/_/g, ' ');
      hintTxt.textContent = 'GMT ' + sign + offset + ' \u00b7 ' + city;
      hint.classList.add('tz-hint--set');
    }
    updateRST();
  } catch (e) {
    /* Intl não disponível — sem erro */
  }
}
