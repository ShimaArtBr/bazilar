/**
 * pillars.js — Quatro Pilares, Dez Deuses, Força do DM,
 *              Balanço dos 5 Elementos, Interações entre Ramos, Da Yun
 * CONFIDENCIAL — não referenciar em nenhum arquivo sob public/
 */
'use strict';

const { toJD, fromJD, termJD, sunLon, calcRST } = require('./astronomy');
const {
  ST, EB, MT, CG, MBS, YMS, DHS, TG,
  EL_IDX, EL_NAME, SEASONAL_FACTOR,
  SIX_HARMONIES, THREE_HARMONIES,
  SIX_CLASHES, PENALTIES, HARMS, DESTRUCTIONS,
  TWELVE_PHASES, GROWTH_START,
} = require('../data/chinese');

function mod(n, m) { return ((n % m) + m) % m; }

// ─────────────────────────────────────────────
// DEZ DEUSES
// ─────────────────────────────────────────────
function tenGod(dm, o) {
  if (dm < 0 || o < 0) return null;
  const de = Math.floor(dm / 2);
  const oe = Math.floor(o  / 2);
  const sp = dm % 2 === o % 2;
  const g  = (de + 1) % 5;
  const gm = (de + 4) % 5;
  const c  = (de + 3) % 5;
  const cm = (de + 2) % 5;
  if (oe === de) return TG[sp ? 'ss' : 'sd'];
  if (oe === g)  return TG[sp ? 'os' : 'od'];
  if (oe === gm) return TG[sp ? 'is' : 'id'];
  if (oe === c)  return TG[sp ? 'cs' : 'cd'];
  if (oe === cm) return TG[sp ? 'ks' : 'kd'];
  return null;
}

// ─────────────────────────────────────────────
// HASTES OCULTAS com Ten Gods
// ─────────────────────────────────────────────
function hiddenStems(branch, dm) {
  return CG[branch].map(({ s, w }) => ({
    stemIndex: s,
    stem:      ST[s],
    weight:    w,
    tenGod:    tenGod(dm, s),
  }));
}

// ─────────────────────────────────────────────
// PILARES
// ─────────────────────────────────────────────
function yearPillar(jd) {
  let y = fromJD(jd).year;
  if (jd < termJD(315, y)) y--;
  return { stem: mod(y - 4, 10), branch: mod(y - 4, 12), baziYear: y };
}

function monthPillar(jd) {
  const y = fromJD(jd).year;
  let termIndex = -1;
  outer: for (let yr = y; yr >= y - 1; yr--) {
    for (let i = 11; i >= 0; i--) {
      if (jd >= termJD(MT[i].l, yr)) { termIndex = i; break outer; }
    }
  }
  if (termIndex < 0) termIndex = 0;
  const branch   = MBS[termIndex];
  const yearStem = yearPillar(jd).stem;
  const stem     = mod(YMS[yearStem] + termIndex, 10);
  return { stem, branch, termIndex, termName: MT[termIndex].n,
           termLon: MT[termIndex].l, season: MT[termIndex].season };
}

function dayPillar(jd) {
  const cycleIndex = mod(Math.round(jd) - 2451545 + 54, 60);
  return { stem: cycleIndex % 10, branch: cycleIndex % 12, cycleIndex };
}

function hourPillar(rstHour, dayStem) {
  const branch = Math.floor(((rstHour + 1) % 24) / 2);
  const stem   = mod(DHS[dayStem] + branch, 10);
  return { stem, branch };
}

// ─────────────────────────────────────────────
// DOZE FASES DE CRESCIMENTO
// ─────────────────────────────────────────────
function growthPhase(stemIdx, branchIdx) {
  // Normaliza para Yang (divide por 2, arredonda abaixo)
  const yangStem = stemIdx % 2 === 0 ? stemIdx : stemIdx - 1;
  const start    = GROWTH_START[yangStem];
  if (start === undefined) return null;
  // Yang avança, Yin recua
  const yang = stemIdx % 2 === 0;
  let phase;
  if (yang) {
    phase = mod(branchIdx - start, 12);
  } else {
    phase = mod(start - branchIdx, 12);
  }
  return { index: phase, name: TWELVE_PHASES[phase] };
}

