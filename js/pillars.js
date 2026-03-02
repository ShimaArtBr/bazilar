/* ══════════════════════════════════════════════════
   BAZILAR — pillars.js
   Four Pillars, Luck Pillars, Stars, Interactions, Element Balance
══════════════════════════════════════════════════ */
'use strict';

/* ═══════ FOUR PILLARS ═══════ */

function yearPil(jd) {
  var y = fromJD(jd).year;
  if (jd < termJD(315, y)) y--;
  return {si:((y-4)%10+10)%10, bi:((y-4)%12+12)%12, by:y};
}

function monthPil(jd) {
  var y=fromJD(jd).year, mi=-1;
  for (var yr=y; yr>=y-1; yr--) {
    for (var i=11; i>=0; i--) {
      if (jd >= termJD(MT[i].l, yr)) { mi=i; break; }
    }
    if (mi>=0) break;
  }
  if (mi<0) mi=0;
  var bi=MBS[mi], ys=yearPil(jd).si, si=(YMS[ys]+mi)%10;
  return {si:si, bi:bi, mi:mi};
}

function dayPil(jd) {
  var idx = ((Math.round(jd)-2451545+54)%60+60)%60;
  return {si:idx%10, bi:idx%12, idx:idx};
}

function hourPil(rh, ds) {
  var bi = Math.floor(((rh+1)%24)/2);
  return {si:(DHS[ds]+bi)%10, bi:bi};
}

/* ═══════ LUCK PILLARS 大運 ═══════ */

function calcLuckPillars(birthJD, yearStem, monthStem, monthBranch, monthTermIdx, gender, birthYear) {
  if (!gender) return null;
  var yearPo = ST[yearStem].po;
  var forward = (gender==='M' && yearPo==='Yang') || (gender==='F' && yearPo==='Yin');

  var searchYear=birthYear, targetJD=null;
  if (forward) {
    for (var y2=searchYear; y2<=searchYear+1; y2++) {
      for (var ti=0; ti<12; ti++) {
        var tjd=termJD(MT[ti].l, y2);
        if (tjd > birthJD) { targetJD=tjd; break; }
      }
      if (targetJD) break;
    }
  } else {
    for (var y3=searchYear; y3>=searchYear-1; y3--) {
      for (var ti2=11; ti2>=0; ti2--) {
        var tjd2=termJD(MT[ti2].l, y3);
        if (tjd2 <= birthJD) { targetJD=tjd2; break; }
      }
      if (targetJD) break;
    }
  }
  if (!targetJD) return null;

  var distDays = Math.abs(birthJD - targetJD);
  var startAge = distDays / 3;
  var startYears = Math.floor(startAge);
  var startMonths = Math.round((startAge - startYears) * 12);

  var msi=monthStem, mbi=monthBranch, pillars=[];
  for (var c=0; c<8; c++) {
    if (forward) { msi=(msi+1)%10; mbi=(mbi+1)%12; }
    else { msi=(msi+9)%10; mbi=(mbi+11)%12; }
    var age = startYears + c*10;
    pillars.push({si:msi, bi:mbi, age:age, ageEnd:age+9, startYear:birthYear+age});
  }
  return {forward:forward, startAge:startYears, startMonths:startMonths, pillars:pillars};
}

/* ═══════ SYMBOLIC STARS 神煞 ═══════ */

function findStars(yb, db, ys, ds) {
  var stars = [];
  var tyD=TIANYI[ds], tyY=TIANYI[ys];
  if (tyD) tyD.forEach(function(b) { stars.push({name:'starTianYi',zh:'天乙',branch:b}); });
  if (tyY) tyY.forEach(function(b) { if(!tyD||tyD.indexOf(b)===-1) stars.push({name:'starTianYi',zh:'天乙',branch:b}); });

  var thY=TAOHUA[yb], thD=TAOHUA[db];
  if (thY!==undefined) stars.push({name:'starTaoHua',zh:'桃花',branch:thY,source:'year'});
  if (thD!==undefined && thD!==thY) stars.push({name:'starTaoHua',zh:'桃花',branch:thD,source:'day'});

  var ymY=YIMA[yb], ymD=YIMA[db];
  if (ymY!==undefined) stars.push({name:'starYiMa',zh:'驛馬',branch:ymY,source:'year'});
  if (ymD!==undefined && ymD!==ymY) stars.push({name:'starYiMa',zh:'驛馬',branch:ymD,source:'day'});

  return stars;
}

/* ═══════ BRANCH INTERACTIONS ═══════ */

function findInteractions(branches) {
  var r = [];
  HARMONY6.forEach(function(h) {
    if (branches.indexOf(h.a)!==-1 && branches.indexOf(h.b)!==-1)
      r.push({type:'harmony6', a:h.a, b:h.b, el:h.el});
  });
  HARMONY3.forEach(function(h) {
    var c=0; h.branches.forEach(function(b) { if(branches.indexOf(b)!==-1) c++; });
    if (c>=3) r.push({type:'harmony3', branches:h.branches, el:h.el, zh:h.zh});
  });
  CLASH6.forEach(function(c) {
    if (branches.indexOf(c[0])!==-1 && branches.indexOf(c[1])!==-1)
      r.push({type:'clash', a:c[0], b:c[1]});
  });
  HARM6.forEach(function(h) {
    if (branches.indexOf(h[0])!==-1 && branches.indexOf(h[1])!==-1)
      r.push({type:'harm', a:h[0], b:h[1]});
  });
  PENALTY3.forEach(function(p) {
    var c=0; p.branches.forEach(function(b) { if(branches.indexOf(b)!==-1) c++; });
    if (c>=p.branches.length) r.push({type:'penalty', branches:p.branches, zh:p.zh});
  });
  return r;
}

/* ═══════ FIVE ELEMENTS BALANCE ═══════ */

function elemBalance(stems, branchIdxs) {
  var ct = {Wood:0, Fire:0, Earth:0, Metal:0, Water:0};
  stems.forEach(function(si) { if(si>=0) ct[ST[si].el]++; });
  branchIdxs.forEach(function(bi) {
    if (bi>=0) {
      var hs=HIDDEN[bi];
      ct[ST[hs[0]].el] += 1;
      if (hs[1]!==undefined) ct[ST[hs[1]].el] += 0.5;
      if (hs[2]!==undefined) ct[ST[hs[2]].el] += 0.3;
    }
  });
  return ct;
}
