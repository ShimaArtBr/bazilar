/**
 * pillars.js — Quatro Pilares, Dez Deuses, Da Yun
 *
 * CONFIDENCIAL — não referenciar em nenhum arquivo sob public/
 * Depende de astronomy.js e data/chinese.js
 */

'use strict';

const { toJD, fromJD, termJD, sunLon } = require('./astronomy');
const { ST, EB, MT, MBS, YMS, DHS, TG, CG } = require('../data/chinese');

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

/** Mod positivo — evita negativos em restos de ciclos. */
function mod(n, m) { return ((n % m) + m) % m; }

// ─────────────────────────────────────────────
// DEZ DEUSES (十神)
// ─────────────────────────────────────────────

/**
 * Retorna o Ten God de um tronco `o` em relação ao Mestre do Dia `dm`.
 * Retorna null se dm ou o forem inválidos.
 * @param {number} dm - índice do tronco do Mestre do Dia (0–9)
 * @param {number} o  - índice do tronco a classificar (0–9)
 * @returns {object|null} entrada de TG
 */
function tenGod(dm, o) {
  if (dm < 0 || o < 0) return null;
  const de  = Math.floor(dm / 2);   // elemento do DM (0–4)
  const oe  = Math.floor(o  / 2);   // elemento do outro (0–4)
  const sp  = dm % 2 === o % 2;     // mesma polaridade?
  const g   = (de + 1) % 5;         // elemento gerado (Output)
  const gm  = (de + 4) % 5;         // elemento que gera (Resource)
  const c   = (de + 3) % 5;         // elemento controlado (Wealth)
  const cm  = (de + 2) % 5;         // elemento que controla (Power)
  if (oe === de) return TG[sp ? 'ss' : 'sd'];
  if (oe === g)  return TG[sp ? 'os' : 'od'];
  if (oe === gm) return TG[sp ? 'is' : 'id'];
  if (oe === c)  return TG[sp ? 'cs' : 'cd'];
  if (oe === cm) return TG[sp ? 'ks' : 'kd'];
  return null;
}

// ─────────────────────────────────────────────
// PILAR DO ANO (年柱)
// ─────────────────────────────────────────────

/**
 * Calcula o Pilar do Ano.
 * O ano BaZi muda em 立春 (lon 315°), não em 1 Jan nem em Ano Novo Lunar.
 * @param {number} jd
 * @returns {{ stem, branch, baziYear }}
 */
function yearPillar(jd) {
  let y = fromJD(jd).year;
  // Se ainda não passou 立春 deste ano, usa o ano anterior
  if (jd < termJD(315, y)) y--;
  return {
    stem:      mod(y - 4, 10),
    branch:    mod(y - 4, 12),
    baziYear:  y,
  };
}

// ─────────────────────────────────────────────
// PILAR DO MÊS (月柱)
// ─────────────────────────────────────────────

/**
 * Calcula o Pilar do Mês.
 * Determinado pelo último Jié (節) antes do JD.
 * @param {number} jd
 * @returns {{ stem, branch, termIndex, termName, termLon }}
 */
function monthPillar(jd) {
  const y = fromJD(jd).year;
  let termIndex = -1;

  // Busca o último termo passado (até ano anterior para Jan/Fev)
  outer: for (let yr = y; yr >= y - 1; yr--) {
    for (let i = 11; i >= 0; i--) {
      if (jd >= termJD(MT[i].l, yr)) {
        termIndex = i;
        break outer;
      }
    }
  }
  if (termIndex < 0) termIndex = 0;

  const branch   = MBS[termIndex];
  const yearStem = yearPillar(jd).stem;
  const stem     = mod(YMS[yearStem] + termIndex, 10);

  return {
    stem,
    branch,
    termIndex,
    termName: MT[termIndex].n,
    termLon:  MT[termIndex].l,
  };
}

// ─────────────────────────────────────────────
// PILAR DO DIA (日柱)
// ─────────────────────────────────────────────

/**
 * Calcula o Pilar do Dia.
 * Referência verificada: 戊午 (idx 54) = JD 2451545 (1 Jan 2000 meio-dia).
 * @param {number} jd
 * @returns {{ stem, branch, cycleIndex }}
 */
function dayPillar(jd) {
  const cycleIndex = mod(Math.round(jd) - 2451545 + 54, 60);
  return {
    stem:       cycleIndex % 10,
    branch:     cycleIndex % 12,
    cycleIndex,
  };
}

