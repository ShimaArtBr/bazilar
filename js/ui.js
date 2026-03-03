/* ══════════════════════════════════════════════════
   BAZILAR — ui.js — UI controller, events, main calc
══════════════════════════════════════════════════ */
'use strict';

var GENDER = '';   /* nothing pre-selected */
var ZI_METHOD = 'early';

/* ═══════ THEME ═══════ */
var dark = true;
document.getElementById('themeBtn').addEventListener('click', function(){
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark?'dark':'light');
  document.getElementById('themeIcon').textContent = dark?'☀️':'🌙';
});

/* ═══════ LANGUAGE ═══════ */
function applyLang(code) {
  LANG = code;
  var n = T[code] || T.pt;
  document.documentElement.lang = code;
  document.body.style.fontFamily = code==='zh'
    ? "'Noto Sans SC','Noto Sans',sans-serif"
    : "'Noto Sans',sans-serif";
  document.getElementById('langFlag').textContent = n.flag;
  document.getElementById('langLabel').textContent = n.lbl;
  document.querySelectorAll('.lang-opt').forEach(function(o){
    o.classList.toggle('active', o.dataset.lang===code);
  });
  var map = {
    uiTitle:'title',uiName:'name',uiDate:'date',uiTime:'time',uiCity:'city',
    uiCoords:'coords',uiTZ:'tz',uiDST:'dst',uiRSTLbl:'rstLbl',uiCalc:'calc',
    uiEmpTitle:'etitle',uiEmpSub:'esub',uiGender:'gender',
    uiAdvanced:'advanced',uiDefault:'dflt'
  };
  Object.keys(map).forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.textContent = n[map[id]]||'';
  });
  document.getElementById('inCity').placeholder = n.cityPH || '';
  document.getElementById('inName').placeholder = n.namePH || '';
  document.getElementById('uiGF').textContent = n.gF || 'Feminino';
  document.getElementById('uiGM').textContent = n.gM || 'Masculino';
  document.getElementById('uiEarlyDesc').textContent = n.earlyDesc || '';
  document.getElementById('uiLateDesc').textContent = n.lateDesc || '';
  updateRST(); updateLocPrev();
}

var lWrap=document.getElementById('langWrap'), lBtn=document.getElementById('langBtn');
function openL(){lWrap.classList.add('open');lBtn.setAttribute('aria-expanded','true');}
function closeL(){lWrap.classList.remove('open');lBtn.setAttribute('aria-expanded','false');}
lBtn.addEventListener('click',function(e){e.stopPropagation();lWrap.classList.contains('open')?closeL():openL();});
document.addEventListener('click',function(e){
  if(!e.target.closest('#langWrap')) closeL();
  if(!e.target.closest('.geo-wrap')) hideSug();
});
document.querySelectorAll('.lang-opt[data-lang]').forEach(function(b){
  b.addEventListener('click',function(){applyLang(this.dataset.lang);closeL();lBtn.focus();});
});

/* ═══════ GENDER BUTTONS ═══════ */
document.querySelectorAll('.gender-btn').forEach(function(btn){
  btn.addEventListener('click',function(){
    document.querySelectorAll('.gender-btn').forEach(function(b){b.classList.remove('active');});
    this.classList.add('active');
    GENDER = this.dataset.gender;
  });
});

/* ═══════ ZI SELECTOR ═══════ */
document.getElementById('ziToggle').addEventListener('click',function(){
  document.getElementById('ziSelector').classList.toggle('open');
});
document.querySelectorAll('.zi-opt').forEach(function(opt){
  opt.addEventListener('click',function(){
    document.querySelectorAll('.zi-opt').forEach(function(o){o.classList.remove('active');});
    this.classList.add('active');
    ZI_METHOD = this.dataset.zi;
  });
});

/* ═══════ RST LIVE ═══════ */
function getI() {
  var tv = (document.getElementById('inT').value||'00:00').split(':');
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
  var i = getI();
  if (!i.y || !i.m || !i.d) return;
  var r = calcRST(i.y,i.m,i.d,i.hh,i.mm,i.lo,i.tz,i.dst);
  document.getElementById('rstBox').style.display = 'block';
  document.getElementById('rstV').textContent = ft(r.h,r.m);
  document.getElementById('rstD').innerHTML =
    t('clk')+': '+ft(i.hh,i.mm)+' | '+t('corr')+': '+sgn(r.corr)+' min<br>'
    +'Lon: '+sgn(r.lc)+' min  EoT: '+sgn(r.e)+' min  DST: '+r.dc+' min';
}

