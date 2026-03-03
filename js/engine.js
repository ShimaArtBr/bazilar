/* ══════════════════════════════════════════════════
   BAZILAR — engine.js
   Astronomical core: Julian Day, Meeus solar longitude,
   Solar Terms bisection, Equation of Time, Real Solar Time
══════════════════════════════════════════════════ */
'use strict';

function toJD(y,m,d,h) {
  if (h===undefined) h=12;
  if (m<=2) { y--; m+=12; }
  var A=Math.floor(y/100), B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5+h/24;
}

function fromJD(jd) {
  var z=Math.floor(jd+.5), f=jd+.5-z, A=z;
  if (z>=2299161) { var a=Math.floor((z-1867216.25)/36524.25); A=z+1+a-Math.floor(a/4); }
  var B=A+1524, C=Math.floor((B-122.1)/365.25), D=Math.floor(365.25*C), E=Math.floor((B-D)/30.6001);
  var d=B-D-Math.floor(30.6001*E), m=E<14?E-1:E-13, y=m>2?C-4716:C-4715;
  return {year:y, month:m, day:d, hours:f*24};
}

/* Meeus 1991 — apparent solar longitude ±0.01° */
function sunLon(jd) {
  var T=(jd-2451545)/36525, T2=T*T;
  var L0=((280.46646+36000.76983*T+.0003032*T2)%360+360)%360;
  var M=((357.52911+35999.05029*T-.0001537*T2)%360+360)%360;
  var Mr=M*Math.PI/180;
  var C=(1.914602-.004817*T-.000014*T2)*Math.sin(Mr)
       +(0.019993-.000101*T)*Math.sin(2*Mr)
       +.000289*Math.sin(3*Mr);
  var om=(125.04-1934.136*T)*Math.PI/180;
  return (((L0+C-.00569-.00478*Math.sin(om))%360)+360)%360;
}

/* Find JD when Sun reaches given ecliptic longitude — bisection ±1s */
function findTermJD(lon, apx) {
  var lo=apx-18, hi=apx+18;
  for (var i=0; i<64; i++) {
    var mid=(lo+hi)/2, d=sunLon(mid)-lon;
    if (d>180) d-=360;
    if (d<-180) d+=360;
    if (d>0) hi=mid; else lo=mid;
    if (hi-lo<1e-6) break;
  }
  return (lo+hi)/2;
}

/* Cached Solar Term JD lookup */
var _tc = {};
function termJD(lon, y) {
  var k=lon+':'+y;
  if (!_tc[k]) {
    var dy=((lon+360)%360)/360*365.25, adj=(dy+79)%365.25;
    _tc[k] = findTermJD(lon, toJD(y,1,1,12)+adj);
  }
  return _tc[k];
}

/* Day of year */
function doy(y,m,d) {
  var md=[31,28+(((y%4===0&&y%100!==0)||y%400===0)?1:0),31,30,31,30,31,31,30,31,30,31], n=d;
  for (var i=0; i<m-1; i++) n+=md[i];
  return n;
}

/* Equation of Time (minutes) */
function eot(y,m,d) {
  var B=(360/365)*(doy(y,m,d)-81)*(Math.PI/180);
  return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);
}

/* Real Solar Time */
function calcRST(y,m,d,hh,mm,lo,tz,dst) {
  var tot=hh*60+mm, lc=(lo-tz*15)*4, e=eot(y,m,d), dc=dst?-60:0;
  var r=tot+lc+e+dc;
  while (r<0) r+=1440;
  while (r>=1440) r-=1440;
  return {h:Math.floor(r/60), m:Math.floor(r%60), lc:lc, e:e, dc:dc, corr:lc+e+dc};
}

/* Utilities */
function p2(n) { return String(Math.floor(n)).padStart(2,'0'); }
function ft(h,m) { return p2(h)+':'+p2(m); }
function sgn(n) { return (n>=0?'+':'')+n.toFixed(1); }
