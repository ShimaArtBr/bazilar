/* ══════════════════════════════════════════════════
   BAZILAR — pillars.js
   Four Pillars, Luck Pillars, Stars, Interactions, Element Balance
══════════════════════════════════════════════════ */

import { ST, MT, MBS, YMS, DHS, HIDDEN, HARMONY6, HARMONY3, CLASH6, HARM6, PENALTY3, TIANYI, TAOHUA, YIMA, LIFE_STAGE_NAMES, LIFE_STAGE_START } from './data.js';
import { fromJD, termJD } from './engine.js';

/* ═══════ FOUR PILLARS ═══════ */

export function yearPil(jd) {
  let y = fromJD(jd).year;
  if (jd < termJD(315, y)) y--;
  return {si:((y-4)%10+10)%10, bi:((y-4)%12+12)%12, by:y};
}

export function monthPil(jd, southHemi) {
  // Find the most recent solar term (largest JD ≤ jd)
  const y = fromJD(jd).year;
  let bestMi = -1;
  let bestJD = -Infinity;
  // Check current year and previous year to cover Jan/Feb edge cases
  for (let yr = y; yr >= y-1; yr--) {
    for (let i = 0; i < 12; i++) {
      const tjd = termJD(MT[i].l, yr);
      if (tjd <= jd && tjd > bestJD) {
        bestJD = tjd;
        bestMi = i;
      }
    }
  }
  if (bestMi === -1) bestMi = 0; // safe fallback
  let bi = MBS[bestMi];
  const ys = yearPil(jd).si;
  // Southern Hemisphere seasonal inversion: shift branch +6 (180° of the zodiac wheel)
  // AND recalculate the stem using the effective (shifted) month sequence index.
  // Both bi and mi must advance together — the stem is NOT independent of the branch.
  let mi = bestMi;
  if (southHemi) {
    bi = (bi + 6) % 12;
    mi = (bestMi + 6) % 12;  // effective sequence index for stem calculation
  }
  const si = (YMS[ys] + mi) % 10;
  return {si: si, bi: bi, mi: bestMi};  // mi: bestMi preserved for log/luckPillars
}

export function dayPil(jd) {
  // jd should be toJD(y,m,d,12) — integer at noon — but floating-point drift
  // in some JS engines can yield jd=N.9999... making (jd%60) a non-integer.
  // Math.round guarantees idx is always a safe integer 0-59.
  const idx = Math.round(((jd - 2451545 + 54) % 60 + 60) % 60);
  return {si: idx % 10, bi: idx % 12, idx: idx};
}

export function hourPil(rh, ds) {
  const bi = Math.floor(((rh+1)%24)/2);
  return {si: (DHS[ds] + bi) % 10, bi: bi};
}

/* ═══════ LUCK PILLARS 大運 ═══════ */