// ─────────────────────────────────────────────
// FORÇA DO MESTRE DO DIA (旺衰) — método clássico
// ─────────────────────────────────────────────
/**
 * Retorna { score, pct, label }
 * score: pontuação bruta de apoio
 * pct:   percentual de apoio (0–100)
 * label: 'Strong' | 'Neutral' | 'Weak'
 */
function dayMasterStrength(dm, branches, stems, monthSeason) {
  const dmEl = Math.floor(dm / 2);  // elemento do DM (0–4)

  // Elemento que gera o DM (Resource) e o próprio DM (Peer)
  // Geração: Wood→Fire→Earth→Metal→Water→Wood
  const resourceEl = (dmEl + 4) % 5;   // elemento que gera dmEl

  let support = 0;
  let total   = 0;

  // ── Troncos explícitos (pesos por posição)
  const trunkWeights = [
    { s: dm,      w: 3 },   // Mestre do Dia em si
    { s: stems.month, w: 2 },
    { s: stems.hour,  w: 2 },
    { s: stems.year,  w: 1 },
  ];
  for (const { s, w } of trunkWeights) {
    const el = Math.floor(s / 2);
    const sf = SEASONAL_FACTOR[monthSeason][el];
    const weighted = w * sf;
    total += weighted;
    if (el === dmEl || el === resourceEl) support += weighted;
  }

  // ── Hastes ocultas (peso proporcional ao percentual)
  for (const br of branches) {
    for (const { s, w } of CG[br]) {
      const el  = Math.floor(s / 2);
      const sf  = SEASONAL_FACTOR[monthSeason][el];
      const weighted = (w / 100) * 0.5 * sf;
      total   += weighted;
      if (el === dmEl || el === resourceEl) support += weighted;
    }
  }

  const pct = total > 0 ? (support / total) * 100 : 0;
  const label = pct >= 55 ? 'Strong' : pct >= 42 ? 'Neutral' : 'Weak';

  return { score: +support.toFixed(3), pct: +pct.toFixed(1), label };
}

// ─────────────────────────────────────────────
// BALANÇO DOS 5 ELEMENTOS
// ─────────────────────────────────────────────
/**
 * Retorna array[5] com força de cada elemento (Wood/Fire/Earth/Metal/Water)
 * Inclui troncos + hastes ocultas ponderadas + fatores sazonais
 */
function elementBalance(stems, branches, monthSeason) {
  const scores = [0, 0, 0, 0, 0];

  // Troncos explícitos — pesos por posição
  const trunkWeights = [
    { s: stems.year,  w: 1 },
    { s: stems.month, w: 2 },
    { s: stems.day,   w: 3 },
    { s: stems.hour,  w: 2 },
  ];
  for (const { s, w } of trunkWeights) {
    const el = Math.floor(s / 2);
    scores[el] += w * SEASONAL_FACTOR[monthSeason][el];
  }

  // Hastes ocultas
  for (const br of branches) {
    for (const { s, w } of CG[br]) {
      const el = Math.floor(s / 2);
      scores[el] += (w / 100) * 0.5 * SEASONAL_FACTOR[monthSeason][el];
    }
  }

  const total = scores.reduce((a, b) => a + b, 0);
  return EL_NAME.map((name, i) => ({
    element: name,
    score:   +scores[i].toFixed(3),
    pct:     total > 0 ? +(scores[i] / total * 100).toFixed(1) : 0,
  }));
}

