/**
 * @deprecated Módulo legado — não importado pela aplicação ativa.
 * Mantido para referência histórica. Remoção prevista em S4.
 * Não editar. Consultar src/renderer.js (renderer) e src/app.js (controller).
 */
/* ══════════════════════════════════════════════════
   BAZILAR — render.js — Geração de HTML de resultados
   PT-only · v3.1
══════════════════════════════════════════════════ */

import { ST, EB, MT, HIDDEN, ES, tenGod } from './data.js';
import { p2, ft, sgn } from './engine.js';
import { t, te, tp, tan, tsrc, tpl } from './i18n.js';

function badge(el) {
  const c = ES[el] || {};
  return '<span class="p-elem" style="background:'+c.bg+';color:'+c.tx+'">'+te(el)+'</span>';
}

export function pilCard(hdr, si, bi, dm, isDay) {
  if (si<0) return '<div class="pillar-card"><div class="pillar-hd">—</div></div>';
  const s=ST[si], b=EB[bi], g=(!isDay && dm>=0) ? tenGod(dm,si) : null;
  const hs = HIDDEN[bi] || [];
  let hiddenHtml = '';
  if (hs.length>0) {
    hiddenHtml = '<div class="p-hidden">';
    hs.forEach(function(hsi,idx) {
      const hst=ST[hsi], c=ES[hst.el]||{};
      const label = idx===0?'主':idx===1?'中':'余';
      const hGod = (!isDay && dm>=0) ? tenGod(dm,hsi) : null;
      hiddenHtml += '<span style="background:'+c.bg+';color:'+c.tx+'">'+hst.zh+' '+label+(hGod?' · '+hGod.zh:'')+'</span> ';
    });
    hiddenHtml += '</div>';
  }
  return '<div class="pillar-card">'
    + '<div class="pillar-hd'+(isDay?' active':'')+'">'+hdr+'</div>'
    + '<div class="p-stem">'
      + '<span class="p-char">'+s.zh+'</span>'
      + '<span class="p-py">'+s.py+'</span>'
      + badge(s.el)
      + '<span class="p-py" style="margin-top:3px">'+tp(s.po)+'</span>'
      + (g ? '<span class="p-god">'+g.zh+' '+g.py+'</span>' : '')
    + '</div>'
    + '<div class="p-branch">'
      + '<span class="p-char">'+b.zh+'</span>'
      + '<span class="p-py">'+b.py+'</span>'
      + badge(b.el)
      + '<span class="p-py" style="margin-top:3px">'+tan(b.an)+' · '+tp(b.po)+'</span>'
      + hiddenHtml
    + '</div>'
  + '</div>';
}

export function renderElemBalance(balance) {
  let max=0;
  Object.keys(balance).forEach(function(k){if(balance[k]>max)max=balance[k];});
  if(max===0)max=1;
  const elems=['Wood','Fire','Earth','Metal','Water'];
  let html='<div class="elem-bar"><p class="elem-title">'+t('secElem')+'</p>';
  elems.forEach(function(el){
    const v=balance[el]||0, pct=Math.round((v/max)*100), c=ES[el]||{};
    html+='<div class="elem-row">'
      +'<span class="elem-name">'+te(el)+'</span>'
      +'<div class="elem-track"><div class="elem-fill" style="width:'+pct+'%;background:'+c.tx+'"></div></div>'
      +'<span class="elem-count">'+v.toFixed(1)+'</span></div>';
  });
  return html+'</div>';
}