// ─────────────────────────────────────────────
// PILAR DA HORA (时柱)
// ─────────────────────────────────────────────

/**
 * Calcula o Pilar da Hora a partir do TSR (Tempo Solar Real).
 * Cada ramo da hora cobre 2 horas; 子 começa às 23:00 do dia anterior.
 * @param {number} rstHour  - hora decimal do TSR (0–24)
 * @param {number} dayStem  - índice do tronco do Pilar do Dia
 * @returns {{ stem, branch }}
 */
function hourPillar(rstHour, dayStem) {
  const branch = Math.floor(((rstHour + 1) % 24) / 2);
  const stem   = mod(DHS[dayStem] + branch, 10);
  return { stem, branch };
}

// ─────────────────────────────────────────────
// HASTES OCULTAS — enriquece com Ten Gods
// ─────────────────────────────────────────────

/**
 * Retorna as hastes ocultas de um ramo com Ten God calculado.
 * @param {number} branch  - índice do ramo (0–11)
 * @param {number} dm      - tronco do Mestre do Dia
 * @returns {Array<{ stemIndex, stem, tenGod }>}
 */
function hiddenStems(branch, dm) {
  return CG[branch].map(({ s }) => ({
    stemIndex: s,
    stem:      ST[s],
    tenGod:    tenGod(dm, s),
  }));
}

// ─────────────────────────────────────────────
// DA YUN (大運) — Pilares de Sorte
// ─────────────────────────────────────────────

/**
 * Calcula os 8 Pilares de Sorte.
 *
 * Regra: homem em ano Yang e mulher em ano Yin → progressivo (forward).
 * Distância ao próximo/anterior Jié em dias → ÷ 3 = idade de início.
 *
 * @param {number}  jd         - JD do nascimento
 * @param {object}  monthP     - Pilar do Mês (com stem, branch, termIndex)
 * @param {object}  yearP      - Pilar do Ano (com stem)
 * @param {number}  birthYear  - ano gregoriano de nascimento
 * @param {string}  gender     - 'M' ou 'F'
 * @param {number}  dm         - tronco do Mestre do Dia
 * @returns {{ forward, startAge, pillars }}
 */
function calcDaYun(jd, monthP, yearP, birthYear, gender, dm) {
  const yearStemYang = yearP.stem % 2 === 0;
  const forward = (gender === 'M' && yearStemYang) || (gender === 'F' && !yearStemYang);
  const dir = forward ? 1 : -1;

  // Busca o Jié mais próximo na direção correta
  const y = fromJD(jd).year;
  let closestJD = null;
  let minDist = 1e9;

  for (let yr = y - 1; yr <= y + 1; yr++) {
    for (let i = 0; i < 12; i++) {
      const tjd  = termJD(MT[i].l, yr);
      const diff = (tjd - jd) * dir;
      if (diff > 0.001 && diff < minDist) {
        minDist    = diff;
        closestJD  = tjd;
      }
    }
  }

  const ageDays  = Math.abs(closestJD - jd);
  const startAge = Math.max(1, Math.round(ageDays / 3));

  // Índice do Pilar do Mês no ciclo de 60
  let mIdx60 = -1;
  for (let j = 0; j < 60; j++) {
    if (j % 10 === monthP.stem && j % 12 === monthP.branch) {
      mIdx60 = j;
      break;
    }
  }

  const currentAge = new Date().getFullYear() - birthYear;
  const pillars = [];

  for (let k = 0; k < 8; k++) {
    const idx    = mod(mIdx60 + (k + 1) * dir, 60);
    const stem   = idx % 10;
    const branch = idx % 12;
    const age    = startAge + k * 10;
    pillars.push({
      stem,
      branch,
      stemData:   ST[stem],
      branchData: EB[branch],
      tenGod:     tenGod(dm, stem),
      hiddenStems: hiddenStems(branch, dm),
      age,
      endAge:  age + 9,
      current: currentAge >= age && currentAge < age + 10,
    });
  }

  return { forward, startAge, pillars };
}

// ─────────────────────────────────────────────
// TERMOS SOLARES DO ANO — para visualização
// ─────────────────────────────────────────────

/**
 * Lista todos os 12 Termos Solares de um ano com suas datas e status.
 * @param {number} y   - ano
 * @param {number} jd  - JD do nascimento (para marcar passado/atual)
 * @returns {Array}
 */
