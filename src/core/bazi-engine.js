/**
 * @file src/core/bazi-engine.js
 * @description Ponte entre app.js (Maya Chen) e BAZILAR (pillars.js + engine.js).
 *
 * IMPLEMENTAÇÃO REAL — substitui o mock entregue em S1·W1.
 *
 * ORIGEM DA NECESSIDADE:
 *   app.js importa: { computeFourPillars, computeLuckPillars, detectInteractions }
 *   BAZILAR expõe: { yearPil, monthPil, dayPil, hourPil, calcLuckPillars, findInteractions }
 *   Nomes e assinaturas divergem — este módulo faz a ponte sem alterar nenhum dos dois.
 *
 * FLAGS SUPORTADAS:
 *   BAZI_SOLAR_V2=0  → hora civil para todos os pilares (legacy, padrão)
 *   BAZI_SOLAR_V2=1  → Tempo Solar Aparente (Spencer 1971) via solarTime.adapter.js
 *                       Requer birth.longitude + birth.timezone
 *   BAZI_JIEQI_V2=0  → monthPil via tabela estática do BAZILAR (legacy, padrão)
 *   BAZI_JIEQI_V2=1  → monthPil via bissecção numérica do jieqi.adapter.js
 *
 * CRITÉRIOS DE ACEITE:
 *   FLAGS=0          → 50/50 PASS no golden dataset (comportamento idêntico ao mock)
 *   BAZI_SOLAR_V2=1  → ±30s máx vs modo legacy para 1900–2100
 *   BAZI_JIEQI_V2=1  → zero mudança de pilar incorreta em 1.000 fronteiras
 *   Zero breaking change na API pública (computeFourPillars, computeLuckPillars, detectInteractions)
 *   app.js e renderer.js NÃO precisam de alteração
 *
 * @see plano-infra.md §S1
 * @see interfaces.d.ts — BirthInput, FourPillars, LuckPillar, Interaction
 * @owner JS Engineer S1
 * @sprint S2·W3
 */

import { toJD, termJD } from '../modules/engine.js';
import {
  yearPil,
  monthPil,
  dayPil,
  hourPil,
  calcLuckPillars,
  findInteractions,
} from '../modules/pillars.js';
import { FLAGS } from '../config/flags.js';
import { calcularTempoSolarReal } from '../adapters/solarTime.adapter.js';
import { getTermoSolar } from '../adapters/jieqi.adapter.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES INTERNAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapeamento de mês gregoriano → índice 0-based do mês BaZi (mes0).
 * Usado apenas quando BAZI_JIEQI_V2=1 para buscar o termo solar correto.
 *
 * O mês BaZi começa no Jié (節) anterior ao nascimento.
 * Esta tabela mapeia o mês gregoriano ao índice 0-based do jieqi.adapter:
 *   0=LiChun(fev) 1=JingZhe(mar) 2=QingMing(abr) 3=LiXia(mai)
 *   4=MangZhong(jun) 5=XiaoShu(jul) 6=LiQiu(ago) 7=BaiLu(set)
 *   8=HanLu(out) 9=LiDong(nov) 10=DaXue(dez) 11=XiaoHan(jan)
 *
 * @type {number[]} índice por mês gregoriano (1-based → posição 1–12)
 */
