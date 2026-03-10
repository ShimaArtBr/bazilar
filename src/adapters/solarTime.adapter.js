/**
 * @file js/adapters/solarTime.adapter.js
 * @description Adapter ESM para o módulo IIFE SolarTime (Dr. Li Wei).
 *
 * PROBLEMA: SolarTime.calcularTempoSolarReal() aceita dataNascimento e horaLocal
 *   como strings ("YYYY-MM-DD", "HH:MM:SS") ou objetos ({ano,mes,dia}, {hora,minuto,segundo}),
 *   e longitudeFusoHorario em GRAUS de longitude (ex: UTC+8 → 120°).
 *
 *   O contrato de adapters.test.js (Ana Luz, S2·E16) e interfaces.d.ts esperam:
 *   calcularTempoSolarReal(year, month, day, hour, minute, second, longLocal, longFuso)
 *   onde longFuso é OFFSET UTC em horas (ex: 8 para UTC+8) — convenção BAZILAR.
 *
 * SOLUÇÃO — normalizações aplicadas pelo adapter:
 *   1. Assinatura plana (8 números) → objetos nativos de SolarTime
 *   2. longFuso UTC-hours → longitude em graus (* 15) antes de passar ao IIFE
 *   3. ast string "HH:MM:SS" → ast number (horas decimais via astMinutos / 60)
 *   4. equacaoDoTempo_min  → equacaoDoTempo  (nome conforme interfaces.d.ts)
 *   5. ajusteLongitude_min → ajusteLongitude (nome conforme interfaces.d.ts)
 *   6. jdAst calculado via toJD() + diaDesloc (obrigatório em interfaces.d.ts)
 *
 * CONVENÇÃO longFuso (documentada):
 *   API pública deste adapter: UTC-offset em horas  (ex: 8 para UTC+8, -3 para BRT)
 *   SolarTime interno:         longitude em graus   (ex: 120 para UTC+8, -45 para BRT)
 *   Conversão: longitudeGraus = longFusoUTC * 15
 *   Esta convenção alinha com BAZILAR calcRST(y,m,d,h,mi,lo,tz,dst) onde tz é UTC-offset.
 *
 * DEPENDÊNCIA EXTERNA: Apenas toJD de engine.js (para calcular jdAst).
 *   SolarTime IIFE é completamente self-contained — sem Ephemeris, sem JieQi.
 *
 * CONTRATO DE API PÚBLICA (conforme adapters.test.js + interfaces.d.ts):
 *   calcularTempoSolarReal(year, month, day, hour, minute, second, longLocal, longFusoUTC)
 *     → SolarTimeResult { ast, jdAst, equacaoDoTempo, ajusteLongitude, erro? }
 *   SolarTime → objeto IIFE completo
 *
 * @see interfaces.d.ts — SolarTimeResult
 * @see plano-infra.md §S1 — Incompatibilidades Críticas · E02
 * @owner JS Engineer S1
 * @sprint S1·W1
 */

import SolarTime from './solarTime.iife.js';
import { toJD } from '../modules/engine.js';

// ── Wrapper principal ─────────────────────────────────────────────────────────

/**
 * Calcula o Tempo Solar Aparente (TSA/AST) a partir de parâmetros planos.
 *
 * @param {number} year          - Ano gregoriano
 * @param {number} month         - Mês gregoriano (1–12)
 * @param {number} day           - Dia (1–31)
 * @param {number} hour          - Hora local civil (0–23)
 * @param {number} minute        - Minuto (0–59)
 * @param {number} second        - Segundo (0–59)
 * @param {number} longLocal     - Longitude do local em graus (positivo = Leste)
 * @param {number} longFusoUTC   - Offset UTC do fuso em horas (ex: 8 para UTC+8, -3 para BRT)
 * @returns {import('../../interfaces.d.ts').SolarTimeResult}
 */
export function calcularTempoSolarReal(
  year, month, day, hour, minute, second,
  longLocal, longFusoUTC
) {
  const dataNascimento = { ano: year, mes: month, dia: day };
  const horaLocal      = { hora: hour, minuto: minute, segundo: second ?? 0 };

  // Converter UTC-offset-hours → longitude-graus conforme convenção SolarTime
  const longFusoGraus  = longFusoUTC * 15;

  const raw = SolarTime.calcularTempoSolarReal(
    dataNascimento, horaLocal, longLocal, longFusoGraus
  );

  if (!raw || raw.erro) return raw;

  // ast em horas decimais — astMinutos é número normalizado em [0, 1440)
  const astHours = raw.astMinutos / 60;

  // jdAst: Número Juliano do instante solar aparente.
  // diaDesloc ∈ {-1, 0, +1} indica se o TSA cruzou meia-noite (± 1 dia).
  // toJD suporta h > 24 e h < 0 corretamente via sua fórmula contínua.
  const jdAst = toJD(year, month, day, astHours + (raw.diaDesloc ?? 0) * 24);

  return {
    ast:             astHours,
    jdAst,
    equacaoDoTempo:  raw.equacaoDoTempo_min,
    ajusteLongitude: raw.ajusteLongitude_min,
    // Campos adicionais para diagnóstico (não em interfaces.d.ts mas úteis)
    totalAjuste_min:       raw.totalAjuste_min,
    dizhi:                 raw.dizhi,
    minutosAteFronteira:   raw.minutosAteFronteira,
    avisos:                raw.avisos,
    diaDesloc:             raw.diaDesloc,
    erro:                  null,
  };
}

/**
 * Re-exporta o objeto IIFE completo para acesso avançado.
 * Expõe: SolarTime.equacaoDoTempo(ano,mes,dia), SolarTime.diaDaAno(ano,mes,dia),
 *        SolarTime.ajusteLongitude(longLocal, longFusoGraus), SolarTime.runTests()
 *
 * NOTA: SolarTime.ajusteLongitude() espera longitudeFuso em GRAUS — ao usar
 *   diretamente, converter UTC-hours para graus (* 15).
 *
 * @type {object}
 */
export { SolarTime };
