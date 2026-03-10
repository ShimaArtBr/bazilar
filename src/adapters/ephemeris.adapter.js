/**
 * @file js/adapters/ephemeris.adapter.js
 * @description Adapter ESM para o módulo IIFE Ephemeris (Dr. Li Wei).
 *
 * PROBLEMA: Ephemeris é um IIFE que expõe `const Ephemeris = (() => {})()` no escopo global.
 *           O BAZILAR usa ES6 `import/export` — incompatível diretamente.
 *
 * SOLUÇÃO (padrão Wrapper ESM, S1·W1):
 *   Importa o IIFE adaptado (ephemeris.iife.js = original + `export default Ephemeris`),
 *   cria binding local e re-exporta — zero modificação na lógica interna.
 *
 * CONTRATO DE API PÚBLICA (verificado em auditoria 2026-03-08):
 *   Ephemeris.gregorianToJD(year, month, dayDecimal) → number (JD)
 *   Ephemeris.sunApparentLongitude(y, m, d, h, mi, s) → { lambda, error? }
 *   Ephemeris.jdToD(jd) → { year, month, day }
 *   Ephemeris.runTests() → { passCount, failCount, criticalBugs }
 *
 * @see plano-infra.md §S1 — Incompatibilidades Críticas
 * @owner JS Engineer S1
 * @sprint S1·W1
 */

// ── Import com binding local + re-export nomeado ──────────────────────────────
// CORREÇÃO BUG: `export { default as Ephemeris }` cria re-export mas NÃO binding local.
// As funções wrapper abaixo precisam de `Ephemeris` como variável local → import separado.
import Ephemeris from './ephemeris.iife.js';
export { Ephemeris };

/**
 * Conveniência: re-exporta a função mais usada no engine pipeline.
 * Permite: import { sunApparentLongitude } from './adapters/ephemeris.adapter.js'
 *
 * @param {number} y  - Ano gregoriano
 * @param {number} m  - Mês (1-12)
 * @param {number} d  - Dia
 * @param {number} h  - Hora (0-23)
 * @param {number} mi - Minuto (0-59)
 * @param {number} s  - Segundo (0-59)
 * @returns {{ lambda: number, error?: string }}
 */
export function sunApparentLongitude(y, m, d, h, mi, s) {
  return Ephemeris.sunApparentLongitude(y, m, d, h, mi, s);
}

/**
 * Conveniência: conversão Gregoriano → JD (implementação Li Wei).
 * IMPORTANTE: BAZILAR engine.js tem toJD() próprio e correto (guard m≤2).
 * Este export é para uso exclusivo dos adapters dos módulos Li Wei.
 *
 * @param {number} y          - Ano
 * @param {number} m          - Mês (1-12)
 * @param {number} dayDecimal - Dia com fração de hora (ex: 15.5 = dia 15, 12h)
 * @returns {number} Número Juliano
 */
export function gregorianToJD(y, m, dayDecimal) {
  return Ephemeris.gregorianToJD(y, m, dayDecimal);
}