function updateLocPrev() {
  var c=(document.getElementById('inCity').value||'').trim();
  var lo=parseFloat(document.getElementById('inLo').value);
  var la=parseFloat(document.getElementById('inLa').value);
  var pr=document.getElementById('locPrev');
  if(pr) pr.textContent = (c&&!isNaN(lo)&&!isNaN(la)) ? c+' ('+la.toFixed(2)+', '+lo.toFixed(2)+')' : '';
}

/* ═══════ MAIN CALC ═══════ */
function runCalc() {
  var i = getI();
  if (!i.y || i.m<1 || i.m>12 || i.d<1 || i.d>31) {
    document.getElementById('results').innerHTML = '<div class="err">'+t('errFill')+'</div>';
    return;
  }

  var jd = toJD(i.y, i.m, i.d, 12);
  var rst = calcRST(i.y, i.m, i.d, i.hh, i.mm, i.lo, i.tz, i.dst);
  var rstH = rst.h + rst.m/60;
  var isZiHour = (rstH>=23 || rstH<1);

  /* Early vs Late Zǐ: affects day pillar for 23:00-23:59 */
  var dayJD = jd;
  if (rstH >= 23 && ZI_METHOD === 'early') {
    dayJD = jd + 1; /* Early Zǐ: use next day stem */
  }

  var yP=yearPil(jd), mP=monthPil(jd), dP=dayPil(dayJD), hP=hourPil(rstH,dP.si);
  var dm=dP.si, sl=sunLon(jd);

  /* Solar Terms display */
  var tds = MT.map(function(mt,idx){
    var tj=termJD(mt.l,i.y), td=fromJD(tj);
    return {n:mt.n, jd:tj, date:td, past:jd>=tj, idx:idx};
  });
  var cti = tds.filter(function(x){return x.past;}).length - 1;

  var stems = [hP.si, dP.si, mP.si, yP.si];
  var branchIdxs = [hP.bi, dP.bi, mP.bi, yP.bi];
  var balance = elemBalance(stems, branchIdxs);
  var luck = calcLuckPillars(jd, yP.si, mP.si, mP.bi, mP.mi, i.gender, i.y);
  var currentYear = new Date().getFullYear();
  var stars = findStars(yP.bi, dP.bi, yP.si, dP.si);
  var allBranches = [hP.bi, dP.bi, mP.bi, yP.bi];
  var interactions = findInteractions(allBranches);

  var lp = {
    y:i.y,m:i.m,d:i.d,by:yP.by,jd:jd,sunL:sl,
    ys:yP.si,yb:yP.bi,ms:mP.si,mb:mP.bi,mi:mP.mi,
    ds:dP.si,db:dP.bi,di:dP.idx,hs:hP.si,hb:hP.bi,
    ch:i.hh,cm:i.mm,rst:rst,
  };

  var locStr = i.city ? (i.city+' ('+i.la.toFixed(2)+', '+i.lo.toFixed(2)+')') : '';
  var termTtl = tpl('terms',{'%y':i.y});

  /* Zi notice */
  var ziHtml = '';
  if (isZiHour) {
    var mName = ZI_METHOD==='early' ? '早子時 Early Zǐ' : '晚子時 Late Zǐ';
    ziHtml = '<div class="zi-notice">'+tpl('ziNotice',{'%method':mName})+'</div>';
  }

  /* Name greeting */
  var nameHtml = '';
  if (i.name) {
    nameHtml = '<div class="name-greet"><span class="name-label">'+t('greet')+'</span> <span class="name-val">'+escH(i.name)+'</span></div>';
  }

  /* BUILD */
  var out = nameHtml + ziHtml
    + '<p class="sec-label">'+t('secPil')+'</p>'
    + '<div class="pillars-grid">'
      + pilCard(t('pH'),hP.si,hP.bi,dm,false)
      + pilCard(t('pD'),dP.si,dP.bi,dm,true)
      + pilCard(t('pM'),mP.si,mP.bi,dm,false)
      + pilCard(t('pY'),yP.si,yP.bi,dm,false)
    + '</div>'
    + '<div class="info-grid">'
      + '<div class="info-card"><p class="ic-title">'+t('dm')+'</p><p class="ic-val">'+ST[dm].zh+' '+ST[dm].py+' — '+te(ST[dm].el)+' '+tp(ST[dm].po)+'</p><p class="ic-sub">'+t('dmSub')+'</p></div>'
      + '<div class="info-card"><p class="ic-title">'+t('rst')+'</p><p class="ic-val" style="font-family:\'JetBrains Mono\',monospace">'+ft(rst.h,rst.m)+'</p><p class="ic-sub">'+t('clk')+': '+ft(i.hh,i.mm)+' · '+t('corr')+': '+sgn(rst.corr)+' min</p></div>'
      + '<div class="info-card"><p class="ic-title">'+t('yr')+'</p><p class="ic-val">'+ST[yP.si].zh+EB[yP.bi].zh+' · '+yP.by+'</p><p class="ic-sub">'+t('yrSub')+'</p></div>'
      + '<div class="info-card"><p class="ic-title">'+t('sun')+'</p><p class="ic-val" style="font-family:\'JetBrains Mono\',monospace">'+sl.toFixed(3)+'°</p><p class="ic-sub">'+locStr+'</p></div>'
    + '</div>'
    + renderElemBalance(balance)
    + '<div class="term-bar"><p class="term-ttl">'+termTtl+'</p><div class="term-track" role="list">'
      + tds.map(function(td,i){
          var c=i<cti?'past':i===cti?'cur':'';
          var d=td.date;
          return '<span class="term-dot '+c+'" role="listitem">'+td.n+' '+p2(d.day)+'/'+p2(d.month)+'</span>';
        }).join('')
    + '</div></div>'
    + renderLuckPillars(luck, dm, currentYear)
    + renderStars(stars, allBranches)
    + renderInteractions(interactions)
    + '<div class="toggle-hd" role="button" aria-expanded="false" onclick="var b=this.nextElementSibling;var o=b.classList.toggle(\'open\');this.setAttribute(\'aria-expanded\',o)">'
      + '<span class="toggle-arrow">▶</span>'
      + '<p class="sec-label" style="border:none;margin:0;padding:0">'+t('secLog')+'</p>'
    + '</div>'
    + '<div class="toggle-body"><div class="log-card">'+buildLog(lp)+'</div></div>'
    + '<div class="acc">'+t('acc')+'</div>';

  document.getElementById('results').innerHTML = out;
}