export function renderLuckPillars(luck, dm, currentYear) {
  if (!luck) return '';
  let html='<p class="sec-label">'+t('secLuck')+'</p>'
    +'<div style="font-size:.72rem;color:var(--muted);margin-bottom:10px">'
    +t('luckDir')+': '+(luck.forward?t('luckFwd'):t('luckBwd'))
    +' · '+t('luckStart')+': '+luck.startAge
    +(luck.startMonths>0?' + '+luck.startMonths+'m':'')+'</div>'
    +'<div class="luck-grid">';
  luck.pillars.forEach(function(lp){
    const s=ST[lp.si],b=EB[lp.bi];
    const isCurrent=(currentYear>=lp.startYear&&currentYear<lp.startYear+10);
    const g=tenGod(dm,lp.si);
    html+='<div class="luck-card'+(isCurrent?' current':'')+'">'
      +'<div class="luck-age">'+lp.age+'–'+lp.ageEnd+'</div>'
      +'<div class="luck-chars">'+s.zh+b.zh+'</div>'
      +'<div class="luck-py">'+s.py+' '+b.py+'</div>'
      +'<div class="luck-elem">'+badge(s.el)+'</div>'
      +(g?'<div style="font-size:.52rem;color:var(--dim);margin-top:2px">'+g.zh+'</div>':'')
      +'<div class="luck-years">'+lp.startYear+'–'+(lp.startYear+9)+'</div></div>';
  });
  return '<div class="luck-section">'+html+'</div></div>';
}

export function renderStars(stars, allBranches) {
  if (!stars||stars.length===0) return '';
  let html='<p class="sec-label">'+t('secStars')+'</p><div class="stars-grid">';
  stars.forEach(function(star){
    const found=allBranches.indexOf(star.branch)!==-1;
    const bd=EB[star.branch];
    html+='<div class="star-card" style="opacity:'+(found?'1':'.5')+'">'
      +'<div class="star-name">'+t(star.name)+'</div>'
      +'<div class="star-val">'+bd.zh+' '+bd.py+(found?' ✓':' (—)')+'</div>'
      +'<div class="star-desc">'+(star.source?'('+tsrc(star.source)+')':'')+(found?' '+t('starFound'):'')+'</div></div>';
  });
  return '<div class="stars-section">'+html+'</div></div>';
}

export function renderInteractions(interactions) {
  if (!interactions||interactions.length===0) return '';
  let html='<p class="sec-label">'+t('secInteract')+'</p><div class="interact-list">';
  interactions.forEach(function(ix){
    if(ix.type==='harmony6'){
      html+='<div class="interact-item"><span class="interact-type">'+t('harmony6')+'</span><span class="interact-pair">'+EB[ix.a].zh+' + '+EB[ix.b].zh+'</span><span class="interact-result">→ '+t('produces')+' '+te(ix.el)+'</span></div>';
    } else if(ix.type==='harmony3'){
      html+='<div class="interact-item"><span class="interact-type">'+t('harmony3')+'</span><span class="interact-pair">'+ix.branches.map(function(b){return EB[b].zh;}).join(' + ')+'</span><span class="interact-result">→ '+te(ix.el)+' '+ix.zh+'</span></div>';
    } else if(ix.type==='clash'){
      html+='<div class="interact-item" style="border-color:rgba(196,74,53,.3)"><span class="interact-type" style="color:var(--fire2)">'+t('clash')+'</span><span class="interact-pair">'+EB[ix.a].zh+' ↔ '+EB[ix.b].zh+'</span><span class="interact-result" style="color:var(--fire2)">⚡</span></div>';
    } else if(ix.type==='harm'){
      html+='<div class="interact-item" style="border-color:rgba(192,105,43,.3)"><span class="interact-type" style="color:#e0883a">'+t('harm')+'</span><span class="interact-pair">'+EB[ix.a].zh+' ↔ '+EB[ix.b].zh+'</span><span class="interact-result" style="color:#e0883a">⚠</span></div>';
    } else if(ix.type==='penalty'){
      html+='<div class="interact-item" style="border-color:rgba(196,74,53,.4)"><span class="interact-type" style="color:var(--fire2)">'+t('penalty')+'</span><span class="interact-pair">'+ix.branches.map(function(b){return EB[b].zh;}).join(' + ')+'</span><span class="interact-result" style="color:var(--fire2)">'+ix.zh+'</span></div>';
    }
  });
  return '<div class="interact-section">'+html+'</div></div>';
}