const MES_GREG_TO_MES0 = [
  -1, // índice 0 — não usado (meses são 1-based)
  11, // Jan  → XiaoHan (índice 11)
   0, // Fev  → LiChun  (índice 0)
   1, // Mar  → JingZhe (índice 1)
   2, // Abr  → QingMing(índice 2)
   3, // Mai  → LiXia   (índice 3)
   4, // Jun  → MangZhong(índice 4)
   5, // Jul  → XiaoShu (índice 5)
   6, // Ago  → LiQiu   (índice 6)
   7, // Set  → BaiLu   (índice 7)
   8, // Out  → HanLu   (índice 8)
   9, // Nov  → LiDong  (índice 9)
  10, // Dez  → DaXue   (índice 10)
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o pilar do mês usando bissecção numérica do jieqi.adapter.js.
 *
 * Determina em qual par de termos solares consecutivos o JD de nascimento
 * está contido, e retorna o pilar do mês BaZi correspondente.
 *
 * ALGORITMO:
 *   1. Estima o mês BaZi candidato a partir do mês gregoriano.
 *   2. Calcula o JD do Jié atual e do próximo.
 *   3. Se jd >= jdAtual → pilar do mês atual.
 *      Se jd <  jdAtual → pilar do mês anterior (recua 1 mês).
 *
 * @param {number} jd                  - JD do nascimento (Tempo Solar ou civil)
 * @param {number} year                - Ano gregoriano do nascimento
 * @param {number} month               - Mês gregoriano do nascimento (1–12)
 * @param {boolean} southernHemisphere - Flag hemisfério Sul (repassado ao BAZILAR)
 * @returns {import('../../interfaces.d.ts').Pillar}
 */
function _monthPilJieqiV2(jd, year, month, southernHemisphere) {
  // Candidato inicial: mês BaZi correspondente ao mês gregoriano
  let mes0 = MES_GREG_TO_MES0[month];
  // Para janeiro (mes0=11), o termo solar pertence ao ano anterior
  let anoTermo = (month === 1) ? year - 1 : year;

  // Calcula JD do Jié candidato
  let termoAtual = getTermoSolar(anoTermo, mes0);

  if (!termoAtual || termoAtual.erro) {
    // Fallback: usa monthPil legado do BAZILAR se o adapter falhar
    console.warn('[bazi-engine] BAZI_JIEQI_V2: getTermoSolar falhou, usando fallback BAZILAR.', termoAtual?.erro);
    return monthPil(jd, southernHemisphere ?? false);
  }

  // Se o nascimento é ANTES do Jié deste mês → pertence ao mês anterior
  if (jd < termoAtual.jd) {
    mes0 = (mes0 - 1 + 12) % 12;
    // Se recuamos de janeiro para dezembro, o ano do termo recua também
    if (mes0 === 10) anoTermo = anoTermo - 1; // DaXue é dezembro do ano anterior
    termoAtual = getTermoSolar(anoTermo, mes0);

    if (!termoAtual || termoAtual.erro) {
      console.warn('[bazi-engine] BAZI_JIEQI_V2: getTermoSolar (mês anterior) falhou, usando fallback.', termoAtual?.erro);
      return monthPil(jd, southernHemisphere ?? false);
    }
  }

  // Com o JD correto do início do mês BaZi, delega o pilar ao BAZILAR
  // usando o JD do Jié como referência de tempo para monthPil
  return monthPil(termoAtual.jd + 0.001, southernHemisphere ?? false);
}

// ─────────────────────────────────────────────────────────────────────────────
// API PÚBLICA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula os Quatro Pilares (四柱) a partir dos dados de nascimento.
 *
 * MODO LEGACY (FLAGS.BAZI_SOLAR_V2 === 0 E FLAGS.BAZI_JIEQI_V2 === 0):
 *   Comportamento idêntico ao mock anterior. JD calculado via hora civil.
 *   monthPil via tabela estática do BAZILAR.
 *
 * MODO SOLAR_V2 (FLAGS.BAZI_SOLAR_V2 === 1):
 *   Requer birth.longitude e birth.timezone.
 *   Se presentes: usa Tempo Solar Aparente (Spencer 1971) para hourPil e dayPil.
 *   Se ausentes: fallback para hora civil com aviso no console.
 *
 * MODO JIEQI_V2 (FLAGS.BAZI_JIEQI_V2 === 1):
 *   monthPil determinado por bissecção numérica dos termos solares (jieqi.adapter).
 *   Compatível com BAZI_SOLAR_V2=0 ou 1 (usa o JD já corrigido para monthPil).
 *
 * @param {import('../../interfaces.d.ts').BirthInput} birth
 * @returns {import('../../interfaces.d.ts').FourPillars}
 */
export function computeFourPillars(birth) {
  const minute = birth.minute ?? 0;
  const second = birth.second ?? 0;
  const hourDecimal = birth.hour + minute / 60;

  // ── MODO LEGACY (FLAGS todos = 0) ─────────────────────────────────────────
  if (FLAGS.BAZI_SOLAR_V2 === 0 && FLAGS.BAZI_JIEQI_V2 === 0) {
    const jd     = toJD(birth.year, birth.month, birth.day, hourDecimal);
    // @fix BUG-1: dayPil exige JD exato ao meio-dia (toJD com h=12 → inteiro .0).
    // Passar a hora real do nascimento produzia JD fracionado → idx%10 e idx%12
    // retornavam floats → si/bi inválidos → cascata de NaN e TypeError em toda
    // função que usa HIDDEN[bi] (calcDayMasterStrength, hourPil, findInteractions).
    // @sprint S1·W2 · @bug BLOQUEADOR · owner JS Engineer S1
    const jdNoon = toJD(birth.year, birth.month, birth.day, 12);
    const pilDay = dayPil(jdNoon);
    return {
      year:  yearPil(jd),
      month: monthPil(jd, birth.southernHemisphere ?? false),
      day:   pilDay,
      hour:  hourPil(hourDecimal, pilDay.si),
      jd,
    };
  }

  // ── CÁLCULO DO JD BASE (civil) ─────────────────────────────────────────────
  // Usado como referência e como fallback em qualquer modo
  const jdCivil = toJD(birth.year, birth.month, birth.day, hourDecimal);

  // ── MODO BAZI_SOLAR_V2 = 1 ────────────────────────────────────────────────
  let jd          = jdCivil;
  let hourForPil  = hourDecimal;  // hora usada para hourPil
  // @fix BUG-1 (caminho não-legacy): dayPil exige JD noon (inteiro .0).
  // jdCivil tem fração de hora → HIDDEN[float]=undefined → TypeError forEach.
  // Quando SOLAR_V2=1 e AST disponível, jdForDay será sobrescrito com jdAst
  // (que pode cruzar meia-noite — esse caso é tratado pelo solarTime adapter).
  // @sprint S1·W2 · @bug BLOQUEADOR
  let jdForDay    = toJD(birth.year, birth.month, birth.day, 12);

  if (FLAGS.BAZI_SOLAR_V2 === 1) {
    const temLongitude = birth.longitude != null && birth.timezone != null;

    if (!temLongitude) {
      // Fallback documentado: sem longitude/timezone, usa hora civil
      console.warn(
        '[bazi-engine] BAZI_SOLAR_V2=1 requer birth.longitude e birth.timezone. ' +
        'Fallback para hora civil.'
      );
    } else {
      const solar = calcularTempoSolarReal(
        birth.year, birth.month, birth.day,
        birth.hour, minute, second,
        birth.longitude, birth.timezone,
      );

      if (!solar || solar.erro) {
        console.warn('[bazi-engine] BAZI_SOLAR_V2=1: calcularTempoSolarReal falhou.', solar?.erro);
        // Mantém jdCivil e hourDecimal como fallback
      } else {
        // Tempo Solar Aparente em horas decimais
        hourForPil = solar.ast;
        // JD calculado com AST — pode cruzar meia-noite (diaDesloc ±1)
        jdForDay   = solar.jdAst;
        // JD principal do retorno é o AST
        jd         = solar.jdAst;
      }
    }
  }

  // ── PILAR DO ANO E DO DIA ─────────────────────────────────────────────────
  const pilYear = yearPil(jd);
  const pilDay  = dayPil(jdForDay);

  // ── PILAR DO MÊS ─────────────────────────────────────────────────────────
  // BAZI_JIEQI_V2=1 → bissecção numérica; caso contrário, BAZILAR estático
  const pilMonth = (FLAGS.BAZI_JIEQI_V2 === 1)
    ? _monthPilJieqiV2(jd, birth.year, birth.month, birth.southernHemisphere)
    : monthPil(jd, birth.southernHemisphere ?? false);

  // ── PILAR DA HORA ─────────────────────────────────────────────────────────
  const pilHour = hourPil(hourForPil, pilDay.si);

  return {
    year:  pilYear,
    month: pilMonth,
    day:   pilDay,
    hour:  pilHour,
    jd,
  };
}

/**
 * Calcula os Grandes Ciclos (大運 Dà Yùn).
 *
 * Proxy direto sobre calcLuckPillars do BAZILAR — sem alteração de assinatura.
 *
 * @param {import('../../interfaces.d.ts').FourPillars} fourPillars - Resultado de computeFourPillars()
 * @param {{ year: number, month: number, day: number }} birthDate
 * @param {'M'|'F'} gender
 * @returns {import('../../interfaces.d.ts').LuckPillar[]}
 */
export function computeLuckPillars(fourPillars, birthDate, gender) {
  return calcLuckPillars(
    fourPillars.jd,
    fourPillars.year.si,
    fourPillars.month.si,
    fourPillars.month.bi,
    gender,
    birthDate.year,
  );
}

/**
 * Detecta interações entre ramos (合, 沖, 害, 刑).
 *
 * Proxy direto sobre findInteractions do BAZILAR — sem alteração de assinatura.
 *
 * @param {number[]} branches - Índices de ramos (0–11)
 * @returns {import('../../interfaces.d.ts').Interaction[]}
 */
export function detectInteractions(branches) {
  return findInteractions(branches);
}