/* ════════════════════════════════════════════════════════
   SMART INPUT — autoavanço, máscara de hora, validação
   ════════════════════════════════════════════════════════ */

/* Utilitários */
function focusNext(id) {
  var el = document.getElementById(id);
  if (el) { el.focus(); if (el.select) el.select(); }
}
function setValid(el, ok) {
  el.classList.toggle('input-ok',  !!ok);
  el.classList.toggle('input-err', !ok && el.value !== '');
}
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

/* DIA (inD): 01-31, autoavança ao completar */
(function() {
  var el = document.getElementById('inD');
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });
  el.addEventListener('input', function() {
    var raw = this.value.replace(/\D/g,'');
    if (!raw) { this.value=''; setValid(this,false); return; }
    var n = parseInt(raw,10);
    if (raw.length >= 2 || n > 3) {
      n = clamp(n,1,31);
      this.value = String(n).padStart(2,'0');
      setValid(this,true); focusNext('inM');
    } else {
      this.value = raw; setValid(this,false);
    }
    updateRST();
  });
  el.addEventListener('blur', function() {
    var n = parseInt(this.value,10);
    if (!isNaN(n) && n >= 1) { this.value=String(clamp(n,1,31)).padStart(2,'0'); setValid(this,true); }
    else setValid(this,false);
    updateRST();
  });
})();