// ─────────────────────────────────────────────
// INTERAÇÕES ENTRE RAMOS
// ─────────────────────────────────────────────
function branchInteractions(branchArr) {
  const result = {
    harmonies:     [],
    threeHarmonies:[],
    clashes:       [],
    penalties:     [],
    harms:         [],
    destructions:  [],
  };

  const has = (b) => branchArr.includes(b);

  // Seis Harmonias (六合)
  for (const h of SIX_HARMONIES) {
    if (has(h.pair[0]) && has(h.pair[1]))
      result.harmonies.push({ name: h.n, result: h.result });
  }

  // Três Harmonias (三合)
  for (const h of THREE_HARMONIES) {
    const present = h.set.filter(b => has(b));
    if (present.length >= 2)
      result.threeHarmonies.push({
        name: h.n, result: h.result,
        complete: present.length === 3,
        present: present.map(b => EB[b].zh),
      });
  }

  // Seis Choques (六冲)
  for (const c of SIX_CLASHES) {
    if (has(c.pair[0]) && has(c.pair[1]))
      result.clashes.push({ name: c.n, severity: c.severity });
  }

  // Penalidades (刑)
  for (const p of PENALTIES) {
    if (p.set) {
      const cnt = p.set.filter(b => has(b)).length;
      if (cnt >= 2) result.penalties.push({ name: p.n, type: p.type, complete: cnt === p.set.length });
    } else if (p.pair) {
      if (branchArr.filter(b => b === p.pair[0]).length >= 2)
        result.penalties.push({ name: p.n, type: p.type, complete: true });
    }
  }

  // Danos (害)
  for (const h of HARMS) {
    if (has(h.pair[0]) && has(h.pair[1]))
      result.harms.push({ name: h.n });
  }

  // Destruições (破)
  for (const d of DESTRUCTIONS) {
    if (has(d.pair[0]) && has(d.pair[1]))
      result.destructions.push({ name: d.n });
  }

  return result;
}

// ─────────────────────────────────────────────
// DA YUN (大運)
// ─────────────────────────────────────────────
function calcDaYun(jd, monthP, yearP, birthYear, gender, dm) {
  const yearStemYang = yearP.stem % 2 === 0;
  const forward = (gender === 'M' && yearStemYang) || (gender === 'F' && !yearStemYang);
  const dir = forward ? 1 : -1;

  const y = fromJD(jd).year;
  let closestJD = null, minDist = 1e9;
  for (let yr = y - 1; yr <= y + 1; yr++) {
    for (let i = 0; i < 12; i++) {
      const tj   = termJD(MT[i].l, yr);
      const diff = (tj - jd) * dir;
      if (diff > 0.001 && diff < minDist) { minDist = diff; closestJD = tj; }
    }
  }

  const ageDays  = Math.abs(closestJD - jd);
  const startAge = Math.max(1, Math.round(ageDays / 3));

  // Índice do mês no ciclo de 60
  let mIdx60 = -1;
  for (let j = 0; j < 60; j++) {
    if (j % 10 === monthP.stem && j % 12 === monthP.branch) { mIdx60 = j; break; }
  }

  const currentAge = new Date().getFullYear() - birthYear;
  const pillars = [];
  for (let k = 0; k < 8; k++) {
    const idx    = mod(mIdx60 + (k + 1) * dir, 60);
    const stem   = idx % 10;
    const branch = idx % 12;
    const age    = startAge + k * 10;
    pillars.push({
      stem, branch,
      stemData:    ST[stem],
      branchData:  EB[branch],
      tenGod:      tenGod(dm, stem),
      hiddenStems: hiddenStems(branch, dm),
      growthPhase: growthPhase(stem, branch),
      age, endAge: age + 9,
      current: currentAge >= age && currentAge < age + 10,
    });
  }
  return { forward, startAge, pillars };
}

// ─────────────────────────────────────────────
// TERMOS SOLARES DO ANO
// ─────────────────────────────────────────────
function solarTermsYear(y, jd) {
  return MT.map((mt, idx) => {
    const tj   = termJD(mt.l, y);
    const date = fromJD(tj);
    return {
      index: idx, name: mt.n, pinyin: mt.py, lon: mt.l, jd: tj,
      date: { year: date.year, month: date.month, day: Math.floor(date.day) },
      past: jd >= tj,
    };
  });
}

