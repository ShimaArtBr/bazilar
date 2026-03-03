/* ══════════════════════════════════════════════════
   BAZILAR — engine.js
   Astronomical core: Julian Day, VSOP87 solar longitude,
   Solar Terms bisection, Equation of Time, Real Solar Time

   Dependência CDN (já inserida no index.html antes deste script):
   <script src="https://cdn.jsdelivr.net/npm/astronomia@3.3.0/dist/astronomia.min.js"></script>

   Usa astronomia v3 (bundle UMD — expõe window.astronomia).
   v4 é ESM-only e não funciona via <script> tag simples.

   astronomia.solar.apparentLongitude(jde) — VSOP87 completo:
     • série VSOP87 para a Terra
     • nutação em longitude
     • aberração anual
   Retorna radianos; convertido internamente para graus.
   Precisão: < 0.01° (vs Meeus ~0.01°, base teórica superior)
══════════════════════════════════════════════════ */
'use strict';

/* ═══════ GUARD: verificar uma vez no boot ═══════ */
(function() {
  if (typeof astronomia === 'undefined' || !astronomia.solar || !astronomia.julian) {
    console.error(
      'BAZILAR: astronomia.js não carregado.\n' +
      'Verifique o <script> CDN no index.html:\n' +
      '<script src="https://cdn.jsdelivr.net/npm/astronomia@3.3.0/dist/astronomia.min.js"></script>'
    );
  }
})();

/* ═══════ JULIAN DAY ═══════
   toJD(y, m, d, h) → número JD  (h opcional, default 12)
   fromJD(jd)       → {year, month, day, hours}

   astronomia.julian.CalendarGregorianToJD aceita day fracional (d + h/24).
   astronomia.julian.JDToCalendar devolve {year, month, day} com day fracional.
*/
function toJD(y, m, d, h) {
  if (h === undefined) h = 12;
  return astronomia.julian.CalendarGregorianToJD(y, m, d + h / 24);
}

function fromJD(jd) {
  var cal    = astronomia.julian.JDToCalendar(jd);
  var dayInt = Math.floor(cal.day);
  var hours  = (cal.day - dayInt) * 24;
  return { year: cal.year, month: cal.month, day: dayInt, hours: hours };
}

/* ═══════ SOLAR LONGITUDE — VSOP87 ═══════
   Antes: Meeus cap.25 (polinômio de 3 termos + nutação simplificada).
   Agora: apparentLongitude(jde) — VSOP87 completo via astronomia v3.

   Retorna graus decimais em [0, 360).
*/
function sunLon(jd) {
  var rad = astronomia.solar.apparentLongitude(jd);   /* radianos */
  var deg = rad * (180 / Math.PI);
  return ((deg % 360) + 360) % 360;
}

/* ═══════ SOLAR TERM — BISECTION ±1s ═══════
   Algoritmo idêntico ao original; sunLon() acima é a única troca.
*/
function findTermJD(lon, apx) {
  var lo = apx - 18, hi = apx + 18;
  for (var i = 0; i < 64; i++) {
    var mid = (lo + hi) / 2;
    var d   = sunLon(mid) - lon;
    if (d >  180) d -= 360;
    if (d < -180) d += 360;
    if (d > 0) hi = mid; else lo = mid;
    if (hi - lo < 1e-6) break;
  }
  return (lo + hi) / 2;
}

/* Cached Solar Term JD lookup — sem alterações */
var _tc = {};
function termJD(lon, y) {
  var k = lon + ':' + y;
  if (!_tc[k]) {
    var dy  = ((lon + 360) % 360) / 360 * 365.25;
    var adj = (dy + 79) % 365.25;
    _tc[k]  = findTermJD(lon, toJD(y, 1, 1, 12) + adj);
  }
  return _tc[k];
}

/* ═══════ EQUATION OF TIME (Spencer 1971) ±30 s ═══════ */
function doy(y, m, d) {
  var md = [31, 28 + (((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 1 : 0),
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31], n = d;
  for (var i = 0; i < m - 1; i++) n += md[i];
  return n;
}

function eot(y, m, d) {
  var B = (360 / 365) * (doy(y, m, d) - 81) * (Math.PI / 180);
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/* ═══════ REAL SOLAR TIME ═══════ */
function calcRST(y, m, d, hh, mm, lo, tz, dst) {
  var tot = hh * 60 + mm;
  var lc  = (lo - tz * 15) * 4;
  var e   = eot(y, m, d);
  var dc  = dst ? -60 : 0;
  var r   = tot + lc + e + dc;
  while (r <    0) r += 1440;
  while (r >= 1440) r -= 1440;
  return { h: Math.floor(r / 60), m: Math.floor(r % 60), lc: lc, e: e, dc: dc, corr: lc + e + dc };
}

/* ═══════ UTILITIES ═══════ */
function p2(n)   { return String(Math.floor(n)).padStart(2, '0'); }
function ft(h,m) { return p2(h) + ':' + p2(m); }
function sgn(n)  { return (n >= 0 ? '+' : '') + n.toFixed(1); }