/* MES (inM): 01-12, autoavança ao completar */
(function() {
  var el = document.getElementById('inM');
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });
  el.addEventListener('input', function() {
    var raw = this.value.replace(/\D/g,'');
    if (!raw) { this.value=''; setValid(this,false); return; }
    var n = parseInt(raw,10);
    if (raw.length >= 2 || n > 1) {
      n = clamp(n,1,12);
      this.value = String(n).padStart(2,'0');
      setValid(this,true); focusNext('inY');
    } else {
      this.value = raw; setValid(this,false);
    }
    updateRST();
  });
  el.addEventListener('blur', function() {
    var n = parseInt(this.value,10);
    if (!isNaN(n) && n >= 1) { this.value=String(clamp(n,1,12)).padStart(2,'0'); setValid(this,true); }
    else setValid(this,false);
    updateRST();
  });
})();

/* ANO (inY): 1900-2100, autoavança com 4 digitos */
(function() {
  var el = document.getElementById('inY');
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });
  el.addEventListener('input', function() {
    var raw = this.value.replace(/\D/g,'').slice(0,4);
    this.value = raw;
    if (raw.length === 4) {
      var n = clamp(parseInt(raw,10),1900,2100);
      this.value = String(n);
      setValid(this,true); focusNext('inT');
    } else {
      setValid(this, raw.length > 0);
    }
    updateRST();
  });
  el.addEventListener('blur', function() {
    var n = parseInt(this.value,10);
    if (!isNaN(n)) { this.value=String(clamp(n,1900,2100)); setValid(this,true); }
    else setValid(this,false);
    updateRST();
  });
})();

/* HORA (inT): mascara HH:MM automatica, clamp, autoavanca */
(function() {
  var el = document.getElementById('inT');
  el.setAttribute('inputmode','numeric');

  el.addEventListener('keydown', function(e) {
    var ctrl = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight'];
    if (ctrl.indexOf(e.key) !== -1) return;
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  });

  el.addEventListener('input', function() {
    var digits = this.value.replace(/\D/g,'').slice(0,4);
    if (!digits) { this.value=''; setValid(this,false); updateRST(); return; }

    var hh = parseInt(digits.slice(0,2),10);
    var masked;

    if (digits.length <= 2) {
      masked = digits;
    } else {
      hh = clamp(hh,0,23);
      var mm = digits.slice(2);
      masked = String(hh).padStart(2,'0') + ':' + mm;
    }

    if (digits.length === 4) {
      hh = clamp(parseInt(digits.slice(0,2),10),0,23);
      var mm2 = clamp(parseInt(digits.slice(2,4),10),0,59);
      this.value = String(hh).padStart(2,'0')+':'+String(mm2).padStart(2,'0');
      setValid(this,true);
      focusNext('inName');
      updateRST(); return;
    }

    this.value = masked;
    setValid(this, false);
    updateRST();
  });

  el.addEventListener('blur', function() {
    var digits = this.value.replace(/\D/g,'');
    if (!digits) { setValid(this,false); return; }
    var hh = clamp(parseInt((digits+'00').slice(0,2),10),0,23);
    var mm = clamp(parseInt((digits+'00').slice(2,4),10),0,59);
    this.value = String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    setValid(this,true);
    updateRST();
  });
})();

/* LONGITUDE / LATITUDE: validar range no blur */
(function() {
  document.getElementById('inLo').addEventListener('blur', function() {
    var v = parseFloat(this.value);
    if (!isNaN(v)) { this.value=clamp(v,-180,180).toFixed(4); setValid(this,true); }
    else setValid(this,false);
    updateLocPrev(); updateRST();
  });
  document.getElementById('inLa').addEventListener('blur', function() {
    var v = parseFloat(this.value);
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

/* Enter em qualquer campo avanca para o proximo */
(function() {
  var seq = ['inD','inM','inY','inT','inName','inCity'];
  seq.forEach(function(id, idx) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var next = seq[idx+1];
        if (next) focusNext(next);
        else document.getElementById('calcBtn').focus();
      }
    });
  });
})();

/* Listeners originais: TZ, DST, cidade, calcular */
['inTZ','inDST'].forEach(function(id){
  var el=document.getElementById(id);
  if(el){el.addEventListener('input',updateRST);el.addEventListener('change',updateRST);}
});
document.getElementById('inCity').addEventListener('input',function(){geoDebounce(this.value.trim());});
document.getElementById('calcBtn').addEventListener('click',runCalc);


/* ═══════ INIT ═══════ */
window.addEventListener('DOMContentLoaded',function(){
  applyLang('pt');
  updateLocPrev();
});