// ─────────────────────────────────────────────
// PONTO DE ENTRADA PRINCIPAL
// ─────────────────────────────────────────────
function calculate(input) {
  const { year, month, day, hour, minute, longitude, latitude, timezone, dst, gender } = input;

  const jd    = toJD(year, month, day, 12);
  const yearP  = yearPillar(jd);
  const monthP = monthPillar(jd);
  const dayP   = dayPillar(jd);
  const rst    = calcRST(year, month, day, hour, minute, longitude, timezone, dst);
  const rstH   = rst.h + rst.m / 60;
  const hourP  = hourPillar(rstH, dayP.stem);

  const dm = dayP.stem;

  // Ramos e troncos para cálculos sistêmicos
  const allBranches = [yearP.branch, monthP.branch, dayP.branch, hourP.branch];
  const allStems    = { year: yearP.stem, month: monthP.stem, day: dayP.stem, hour: hourP.stem };

  // Força do DM
  const dmStrength = dayMasterStrength(
    dm, allBranches, allStems, monthP.season
  );

  // Balanço dos 5 Elementos
  const balance = elementBalance(allStems, allBranches, monthP.season);

  // Interações entre ramos
  const interactions = branchInteractions(allBranches);

  // Ten Gods por pilar
  const tgYear  = tenGod(dm, yearP.stem);
  const tgMonth = tenGod(dm, monthP.stem);
  const tgHour  = tenGod(dm, hourP.stem);

  // Da Yun
  const daYun = calcDaYun(jd, monthP, yearP, year, gender, dm);

  return {
    input: { year, month, day, hour, minute, longitude, latitude, timezone, dst, gender },
    julianDay:    jd,
    sunLongitude: sunLon(jd),

    dayMaster: {
      stemIndex: dm,
      stem:      ST[dm],
      strength:  dmStrength,
    },

    pillars: {
      year: {
        stem: yearP.stem, branch: yearP.branch,
        stemData: ST[yearP.stem], branchData: EB[yearP.branch],
        tenGodStem: tgYear,
        hiddenStems: hiddenStems(yearP.branch, dm),
        growthPhase: growthPhase(yearP.stem, yearP.branch),
        baziYear: yearP.baziYear,
      },
      month: {
        stem: monthP.stem, branch: monthP.branch,
        stemData: ST[monthP.stem], branchData: EB[monthP.branch],
        tenGodStem: tgMonth,
        hiddenStems: hiddenStems(monthP.branch, dm),
        growthPhase: growthPhase(monthP.stem, monthP.branch),
        termIndex: monthP.termIndex, termName: monthP.termName,
        termLon: monthP.termLon, season: monthP.season,
      },
      day: {
        stem: dayP.stem, branch: dayP.branch,
        stemData: ST[dayP.stem], branchData: EB[dayP.branch],
        tenGod: null,
        hiddenStems: hiddenStems(dayP.branch, dm),
        growthPhase: growthPhase(dayP.stem, dayP.branch),
        cycleIndex: dayP.cycleIndex,
      },
      hour: {
        stem: hourP.stem, branch: hourP.branch,
        stemData: ST[hourP.stem], branchData: EB[hourP.branch],
        tenGodStem: tgHour,
        hiddenStems: hiddenStems(hourP.branch, dm),
        growthPhase: growthPhase(hourP.stem, hourP.branch),
      },
    },

    rst: { h: rst.h, m: rst.m, lc: rst.lc, eot: rst.e, dst: rst.dc, corr: rst.corr },

    elementBalance: balance,
    dayMasterStrength: dmStrength,
    branchInteractions: interactions,
    daYun,
    solarTerms: solarTermsYear(year, jd),
  };
}

module.exports = {
  calculate, tenGod, hiddenStems, growthPhase,
  dayMasterStrength, elementBalance, branchInteractions,
  yearPillar, monthPillar, dayPillar, hourPillar,
};