export function buildLog(p) {
  const mt=MT[p.mi]||MT[0];
  function L(key,map){
    const s=tpl(key,map||{});
    if(s.trim().indexOf('//')===0) return '<p class="fl"><span class="hc">'+s+'</span></p>';
    if(s.indexOf('=')!==-1){const pts=s.split('=');return '<p class="fl"><span class="hg">'+pts[0]+'</span>=<span class="hv">'+pts.slice(1).join('=')+'</span></p>';}
    return '<p class="fl">'+s+'</p>';
  }
  return [
    L('lTitle',{'%d':p2(p.d),'%m':p2(p.m),'%y':p.y}),'<br>',
    L('lSun',{'%d':p2(p.d),'%m':p2(p.m),'%y':p.y}),
    '<p class="fl"><span class="hg">sunLon</span> = <span class="hv">'+p.sunL.toFixed(4)+'°</span></p>','<br>',
    L('lJD',{'%d':p2(p.d),'%m':p2(p.m),'%y':p.y}),
    '<p class="fl"><span class="hg">JD</span> = <span class="hv">'+p.jd.toFixed(1)+'</span></p>','<br>',
    L('lYC'),L('lYS',{'%Y':p.by,'%si':p.ys,'%sc':ST[p.ys].zh}),L('lYB',{'%Y':p.by,'%bi':p.yb,'%bc':EB[p.yb].zh}),'<br>',
    L('lMC',{'%tn':mt.n,'%tl':mt.l}),L('lMB',{'%mi':p.mi,'%bi':p.mb,'%bc':EB[p.mb].zh}),L('lMS',{'%ys':p.ys,'%mi':p.mi,'%si':p.ms,'%sc':ST[p.ms].zh}),'<br>',
    L('lDC'),L('lDF',{'%jd':Math.round(p.jd),'%di':p.di}),'<br>',
    L('lHC',{'%rst':ft(p.rst.h,p.rst.m,p.rst.s)}),L('lHB',{'%rh':p.rst.h,'%bi':p.hb,'%bc':EB[p.hb].zh,'%hrs':EB[p.hb].hr}),L('lHS',{'%ds':p.ds,'%hi':p.hb,'%si':p.hs,'%sc':ST[p.hs].zh}),'<br>',
    L('lRC'),L('lRF',{'%ct':ft(p.ch,p.cm),'%lc':sgn(p.rst.lc),'%eot':sgn(p.rst.e),'%dst':p.rst.dc,'%rst':ft(p.rst.h,p.rst.m,p.rst.s)}),
  ].join('');
}

/* ═══════ FORÇA DO MESTRE DO DIA 日主強弱 ═══════ */

export function renderDayMasterStrength(analysis, dm) {
  if (!analysis) return '';

  const s   = ST[dm];
  const pct = Math.min(Math.abs(analysis.score) / 10 * 100, 100);
  const barCol = analysis.strong ? '#7dba82' : '#5b9fc9';

  function elBadges(els) {
    return els.map(function(el) {
      const c = ES[el] || {};
      return '<span class="p-elem" style="background:' + c.bg + ';color:' + c.tx + '">' + te(el) + '</span>';
    }).join(' ');
  }

  const label = analysis.strong ? t('dmStrong') : t('dmWeak');

  return '<div class="strength-section">'
    + '<p class="sec-label">' + t('secStrength') + '</p>'
    + '<div class="strength-card">'
    + '<div class="str-header">'
    + '<span class="str-dm">' + s.zh + ' ' + s.py + '</span>'
    + '<span class="str-verdict">' + label + '</span>'
    + '<span class="str-score">' + t('dmScore') + ': '
    + (analysis.score >= 0 ? '+' : '') + analysis.score + '</span>'
    + '</div>'
    + '<div class="str-bar-wrap">'
    + '<div class="str-bar" style="width:' + pct.toFixed(0) + '%;background:' + barCol + '"></div>'
    + '</div>'
    + '<div class="str-row">'
    + '<span class="str-lbl">' + t('dmFav') + '</span>'
    + '<span class="str-els">' + elBadges(analysis.favorable) + '</span>'
    + '</div>'
    + '<div class="str-row">'
    + '<span class="str-lbl">' + t('dmUnfav') + '</span>'
    + '<span class="str-els">' + elBadges(analysis.unfavorable) + '</span>'
    + '</div>'
    + '</div>'
    + '</div>';
}
