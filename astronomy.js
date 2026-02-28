/**
 * astronomy.js — Núcleo astronômico BAZILAR
 * Baseado em: Jean Meeus, "Astronomical Algorithms", 2ª ed. 1991
 *
 * CONFIDENCIAL — não referenciar em nenhum arquivo sob public/
 * Executado exclusivamente em Vercel Functions (Node.js serverless)
 */

'use strict';

// ─────────────────────────────────────────────
// JULIAN DAY
// ─────────────────────────────────────────────

/**
 * Converte data gregoriana + hora UT para Número do Dia Juliano (JD).
 * Meeus cap. 7, eq. 7.1
 * @param {number} y   - ano
 * @param {number} m   - mês (1–12)
 * @param {number} d   - dia
 * @param {number} h   - hora decimal UT (padrão: 12.0 = meio-dia)
 * @returns {number} JD
 */
function toJD(y, m, d, h = 12) {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716))
       + Math.floor(30.6001 * (m + 1))
       + d + B - 1524.5 + h / 24;
}

/**
 * Converte JD de volta para data gregoriana.
 * Meeus cap. 7, algoritmo 7.1
 * @param {number} jd
 * @returns {{ year, month, day, hours }}
 */
function fromJD(jd) {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let A = z;
  if (z >= 2299161) {
    const a = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + a - Math.floor(a / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day   = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year  = month > 2 ? C - 4716 : C - 4715;
  return { year, month, day, hours: f * 24 };
}

// ─────────────────────────────────────────────
// SOLAR LONGITUDE
// ─────────────────────────────────────────────

/**
 * Longitude eclíptica aparente do Sol (graus, 0–360).
 * Meeus cap. 25 — precisão ±0.01° (~15 s de arco).
 * @param {number} jd
 * @returns {number} graus
 */
function sunLon(jd) {
  const T  = (jd - 2451545) / 36525;
  const T2 = T * T;

  // Longitude média geométrica (graus)
  const L0 = ((280.46646 + 36000.76983 * T + 0.0003032 * T2) % 360 + 360) % 360;

  // Anomalia média (graus)
  const M  = ((357.52911 + 35999.05029 * T - 0.0001537 * T2) % 360 + 360) % 360;
  const Mr = M * Math.PI / 180;

  // Equação do centro
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          +  0.000289 * Math.sin(3 * Mr);

  // Longitude verdadeira; correção de aberração + nutação (Ω)
  const omega = (125.04 - 1934.136 * T) * Math.PI / 180;
  const lon   = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);

  return ((lon % 360) + 360) % 360;
}

// ─────────────────────────────────────────────
// SOLAR TERMS — bissecção
// ─────────────────────────────────────────────

/**
 * Encontra o JD exato em que o Sol atinge uma dada longitude eclíptica.
 * Bisecção convergindo para ±1 s (Δ < 1e-6 dias ≈ 0.086 s).
 * @param {number} lon  - longitude alvo (graus)
 * @param {number} apx  - JD aproximado de partida
 * @returns {number} JD
 */
function findTermJD(lon, apx) {
  let lo = apx - 18;
  let hi = apx + 18;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    let d = sunLon(mid) - lon;
    if (d >  180) d -= 360;
    if (d < -180) d += 360;
    if (d > 0) hi = mid; else lo = mid;
    if (hi - lo < 1e-6) break;
  }
  return (lo + hi) / 2;
}

// Cache para evitar recalcular o mesmo termo no mesmo ano
const _termCache = {};

/**
 * Retorna o JD do Termo Solar de longitude `lon` no ano `y`.
 * Resultado cacheado por lon:y.
 * @param {number} lon - longitude do termo (ex: 315 = 立春)
 * @param {number} y   - ano gregoriano
 * @returns {number} JD
 */
function termJD(lon, y) {
  const key = `${lon}:${y}`;
  if (!_termCache[key]) {
    const dy  = ((lon + 360) % 360) / 360 * 365.25;
    const adj = (dy + 79) % 365.25;
    _termCache[key] = findTermJD(lon, toJD(y, 1, 1, 12) + adj);
  }
  return _termCache[key];
}

// ─────────────────────────────────────────────
// EQUATION OF TIME + REAL SOLAR TIME (RST)
// ─────────────────────────────────────────────

/**
 * Dia do ano (1–366).
 */
function dayOfYear(y, m, d) {
  const leap = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 1 : 0;
  const days = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let n = d;
  for (let i = 0; i < m - 1; i++) n += days[i];
  return n;
}

/**
 * Equação do Tempo em minutos (aproximação trigonométrica).
 * Precisão ±0.5 min — suficiente para BaZi.
 * @param {number} y
 * @param {number} m
 * @param {number} d
 * @returns {number} minutos
 */
function eot(y, m, d) {
  const B = (360 / 365) * (dayOfYear(y, m, d) - 81) * (Math.PI / 180);
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/**
 * Calcula o Tempo Solar Real (TSR / RST).
 *
 * TSR = relógio + correção de longitude + Equação do Tempo + DST
 *
 * @param {number} y    - ano
 * @param {number} m    - mês
 * @param {number} d    - dia
 * @param {number} hh   - hora do relógio (0–23)
 * @param {number} mm   - minuto do relógio (0–59)
 * @param {number} lo   - longitude do local (graus, E+)
 * @param {number} tz   - offset UTC do fuso (ex: -3 para BRT)
 * @param {boolean} dst - true se horário de verão ativo
 * @returns {{ h, m, lc, e, dc, corr }}
 */
function calcRST(y, m, d, hh, mm, lo, tz, dst) {
  const clockMin = hh * 60 + mm;
  const lc  = (lo - tz * 15) * 4;      // correção de longitude (min)
  const e   = eot(y, m, d);             // equação do tempo (min)
  const dc  = dst ? -60 : 0;            // DST sempre subtrai 1 h

  let r = clockMin + lc + e + dc;
  while (r <    0) r += 1440;
  while (r >= 1440) r -= 1440;

  return {
    h:    Math.floor(r / 60),
    m:    Math.floor(r % 60),
    lc,
    e,
    dc,
    corr: lc + e + dc,
  };
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

module.exports = { toJD, fromJD, sunLon, termJD, calcRST, eot, dayOfYear };
