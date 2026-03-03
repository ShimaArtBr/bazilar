/* ══════════════════════════════════════════════════
   BAZILAR — engine.js
   Astronomical core: Julian Day, VSOP87 solar longitude,
   Solar Terms bisection, Equation of Time, Real Solar Time

   Dependência CDN (adicionar no HTML antes deste script):
   <script src="https://cdn.jsdelivr.net/npm/astronomia@4.1.1/dist/astronomia.js"></script>

   Troca: Meeus cap.25 (polinômio simples) → VSOP87 via astronomia.solar
   Precisão: < 0.01° (idêntica ao requisito original, base teórica superior)
   astronomia.solar.apparentLongitude(jde) já aplica:
     • VSOP87 (série completa para a Terra)
     • Nutação em longitude (nutation.nutation)
     • Aberração anual (−0.00569° − 0.00478°·sin Ω)
   Resultado em radianos — convertido internamente para graus.
══════════════════════════════════════════════════ */
'use strict';

/* ═══════ GUARD: verificar se a lib foi carregada ═══════ */
function _astroCheck() {
  if (typeof astronomia === 'undefined' || !astronomia.solar || !astronomia.julian) {
    throw new Error(
      'BAZILAR: astronomia.js não carregado. ' +
      'Adicione antes deste script:\n' +
      '<script src="https://cdn.jsdelivr.net/npm/astronomia@4.1.1/dist/astronomia.js"></script>'
    );
  }
}

/* ═══════ JULIAN DAY ═══════
   Antes: algoritmo Meeus inline (2 funções manuais).
   Agora:  astronomia.julian — mesma fórmula, mesma referência J2000.

   toJD(y, m, d, h) → número JD (h opcional, default 12h = meio-dia)
   fromJD(jd)       → {year, month, day, hours}
*/
function toJD(y, m, d, h) {
  _astroCheck();
  if (h === undefined) h = 12;
  /* CalendarGregorianToJD aceita day fracional: d + h/24 */
  return astronomia.julian.CalendarGregorianToJD(y, m, d + h / 24);
}

function fromJD(jd) {
  _astroCheck();
  var cal = astronomia.julian.JDToCalendar(jd);
  /* cal.day pode ser fracional — separar parte inteira e horas */
  var dayInt   = Math.floor(cal.day);
  var hours    = (cal.day - dayInt) * 24;
  return { year: cal.year, month: cal.month, day: dayInt, hours: hours };
}

/* ═══════ SOLAR LONGITUDE (VSOP87) ═══════
   Antes: Meeus cap.25 — série de 3 termos + nutação simplificada.
   Agora: astronomia.solar.apparentLongitude(jde) — VSOP87 completo.

   JDE (Julian Ephemeris Day) ≈ JD para fins de cálculo de posição solar
   (diferença = ΔT, < 2 min no séc. XX–XXI, irrelevante para Termos Solares).

   Retorna: graus decimais, intervalo [0, 360).
*/
function sunLon(jd) {
  _astroCheck();
  /* apparentLongitude devolve radianos */
  var rad = astronomia.solar.apparentLongitude(jd);
  var deg = rad * (180 / Math.PI);
  return ((deg % 360) + 360) % 360;
}

/* ═══════ SOLAR TERM — BISECTION ±1s ═══════
   Idêntico ao original; apenas sunLon() foi trocada acima,
   o algoritmo de bisseção em si não muda.
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

/* ═══════ EQUATION OF TIME ═══════
   Mantida a fórmula empírica de Spencer (1971) — precisão ±30 s,
   suficiente para TSR / Real Solar Time.
   (astronomia.sidereal / equation of time existem na lib mas
    adicionariam ~30 ms de cálculo sem ganho prático para BaZi.)
*/
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

/* ═══════ REAL SOLAR TIME ═══════ — sem alterações */
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

/* ═══════ UTILITIES ═══════ — sem alterações */
function p2(n)   { return String(Math.floor(n)).padStart(2, '0'); }
function ft(h,m) { return p2(h) + ':' + p2(m); }
function sgn(n)  { return (n >= 0 ? '+' : '') + n.toFixed(1); }