export function calcLuckPillars(birthJD, yearStem, monthStem, monthBranch, gender, birthYear) {
  if (!gender) return null;
  const yearPo = ST[yearStem].po;
  const forward = (gender === 'M' && yearPo === 'Yang') || (gender === 'F' && yearPo === 'Yin');

  const searchYear = birthYear;
  let targetJD = null;
  if (forward) {
    for (let y2 = searchYear; y2 <= searchYear + 1; y2++) {
      for (let ti = 0; ti < 12; ti++) {
        const tjd = termJD(MT[ti].l, y2);
        if (tjd > birthJD) { targetJD = tjd; break; }
      }
      if (targetJD) break;
    }
  } else {
    // Find the most recent Jié STRICTLY BEFORE birthJD — i.e. MAX JD ≤ birthJD.
    // The MT array is NOT in calendar-chronological order (index 11 = 小寒 = Jan of
    // same calendar year, which is chronologically FIRST). Iterating in reverse index
    // order and stopping at the first hit would return Jan, not the nearest prior term.
    let bestBwd = -Infinity;
    for (let y3 = searchYear; y3 >= searchYear - 1; y3--) {
      for (let ti2 = 0; ti2 < 12; ti2++) {
        const tjd2 = termJD(MT[ti2].l, y3);
        if (tjd2 <= birthJD && tjd2 > bestBwd) bestBwd = tjd2;
      }
    }
    if (bestBwd > -Infinity) targetJD = bestBwd;
  }
  if (!targetJD) return null;

  const distDays = Math.abs(birthJD - targetJD);
  const startAge = distDays / 3;
  const startYears = Math.floor(startAge);
  const startMonths = Math.round((startAge - startYears) * 12);

  let msi = monthStem, mbi = monthBranch;
  const pillars = [];
  for (let c = 0; c < 8; c++) {
    if (forward) { msi = (msi + 1) % 10; mbi = (mbi + 1) % 12; }
    else         { msi = (msi + 9) % 10; mbi = (mbi + 11) % 12; }
    const age = startYears + c * 10;
    pillars.push({si: msi, bi: mbi, age: age, ageEnd: age + 9, startYear: birthYear + age});
  }
  return {forward: forward, startAge: startYears, startMonths: startMonths, pillars: pillars};
}

/* ═══════ SYMBOLIC STARS 神煞 ═══════ */

export function findStars(yb, db, ys, ds) {
  const stars = [];
  const tyD = TIANYI[ds], tyY = TIANYI[ys];
  if (tyD) tyD.forEach(function(b) { stars.push({name:'starTianYi', zh:'天乙', branch:b}); });
  if (tyY) tyY.forEach(function(b) {
    if (!tyD || tyD.indexOf(b) === -1) stars.push({name:'starTianYi', zh:'天乙', branch:b});
  });
  const thY = TAOHUA[yb], thD = TAOHUA[db];
  if (thY !== undefined) stars.push({name:'starTaoHua', zh:'桃花', branch:thY, source:'year'});
  if (thD !== undefined && thD !== thY) stars.push({name:'starTaoHua', zh:'桃花', branch:thD, source:'day'});
  const ymY = YIMA[yb], ymD = YIMA[db];
  if (ymY !== undefined) stars.push({name:'starYiMa', zh:'驛馬', branch:ymY, source:'year'});
  if (ymD !== undefined && ymD !== ymY) stars.push({name:'starYiMa', zh:'驛馬', branch:ymD, source:'day'});
  return stars;
}

/* ═══════ BRANCH INTERACTIONS ═══════ */

export function findInteractions(branches) {
  const r = [];
  HARMONY6.forEach(function(h) {
    if (branches.indexOf(h.a) !== -1 && branches.indexOf(h.b) !== -1)
      r.push({type:'harmony6', a:h.a, b:h.b, el:h.el});
  });
  HARMONY3.forEach(function(h) {
    let c = 0;
    h.branches.forEach(function(b) { if (branches.indexOf(b) !== -1) c++; });
    if (c >= 3) r.push({type:'harmony3', branches:h.branches, el:h.el, zh:h.zh});
  });
  CLASH6.forEach(function(c) {
    if (branches.indexOf(c[0]) !== -1 && branches.indexOf(c[1]) !== -1)
      r.push({type:'clash', a:c[0], b:c[1]});
  });
  HARM6.forEach(function(h) {
    if (branches.indexOf(h[0]) !== -1 && branches.indexOf(h[1]) !== -1)
      r.push({type:'harm', a:h[0], b:h[1]});
  });
  PENALTY3.forEach(function(p) {
    let c = 0;
    p.branches.forEach(function(b) { if (branches.indexOf(b) !== -1) c++; });
    if (c >= p.branches.length) r.push({type:'penalty', branches:p.branches, zh:p.zh});
  });
  return r;
}

/* ═══════ FIVE ELEMENTS BALANCE ═══════ */