function solarTermsYear(y, jd) {
  return MT.map((mt, idx) => {
    const tj   = termJD(mt.l, y);
    const date = fromJD(tj);
    return {
      index:  idx,
      name:   mt.n,
      pinyin: mt.py,
      lon:    mt.l,
      jd:     tj,
      date:   { year: date.year, month: date.month, day: Math.floor(date.day) },
      past:   jd >= tj,
    };
  });
}

// ─────────────────────────────────────────────
// PONTO DE ENTRADA — calcula tudo de uma vez
// ─────────────────────────────────────────────

/**
 * Calcula os Quatro Pilares completos + Da Yun + Termos Solares.
 *
 * @param {object} input
 * @param {number}  input.year
 * @param {number}  input.month
 * @param {number}  input.day
 * @param {number}  input.hour
 * @param {number}  input.minute
 * @param {number}  input.longitude
 * @param {number}  input.latitude   (não usado no cálculo, devolvido no output)
 * @param {number}  input.timezone
 * @param {boolean} input.dst
 * @param {string}  input.gender     'M' | 'F'
 * @returns {object} resultado completo
 */
function calculate(input) {
  const { year, month, day, hour, minute,
          longitude, latitude, timezone, dst, gender } = input;

  // JD ao meio-dia (para pilares de Ano/Mês/Dia — hora não importa aqui)
  const jd  = toJD(year, month, day, 12);

  // Pilares
  const yearP  = yearPillar(jd);
  const monthP = monthPillar(jd);
  const dayP   = dayPillar(jd);

  // RST para o Pilar da Hora
  const { calcRST } = require('./astronomy');
  const rst  = calcRST(year, month, day, hour, minute, longitude, timezone, dst);
  const rstH = rst.h + rst.m / 60;
  const hourP = hourPillar(rstH, dayP.stem);

  const dm = dayP.stem;   // Mestre do Dia

  // Ten Gods (pilares principais)
  const tgYear  = tenGod(dm, yearP.stem);
  const tgMonth = tenGod(dm, monthP.stem);
  const tgHour  = tenGod(dm, hourP.stem);

  // Da Yun
  const daYun = calcDaYun(jd, monthP, yearP, year, gender, dm);

  // Termos Solares do ano de nascimento
  const terms = solarTermsYear(year, jd);

  return {
    input: { year, month, day, hour, minute, longitude, latitude, timezone, dst, gender },

    julianDay:    jd,
    sunLongitude: sunLon(jd),

    dayMaster: {
      stemIndex: dm,
      stem:      ST[dm],
    },

    pillars: {
      year: {
        stem:        yearP.stem,
        branch:      yearP.branch,
        stemData:    ST[yearP.stem],
        branchData:  EB[yearP.branch],
        tenGod:      null,   // Mestre do Dia não tem Ten God próprio
        hiddenStems: hiddenStems(yearP.branch, dm),
        baziYear:    yearP.baziYear,
        tenGodStem:  tgYear,
      },
      month: {
        stem:        monthP.stem,
        branch:      monthP.branch,
        stemData:    ST[monthP.stem],
        branchData:  EB[monthP.branch],
        tenGodStem:  tgMonth,
        hiddenStems: hiddenStems(monthP.branch, dm),
        termIndex:   monthP.termIndex,
        termName:    monthP.termName,
        termLon:     monthP.termLon,
      },
      day: {
        stem:        dayP.stem,
        branch:      dayP.branch,
        stemData:    ST[dayP.stem],
        branchData:  EB[dayP.branch],
        tenGod:      null,   // é o próprio Mestre do Dia
        hiddenStems: hiddenStems(dayP.branch, dm),
        cycleIndex:  dayP.cycleIndex,
      },
      hour: {
        stem:        hourP.stem,
        branch:      hourP.branch,
        stemData:    ST[hourP.stem],
        branchData:  EB[hourP.branch],
        tenGodStem:  tgHour,
        hiddenStems: hiddenStems(hourP.branch, dm),
      },
    },

    rst: {
      h:    rst.h,
      m:    rst.m,
      lc:   rst.lc,
      eot:  rst.e,
      dst:  rst.dc,
      corr: rst.corr,
    },

    daYun,
    solarTerms: terms,
  };
}

module.exports = { calculate, tenGod, hiddenStems, yearPillar, monthPillar, dayPillar, hourPillar };
