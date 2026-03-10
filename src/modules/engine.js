/* ══════════════════════════════════════════════════
   BAZILAR — engine.js
   Astronomical core: Julian Day, Meeus solar longitude,
   Solar Terms bisection, Equation of Time, Real Solar Time.
   No external dependencies — pure math.
══════════════════════════════════════════════════ */

/**
 * mod(a, n) — Resto matemático não-negativo.
 * O operador % nativo do JS retorna negativo para dividendos negativos:
 *   -36470 % 60  →  -50  (INCORRETO)
 *   mod(-36470, 60)  →  10  (CORRETO)
 * Usar esta função para qualquer índice que possa ser negativo.
 * @param {number} a  Dividendo (pode ser negativo)
 * @param {number} n  Divisor (deve ser > 0)
 * @returns {number}  Resultado em [0, n)
 */
export function mod(a, n) {
  return ((a % n) + n) % n;
}


export function toJD(y,m,d,h) {
  if (h===undefined) h=12;
  if (m<=2) { y--; m+=12; }
  const A=Math.floor(y/100), B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5+h/24;
}

export function fromJD(jd) {
  let z=Math.floor(jd+.5); const f=jd+.5-z; let A=z;
  if (z>=2299161) { const a=Math.floor((z-1867216.25)/36524.25); A=z+1+a-Math.floor(a/4); }
  const B=A+1524, C=Math.floor((B-122.1)/365.25), D=Math.floor(365.25*C), E=Math.floor((B-D)/30.6001);
  const d=B-D-Math.floor(30.6001*E), m=E<14?E-1:E-13, y=m>2?C-4716:C-4715;
  return {year:y, month:m, day:d, hours:f*24};
}

/* Meeus 1991 — apparent solar longitude ±0.01° */
export function sunLon(jd) {
  const T=(jd-2451545)/36525, T2=T*T;
  const L0=((280.46646+36000.76983*T+.0003032*T2)%360+360)%360;
  const M=((357.52911+35999.05029*T-.0001537*T2)%360+360)%360;
  const Mr=M*Math.PI/180;
  const C=(1.914602-.004817*T-.000014*T2)*Math.sin(Mr)
       +(0.019993-.000101*T)*Math.sin(2*Mr)
       +.000289*Math.sin(3*Mr);
  const om=(125.04-1934.136*T)*Math.PI/180;
  return (((L0+C-.00569-.00478*Math.sin(om))%360)+360)%360;
}

/* Find JD when Sun reaches given ecliptic longitude — bisection ±1s */
function findTermJD(lon, apx) {
  let lo=apx-18, hi=apx+18;
  for (let i=0; i<64; i++) {
    const mid=(lo+hi)/2; let d=sunLon(mid)-lon;
    if (d>180) d-=360;
    if (d<-180) d+=360;
    if (d>0) hi=mid; else lo=mid;
    if (hi-lo<1e-6) break;
  }
  return (lo+hi)/2;
}

/* Cached Solar Term JD lookup — cache is module-scoped singleton */
const _tc = {};
export function termJD(lon, y) {
  const k=lon+':'+y;
  if (!_tc[k]) {
    const dy=((lon+360)%360)/360*365.25, adj=(dy+79)%365.25;
    _tc[k] = findTermJD(lon, toJD(y,1,1,12)+adj);
  }
  return _tc[k];
}

/* Equation of Time — Meeus Ch.28 full series (max error ~5s vs USNO, vs ~56s for simple approx) */
function eot(jd) {
  const T  = (jd - 2451545) / 36525;
  const T2 = T * T;
  const eps = (23.4392911 - 0.013004167*T - 0.0000001639*T2) * (Math.PI/180);
  const L0  = ((280.46646 + 36000.76983*T + 0.0003032*T2) % 360 + 360) % 360 * (Math.PI/180);
  const e   = 0.016708634 - 0.000042037*T - 0.0000001267*T2;
  const M   = ((357.52911 + 35999.05029*T - 0.0001537*T2) % 360 + 360) % 360 * (Math.PI/180);
  const y   = Math.pow(Math.tan(eps / 2), 2);
  const E   = y*Math.sin(2*L0) - 2*e*Math.sin(M) + 4*e*y*Math.sin(M)*Math.cos(2*L0)
            - 0.5*y*y*Math.sin(4*L0) - 1.25*e*e*Math.sin(2*M);
  return E * (4 * 180 / Math.PI); // minutes
}

/* Real Solar Time — returns {h, m, s, lc, e, dc, corr}
   Seconds included: critical for births within ~1 min of an hour-pillar boundary. */
export function calcRST(y,m,d,hh,mm,lo,tz,dst) {
  const jd  = toJD(y, m, d, hh + mm/60);
  const tot = hh*60 + mm;
  const lc  = (lo - tz*15) * 4;
  const e   = eot(jd);
  const dc  = dst ? -60 : 0;
  let r   = tot + lc + e + dc;
  while (r < 0)    r += 1440;
  while (r >= 1440) r -= 1440;
  const rMin = r * 60; // total seconds
  return {
    h: Math.floor(r / 60),
    m: Math.floor(r % 60),
    s: Math.floor(rMin % 60),
    lc: lc, e: e, dc: dc, corr: lc + e + dc
  };
}

/* Formatting utilities */
export function p2(n) { return String(Math.floor(n)).padStart(2,'0'); }
export function ft(h,m,s) { return p2(h)+':'+p2(m)+(s!==undefined?':'+p2(s):''); }
export function sgn(n) { return (n>=0?'+':'')+n.toFixed(1); }