export function elemBalance(stems, branchIdxs) {
  const ct = {Wood:0, Fire:0, Earth:0, Metal:0, Water:0};
  stems.forEach(function(si) { if (si >= 0) ct[ST[si].el]++; });
  branchIdxs.forEach(function(bi) {
    if (bi == null || !Number.isInteger(bi) || bi < 0 || bi >= HIDDEN.length) return;
    {
      const hs = HIDDEN[bi];
      if (!hs || hs[0] == null) return;
      ct[ST[hs[0]].el] += 1;
      if (hs[1] !== undefined) ct[ST[hs[1]].el] += 0.5;
      if (hs[2] !== undefined) ct[ST[hs[2]].el] += 0.3;
    }
  });
  return ct;
}

/* ═══════ DAY MASTER STRENGTH 日主強弱 ═══════
   Score each stem and hidden stem relative to the Mestre do Dia (DM).
   Relationship index  r = (stemEl − dmEl + 5) % 5 :
     0 → 比劫  same element             → +1.0  (roots DM)
     1 → 食伤  DM generates             → −0.7  (drains DM output)
     2 → 财    DM controls              → −0.6  (DM expends control)
     3 → 官杀  controls DM             → −0.9  (suppresses DM)
     4 → 印    generates DM            → +0.8  (nourishes DM)

   Weights (ZPZQ — 子平真詮):
     • Main pillar stems                    → 1.0
     • Hidden stem 本氣 (idx 0)             → 1.0
     • Hidden stem 中氣 (idx 1)             → 0.5
     • Hidden stem 余氣 (idx 2)             → 0.3
     × 十二長生 forca_score da 隱干 no ramo → multiplica o peso da hidden stem
     × peso_posicional por pilar            → Mês=1.5, Hora/Dia=1.0, Ano=0.8
     + multiplicador categórico 得令        → ×1.5 se DM em 帝旺/臨官/長生/冠帶 no 月支

   Fonte doutrinária: 子平真詮 Cap. 2-3 (論月令) + 論根氣
   Returns { score, strong, favorable:[elements], unfavorable:[elements], dmEl, deLing }
*/

const ELEMS = ['Wood','Fire','Earth','Metal','Water'];
const DM_SCORES = [1.0, -0.7, -0.6, -0.9, 0.8];

/* 十二長生 forca_score por seq (índice = seq 0–11) */
const FORCA_SCORE = [0.8, 0.3, 0.5, 0.9, 1.0, 0.4, 0.25, 0.2, 0.15, 0.1, 0.2, 0.3];

/* 得令 — estágios que conferem força no 月支 (ZPZQ Cap. 2) */
const DE_LING_SEQS = new Set([0, 2, 3, 4]); // 長生, 冠帶, 臨官, 帝旺

/* peso posicional por posição do pilar em branchIdxs [hora, dia, mês, ano] */
const PESO_POSICIONAL = [1.0, 1.0, 1.5, 0.8];

export function calcDayMasterStrength(dmStem, stems, branchIdxs, monthBranchPillarIdx) {
  const dmEl = Math.floor(dmStem / 2);
  let total = 0;

  /* ── main stems ── */
  stems.forEach(function(si) {
    if (si < 0) return;
    const el = Math.floor(si / 2);
    const r  = (el - dmEl + 5) % 5;
    total += DM_SCORES[r] * 1.0;
  });

  /* ── hidden stems per branch (ZPZQ: peso_posicional × peso_hidden × forca_score) ──
     branchIdxs order: [hour, day, month, year]
     monthBranchPillarIdx = 2 (index of month branch in branchIdxs) */
  const mbi = (monthBranchPillarIdx !== undefined) ? monthBranchPillarIdx : 2;

  /* determinar 得令: estágio do DM no 月支 */
  const monthBi = branchIdxs[mbi];
  const monthStage = (monthBi != null && Number.isInteger(monthBi) && monthBi >= 0 && monthBi < 12)
    ? getLifeStage(dmStem, monthBi)
    : null;
  const deLing = monthStage !== null && DE_LING_SEQS.has(monthStage.seq);

  const baseWeights = [1.0, 0.5, 0.3];

  branchIdxs.forEach(function(bi, pillarIdx) {
    // Guard: reject NaN, undefined, non-integer, or out-of-range bi.
    if (bi == null || !Number.isInteger(bi) || bi < 0 || bi >= HIDDEN.length) return;
    const hs = HIDDEN[bi];
    if (!hs) return;

    const pesoPos = PESO_POSICIONAL[pillarIdx] !== undefined ? PESO_POSICIONAL[pillarIdx] : 1.0;
    const stage   = getLifeStage(dmStem, bi);
    const forca   = FORCA_SCORE[stage.seq];

    hs.forEach(function(hsi, hIdx) {
      const el = Math.floor(hsi / 2);
      const r  = (el - dmEl + 5) % 5;
      const pesoHidden = baseWeights[hIdx] !== undefined ? baseWeights[hIdx] : 0.3;
      total += DM_SCORES[r] * pesoPos * pesoHidden * forca;
    });
  });

  /* multiplicador categórico 得令 (月令 — 提綱, ZPZQ Cap. 2-3) */
  if (deLing) total *= 1.5;

  const strong = total > 0;

  /* favorable elements (用神) and unfavorable (忌神) */
  const favRels   = strong ? [1, 2, 3] : [0, 4];   /* drain if strong; support if weak */
  const unfavRels = strong ? [0, 4]    : [1, 2, 3];

  const favorable   = favRels.map(function(r){ return ELEMS[(dmEl + r) % 5]; });
  const unfavorable = unfavRels.map(function(r){ return ELEMS[(dmEl + r) % 5]; });

  return {
    score:       parseFloat(total.toFixed(2)),
    strong:      strong,
    favorable:   favorable,
    unfavorable: unfavorable,
    dmEl:        ELEMS[dmEl],
    deLing:      deLing,
  };
}

/* ═══════ TWELVE LIFE STAGES 十二長生 ═══════
   Decisão C05 (2026-03-09): Escola Yang/Yin diferenciada.
   Yang stems → 順行 forward  (+1 mod 12).
   Yin  stems → 逆行 reverse  (-1 mod 12).
   Fonte: 子平真詮 (Zi Ping Zhen Quan), Shen Xiaozhan.
*/

/**
 * Retorna o estágio de vida (十二長生) de um Tronco Celestial em relação a um Ramo.
 *
 * @param {number} stemIdx   - Índice do Tronco Celestial (0=甲 … 9=癸)
 * @param {number} branchIdx - Índice do Ramo Terrestre   (0=子 … 11=亥)
 * @returns {{ seq: number, zh: string, py: string, pt: string }}
 *
 * @example
 *   getLifeStage(0, 11) // 甲 em 亥 → { seq:0, zh:'長生', py:'Cháng Shēng', pt:'Nascimento Longo' }
 *   getLifeStage(0,  0) // 甲 em 子 → { seq:1, zh:'沐浴', py:'Mù Yù',       pt:'Banho Ritual' }
 *   getLifeStage(1,  6) // 乙 em 午 → { seq:0, zh:'長生', py:'Cháng Shēng', pt:'Nascimento Longo' }
 *   getLifeStage(1,  5) // 乙 em 巳 → { seq:1, zh:'沐浴', py:'Mù Yù',       pt:'Banho Ritual' }
 */
export function getLifeStage(stemIdx, branchIdx) {
  const isYang   = stemIdx % 2 === 0;
  const start    = LIFE_STAGE_START[stemIdx];
  const distance = isYang
    ? (branchIdx - start + 12) % 12   // 順行 forward
    : (start - branchIdx + 12) % 12;  // 逆行 reverse
  return { ...LIFE_STAGE_NAMES[distance] };
}
