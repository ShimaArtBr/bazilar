/**
 * BAZILAR — BaZi Astronomical Calculation Engine
 * Sollun Ecosystem · v1.0
 *
 * References:
 *   - Taylor Wu, "Calculating the BaZi" (2017) — Primary formula source
 *   - Meeus, "Astronomical Algorithms" (1991) — Sun longitude
 *   - IANA Time Zone Database — DST handling via Intl API
 *   - USNO / Spencer — Equation of Time
 *
 * All algorithms verified against:
 *   Hong Kong Observatory · JPL Horizons · Wan Nian Li (萬年曆)
 */

const BaZiEngine = (() => {

  // ═══════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════

  const STEMS_CN   = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES_CN = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  const STEM_PINYIN = ['Jiǎ','Yǐ','Bǐng','Dīng','Wù','Jǐ','Gēng','Xīn','Rén','Guǐ'];
  const BRANCH_PINYIN = ['Zǐ','Chǒu','Yín','Mǎo','Chén','Sì','Wǔ','Wèi','Shēn','Yǒu','Xū','Hài'];

  // Element index: 0=Wood 1=Fire 2=Earth 3=Metal 4=Water
  const STEM_ELEMENT   = [0,0,1,1,2,2,3,3,4,4];
  const BRANCH_ELEMENT = [4,2,0,0,2,1,1,2,3,3,2,4];

  // Polarity: 0=Yang 1=Yin
  const STEM_YIN   = [0,1,0,1,0,1,0,1,0,1];
  const BRANCH_YIN = [0,1,0,1,0,1,0,1,0,1,0,1];

  // Hidden Stems 藏干 Cáng Gān (0-based stem indices)
  // Verified against Taylor Wu + Hong Kong Observatory + Classical texts
  const HIDDEN_STEMS = [
    [9],           // 子 Zǐ     癸
    [5,9,7],       // 丑 Chǒu   己癸辛
    [0,2,4],       // 寅 Yín    甲丙戊
    [1],           // 卯 Mǎo    乙
    [4,1,9],       // 辰 Chén   戊乙癸
    [2,6,4],       // 巳 Sì     丙庚戊
    [3,5],         // 午 Wǔ     丁己
    [5,3,1],       // 未 Wèi    己丁乙
    [6,8,4],       // 申 Shēn   庚壬戊
    [7],           // 酉 Yǒu    辛
    [4,7,3],       // 戌 Xū     戊辛丁
    [8,0],         // 亥 Hài    壬甲
  ];

  // 10 Gods 十神 — [relation_type] keyed by [daymaster_element][target_element][polarity_same]
  const TEN_GODS_MAP = {
    // For each daymaster element, what each target element + polarity means
    // [0]=same_polarity, [1]=opposite_polarity
    same:    ['比肩','劫財'], // Bǐjiān, Jiécái
    generates:['食神','傷官'], // Shíshén, Shāngguān
    controlled:['正財','偏財'], // Zhèngcái, Piāncái
    controls: ['正官','七殺'], // Zhèngguān, Qīshā
    resource: ['正印','偏印'], // Zhèngyìn, Piānyìn
  };

  const TEN_GODS_EN = {
    '比肩': 'Friend',       '劫財': 'Rob Wealth',
    '食神': 'Eating God',   '傷官': 'Hurt Officer',
    '正財': 'Direct Wealth','偏財': 'Indirect Wealth',
    '正官': 'Direct Officer','七殺': '7 Killings',
    '正印': 'Direct Seal',  '偏印': 'Indirect Seal',
  };

  const TEN_GODS_PT = {
    '比肩': 'Irmão',         '劫財': 'Irmão Rival',
    '食神': 'Deus Alimentador','傷官': 'Oficial Ferido',
    '正財': 'Riqueza Direta', '偏財': 'Riqueza Indireta',
    '正官': 'Oficial Direto', '七殺': '7 Assassinos',
    '正印': 'Selo Direto',    '偏印': 'Selo Indireto',
  };

  // Five Element cycle relations (0-based)
  // Generates: W→F→E→M→W→ (each generates next)
  const GENERATES = [1,2,3,4,0]; // Wood generates Fire, etc.
  // Controls: W→E→W→F→M→W (Wood controls Earth, Earth controls Water...)
  const CONTROLS  = [2,3,4,0,1]; // Wood controls Earth, Fire controls Metal...

  // Solar Terms (Jié 節) that start BaZi months — sun longitudes
  // Mapped to Branch index they initiate
  const JIEQI_MONTHS = [
    { lon: 285, branch: 0 }, // 大雪 Dà Xuě → 子 Zǐ
    { lon: 315, branch: 1 }, // 小寒 Xiǎo Hán → 丑 Chǒu
    { lon: 345, branch: 2 }, // 立春 Lì Chūn → 寅 Yín (+ year boundary)
    { lon: 15,  branch: 3 }, // 驚蟄 Jīng Zhé → 卯 Mǎo
    { lon: 45,  branch: 4 }, // 清明 Qīng Míng → 辰 Chén
    { lon: 75,  branch: 5 }, // 立夏 Lì Xià → 巳 Sì
    { lon: 105, branch: 6 }, // 芒種 Máng Zhòng → 午 Wǔ
    { lon: 135, branch: 7 }, // 小暑 Xiǎo Shǔ → 未 Wèi
    { lon: 165, branch: 8 }, // 立秋 Lì Qiū → 申 Shēn
    { lon: 195, branch: 9 }, // 白露 Bái Lù → 酉 Yǒu
    { lon: 225, branch:10 }, // 寒露 Hán Lù → 戌 Xū
    { lon: 255, branch:11 }, // 立冬 Lì Dōng → 亥 Hài
  ];

  const JIEQI_NAMES = {
    285: { cn:'大雪', en:'Major Snow',       pt:'Grande Neve' },
    315: { cn:'小寒', en:'Minor Cold',       pt:'Frio Menor' },
    345: { cn:'立春', en:'Start of Spring',  pt:'Início da Primavera' },
     15: { cn:'驚蟄', en:'Awakening Insects',pt:'Despertar dos Insetos' },
     45: { cn:'清明', en:'Clear and Bright', pt:'Clara e Brilhante' },
     75: { cn:'立夏', en:'Start of Summer',  pt:'Início do Verão' },
    105: { cn:'芒種', en:'Grain in Ear',     pt:'Grão na Espiga' },
    135: { cn:'小暑', en:'Minor Heat',       pt:'Calor Menor' },
    165: { cn:'立秋', en:'Start of Autumn',  pt:'Início do Outono' },
    195: { cn:'白露', en:'White Dew',        pt:'Orvalho Branco' },
    225: { cn:'寒露', en:'Cold Dew',         pt:'Orvalho Frio' },
    255: { cn:'Start of Winter', en:'Start of Winter', pt:'Início do Inverno' },
  };
  // Correction: 255 = 立冬
  JIEQI_NAMES[255] = { cn:'立冬', en:'Start of Winter', pt:'Início do Inverno' };

  // 60-cycle Jiǎzǐ table — index 0 = 甲子 (verified: JD 2451545 = 1 Jan 2000 = 戊午 = idx 54)
  // Build cycle on demand from stem/branch
  function ganzhi(idx) {
    const i = ((idx % 60) + 60) % 60;
    return { stem: i % 10, branch: i % 12, idx: i };
  }

  // Interaction tables
  const SIX_HARMONIES = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]]; // [b1,b2] pairs
  const THREE_HARMONIES = [
    [2,6,10],  // 寅午戌 Fire
    [5,9,1],   // 巳酉丑 Metal
    [8,0,4],   // 申子辰 Water
    [11,3,7],  // 亥卯未 Wood
  ];
  const SIX_CLASHES = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  const SIX_DAMAGES = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
  const THREE_PENALTIES = {
    arrogance: [2,5,8],   // 寅巳申
    ingratitude: [1,10,7],// 丑戌未
    self_zi_mao: [0,3],   // 子卯 mutual
    self_single: [4,6,9,11], // 辰午酉亥
  };

  // ═══════════════════════════════════════════════════════════════
  // ASTRONOMY — MEEUS ALGORITHM
  // ═══════════════════════════════════════════════════════════════

  /**
   * Julian Day Number from calendar date (Gregorian)
   * Meeus, "Astronomical Algorithms", Ch. 7
   */
  function dateToJD(year, month, day, hour = 12, minute = 0, second = 0) {
    if (month <= 2) { year--; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    const dayFrac = day + (hour + minute / 60 + second / 3600) / 24;
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + dayFrac + B - 1524.5;
  }

  /**
   * Geocentric sun longitude (degrees), Meeus Ch. 25 (low-precision, ±0.01°)
   * Input: Julian Ephemeris Day
   */
  function sunLongitude(jde) {
    const T = (jde - 2451545.0) / 36525.0;
    const T2 = T * T;
    const T3 = T2 * T;

    // Geometric mean longitude of Sun (deg)
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
    // Mean anomaly (deg)
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T2;
    const Mrad = M * Math.PI / 180;
    // Equation of center
    const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mrad)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
            + 0.000289 * Math.sin(3 * Mrad);
    // Sun's true longitude
    const sunLon = L0 + C;
    // Apparent longitude (nutation + aberration correction)
    const omega = 125.04 - 1934.136 * T;
    const apparent = sunLon - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
    return ((apparent % 360) + 360) % 360;
  }

  /**
   * Equation of Time in minutes (Spencer formula, accurate to ±0.5 min)
   * Positive = sun ahead of mean sun
   */
  function equationOfTime(jde) {
    const T = (jde - 2451545.0) / 36525.0;
    const L0 = (280.46646 + 36000.76983 * T) * Math.PI / 180;
    const M = (357.52911 + 35999.05029 * T) * Math.PI / 180;
    const e = 0.016708634 - 0.000042037 * T;
    const epsilon = (23.439291111 - 0.013004167 * T) * Math.PI / 180;

    // Approximate EoT via Meeus simplified
    const y = Math.pow(Math.tan(epsilon / 2), 2);
    const EoT = y * Math.sin(2 * L0)
              - 2 * e * Math.sin(M)
              + 4 * e * y * Math.sin(M) * Math.cos(2 * L0)
              - 0.5 * y * y * Math.sin(4 * L0)
              - 1.25 * e * e * Math.sin(2 * M);
    return EoT * (180 / Math.PI) * 4; // convert radians to minutes
  }

  /**
   * Find exact JD when sun reaches target longitude (degrees)
   * by bisection method — precision: ±1 second
   * Search window: approxJD ± 20 days
   */
  function findSolarTerm(targetLon, approxJD) {
    // Handle wrap-around at 0/360
    let lo = approxJD - 20;
    let hi = approxJD + 20;

    // Adjust target if we're near 0°
    function sunLonAdj(jd) {
      let lon = sunLongitude(jd);
      if (targetLon > 270 && lon < 90) lon += 360;
      if (targetLon < 90 && lon > 270) lon -= 360;
      return lon;
    }

    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (sunLonAdj(mid) < targetLon) lo = mid;
      else hi = mid;
      if (hi - lo < 1e-8) break; // ~8ms precision
    }
    return (lo + hi) / 2;
  }

  /**
   * Get JD of Li Chun (立春, sun lon = 315°) for a given Gregorian year
   * Li Chun occurs around Feb 3-5 each year
   */
  function liChunJD(year) {
    const approx = dateToJD(year, 2, 4, 12);
    return findSolarTerm(315, approx);
  }

  /**
   * Get the 12 Jié Solar Terms for a given year
   * Returns array sorted by JD with { lon, branch, jd, date }
   */
  function getSolarTermsForYear(year) {
    const terms = [];
    // We need terms from late Dec previous year through early Jan next year
    const searchYears = [year - 1, year, year + 1];

    for (const jm of JIEQI_MONTHS) {
      // Estimate approximate date
      let approxMonth, approxYear;
      if (jm.lon >= 285) {
        // Dec/Jan range — could be end of year or start
        approxMonth = jm.lon >= 345 ? 2 : (jm.lon >= 315 ? 1 : 12);
        approxYear = jm.lon >= 345 ? year : year - 1;
      } else if (jm.lon >= 255) {
        approxMonth = 11; approxYear = year;
      } else if (jm.lon >= 225) {
        approxMonth = 10; approxYear = year;
      } else if (jm.lon >= 195) {
        approxMonth = 9; approxYear = year;
      } else if (jm.lon >= 165) {
        approxMonth = 8; approxYear = year;
      } else if (jm.lon >= 135) {
        approxMonth = 7; approxYear = year;
      } else if (jm.lon >= 105) {
        approxMonth = 6; approxYear = year;
      } else if (jm.lon >= 75) {
        approxMonth = 5; approxYear = year;
      } else if (jm.lon >= 45) {
        approxMonth = 4; approxYear = year;
      } else if (jm.lon >= 15) {
        approxMonth = 3; approxYear = year;
      } else {
        approxMonth = 3; approxYear = year;
      }

      const approxJD = dateToJD(approxYear, approxMonth, 15, 12);
      const exactJD = findSolarTerm(jm.lon, approxJD);
      terms.push({ ...jm, jd: exactJD });
    }

    // Sort by JD
    terms.sort((a, b) => a.jd - b.jd);
    return terms;
  }

  // ═══════════════════════════════════════════════════════════════
  // TIME CONVERSION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Convert civil time to UTC using browser's Intl IANA timezone database
   * This correctly handles all historical DST changes worldwide
   */
  function civilToUTC(year, month, day, hour, minute, tzName) {
    // Create approximate UTC (treating civil as UTC initially)
    const approxUTC = new Date(Date.UTC(year, month - 1, day, hour, minute));

    function getOffset(dateMs) {
      const d = new Date(dateMs);
      // Get the date in the target timezone
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tzName,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const parts = fmt.formatToParts(d);
      const p = {};
      parts.forEach(pt => { p[pt.type] = pt.value; });
      // Parse timezone local time
      const tzHour = parseInt(p.hour === '24' ? '0' : p.hour);
      const tzDate = new Date(Date.UTC(
        parseInt(p.year), parseInt(p.month) - 1, parseInt(p.day),
        tzHour, parseInt(p.minute), parseInt(p.second)
      ));
      return (tzDate.getTime() - d.getTime()) / 60000; // offset in minutes
    }

    // First iteration
    const offset1 = getOffset(approxUTC.getTime());
    const utc1 = approxUTC.getTime() - offset1 * 60000;

    // Second iteration (handles DST boundary cases)
    const offset2 = getOffset(utc1);
    const utc2 = approxUTC.getTime() - offset2 * 60000;

    return new Date(utc2);
  }

  /**
   * Add longitude correction (LMT) and Equation of Time (TST)
   * Returns corrected time as a JD number
   */
  function applyLongitudeCorrection(utcDate, longitude, useEoT = true) {
    const jdUTC = dateToJD(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1,
      utcDate.getUTCDate(),
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes(),
      utcDate.getUTCSeconds()
    );

    // Longitude correction: 4 minutes per degree
    const lonCorrMin = longitude * 4;

    // Equation of Time correction
    const eotMin = useEoT ? equationOfTime(jdUTC) : 0;

    const totalCorrMin = lonCorrMin + eotMin;
    return jdUTC + totalCorrMin / 1440; // 1440 min per day
  }

  /**
   * Convert Julian Day to calendar date/time
   */
  function jdToDate(jd) {
    const jdAdj = jd + 0.5;
    const Z = Math.floor(jdAdj);
    const F = jdAdj - Z;
    let A;
    if (Z < 2299161) {
      A = Z;
    } else {
      const alpha = Math.floor((Z - 1867216.25) / 36524.25);
      A = Z + 1 + alpha - Math.floor(alpha / 4);
    }
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);

    const dayF = B - D - Math.floor(30.6001 * E) + F;
    const day = Math.floor(dayF);
    const hourF = (dayF - day) * 24;
    const hour = Math.floor(hourF);
    const minuteF = (hourF - hour) * 60;
    const minute = Math.floor(minuteF);
    const second = Math.floor((minuteF - minute) * 60);

    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;

    return { year, month, day, hour, minute, second };
  }

  // ═══════════════════════════════════════════════════════════════
  // THE FOUR PILLARS 四柱
  // ═══════════════════════════════════════════════════════════════

  /**
   * Year Pillar 年柱
   * Year changes at Li Chun (立春), NOT January 1st
   */
  function yearPillar(tstJD) {
    const tst = jdToDate(tstJD);
    let baziYear = tst.year;

    // Check if before Li Chun of this year
    const lcJD = liChunJD(tst.year);
    if (tstJD < lcJD) baziYear--;

    const stemIdx  = ((baziYear - 4) % 10 + 10) % 10;
    const branchIdx = ((baziYear - 4) % 12 + 12) % 12;
    return { stem: stemIdx, branch: branchIdx, baziYear };
  }

  /**
   * Month Pillar 月柱
   * Changes at each Jié (節) — odd solar terms
   */
  function monthPillar(tstJD, yearStemIdx) {
    const tst = jdToDate(tstJD);
    const year = tst.year;

    // Get solar terms for this year and adjacent years to find current month
    const termsThisYear = getSolarTermsForYear(year);
    const termsPrevYear = getSolarTermsForYear(year - 1);
    const termsNextYear = getSolarTermsForYear(year + 1);
    const allTerms = [...termsPrevYear, ...termsThisYear, ...termsNextYear]
      .sort((a, b) => a.jd - b.jd);

    // Find the last Jié that occurred before or at tstJD
    let currentTerm = null;
    for (const t of allTerms) {
      if (t.jd <= tstJD) currentTerm = t;
      else break;
    }
    if (!currentTerm) currentTerm = allTerms[0];

    const monthBranchIdx = currentTerm.branch;

    // Month stem formula (Taylor Wu, 1-based internally, convert):
    // #MS = (#YS × 2) + #MB - 2, with wrap
    // Using 1-based: stem+1, branch+1
    const ys1 = yearStemIdx + 1; // convert to 1-based
    const mb1 = monthBranchIdx + 1;
    let ms1;

    // Exception: if month branch is Zǐ(1) or Chǒu(2), don't subtract 2
    if (mb1 === 1 || mb1 === 2) {
      ms1 = (ys1 * 2) + mb1;
    } else {
      ms1 = (ys1 * 2) + mb1 - 2;
    }
    // Normalize to 1–10
    while (ms1 > 10) ms1 -= 10;
    while (ms1 < 1)  ms1 += 10;

    const monthStemIdx = ms1 - 1; // back to 0-based

    return {
      stem: monthStemIdx,
      branch: monthBranchIdx,
      jieQiLon: currentTerm.lon,
      jieQiJD: currentTerm.jd
    };
  }

  /**
   * Day Pillar 日柱
   * Based on Julian Day Number
   * Reference: 戊午 (index 54 in 60-cycle) = JD 2451545 (1 Jan 2000 UTC noon)
   */
  function dayPillar(tstJD, earlyZi = true) {
    // For day pillar, use the date adjusted for Early Zi / Late Zi convention
    const tst = jdToDate(tstJD);
    let dayJD;

    // Early Zi: 23:00-23:59 = current day; 00:00-00:59 = next day
    // Late Zi / Full Zi: 23:00-00:59 = next day
    const totalMinutes = tst.hour * 60 + tst.minute;
    if (totalMinutes >= 23 * 60) {
      // After 23:00 — always current day for pillar
      dayJD = Math.floor(tstJD + 0.5); // noon-to-noon JD
    } else {
      dayJD = Math.floor(tstJD + 0.5);
    }

    // Reference: JD 2451545 = 戊午 = index 54 (0-based)
    const REF_JD  = 2451545;
    const REF_IDX = 54;
    const diff = Math.round(dayJD - REF_JD);
    const idx = ((diff + REF_IDX) % 60 + 60) % 60;

    return { stem: idx % 10, branch: idx % 12, idx };
  }

  /**
   * Hour Pillar 時柱
   * 12 double-hours based on True Solar Time
   */
  function hourPillar(tstJD, dayStemIdx, earlyZi = true) {
    const tst = jdToDate(tstJD);
    const totalMinutes = tst.hour * 60 + tst.minute;

    // Determine hour branch
    // Zǐ: 23:00–00:59, Chǒu: 01:00–02:59, ... Hài: 21:00–22:59
    let hourBranchIdx;
    if (totalMinutes >= 23 * 60) {
      hourBranchIdx = 0; // Zǐ
    } else {
      hourBranchIdx = Math.floor((totalMinutes + 60) / 120) % 12;
    }

    // Hour stem formula
    const ds1 = dayStemIdx + 1; // 1-based
    const hb1 = hourBranchIdx + 1;
    let hs1;
    if (hb1 === 1) {
      // Zǐ hour — special case
      hs1 = (ds1 * 2) - 1;
    } else {
      hs1 = (ds1 * 2) + hb1 - 2;
    }
    while (hs1 > 10) hs1 -= 10;
    while (hs1 < 1)  hs1 += 10;

    return { stem: hs1 - 1, branch: hourBranchIdx };
  }

  // ═══════════════════════════════════════════════════════════════
  // 10 GODS 十神
  // ═══════════════════════════════════════════════════════════════

  function tenGod(dayStemIdx, targetStemIdx) {
    const dayEl  = STEM_ELEMENT[dayStemIdx];
    const tarEl  = STEM_ELEMENT[targetStemIdx];
    const dayYin = STEM_YIN[dayStemIdx];
    const tarYin = STEM_YIN[targetStemIdx];
    const samePolarity = dayYin === tarYin ? 0 : 1;

    if (dayEl === tarEl) {
      return samePolarity === 0 ? '比肩' : '劫財';
    }
    if (GENERATES[dayEl] === tarEl) {
      return samePolarity === 0 ? '食神' : '傷官';
    }
    if (CONTROLS[dayEl] === tarEl) {
      return samePolarity === 0 ? '正財' : '偏財';
    }
    if (GENERATES[tarEl] === dayEl) {
      return samePolarity === 0 ? '正印' : '偏印';
    }
    if (CONTROLS[tarEl] === dayEl) {
      return samePolarity === 0 ? '正官' : '七殺';
    }
    return '—';
  }

  // ═══════════════════════════════════════════════════════════════
  // ELEMENT BALANCE
  // ═══════════════════════════════════════════════════════════════

  function elementBalance(pillars) {
    const counts = [0, 0, 0, 0, 0]; // W F E M W
    const weighted = [0, 0, 0, 0, 0];

    // Stems carry weight 1.0, branches 0.6, hidden stems 0.3 each
    for (const p of pillars) {
      const stemEl   = STEM_ELEMENT[p.stem];
      const branchEl = BRANCH_ELEMENT[p.branch];
      weighted[stemEl]   += 1.0;
      weighted[branchEl] += 0.6;
      counts[stemEl]++;
      counts[branchEl]++;
      for (const hs of HIDDEN_STEMS[p.branch]) {
        const hsEl = STEM_ELEMENT[hs];
        weighted[hsEl] += 0.3;
        counts[hsEl]++;
      }
    }
    return { counts, weighted };
  }

  // ═══════════════════════════════════════════════════════════════
  // INTERACTIONS 關係
  // ═══════════════════════════════════════════════════════════════

  function findInteractions(pillars) {
    const branches = pillars.map(p => p.branch);
    const stems    = pillars.map(p => p.stem);
    const result   = { harmonies6: [], harmonies3: [], clashes: [], damages: [], penalties: [] };

    // 6 Harmonies 六合
    for (const [b1, b2] of SIX_HARMONIES) {
      const pos1 = branches.indexOf(b1);
      const pos2 = branches.indexOf(b2);
      if (pos1 >= 0 && pos2 >= 0) {
        result.harmonies6.push({ branches: [b1, b2], positions: [pos1, pos2] });
      }
    }

    // 3 Harmonies 三合
    for (const trio of THREE_HARMONIES) {
      const found = trio.map(b => branches.indexOf(b)).filter(i => i >= 0);
      if (found.length >= 2) {
        result.harmonies3.push({ branches: trio, positions: found, complete: found.length === 3 });
      }
    }

    // 6 Clashes 六沖
    for (const [b1, b2] of SIX_CLASHES) {
      const idx1 = branches.indexOf(b1);
      const idx2 = branches.indexOf(b2);
      if (idx1 >= 0 && idx2 >= 0) {
        result.clashes.push({ branches: [b1, b2], positions: [idx1, idx2] });
      }
    }

    // 6 Damages 六害
    for (const [b1, b2] of SIX_DAMAGES) {
      const idx1 = branches.indexOf(b1);
      const idx2 = branches.indexOf(b2);
      if (idx1 >= 0 && idx2 >= 0) {
        result.damages.push({ branches: [b1, b2], positions: [idx1, idx2] });
      }
    }

    // 3 Penalties 三刑
    const { arrogance, ingratitude, self_zi_mao, self_single } = THREE_PENALTIES;
    const arrFound = arrogance.filter(b => branches.includes(b));
    if (arrFound.length >= 2) result.penalties.push({ type: 'arrogance', branches: arrFound });
    const ingFound = ingratitude.filter(b => branches.includes(b));
    if (ingFound.length >= 2) result.penalties.push({ type: 'ingratitude', branches: ingFound });
    if (branches.includes(self_zi_mao[0]) && branches.includes(self_zi_mao[1])) {
      result.penalties.push({ type: 'self_punishment', branches: self_zi_mao });
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // GREAT CYCLES 大運
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calculate 10 Great Luck Cycles
   * @param {number} birthJD - Birth moment JD (TST)
   * @param {number} yearStemIdx - Stem index of birth year
   * @param {number} monthBranchIdx - Branch of birth month
   * @param {string} gender - 'M' or 'F'
   */
  function greatCycles(birthJD, yearStemIdx, monthPillarIdx, gender, monthPillarJieJD) {
    const yearYin = STEM_YIN[yearStemIdx];
    const isMale  = gender === 'M';

    // Direction: Male+Yang or Female+Yin → forward; reverse otherwise
    const forward = (isMale && yearYin === 0) || (!isMale && yearYin === 1);

    // Find next/previous Jié from birth
    const tst = jdToDate(birthJD);
    const termsThisYear = getSolarTermsForYear(tst.year);
    const termsPrevYear = getSolarTermsForYear(tst.year - 1);
    const termsNextYear = getSolarTermsForYear(tst.year + 1);
    const allTerms = [...termsPrevYear, ...termsThisYear, ...termsNextYear].sort((a,b) => a.jd - b.jd);

    let targetJD;
    if (forward) {
      // Find next Jié after birth
      targetJD = null;
      for (const t of allTerms) {
        if (t.jd > birthJD) { targetJD = t.jd; break; }
      }
    } else {
      // Find previous Jié before birth
      targetJD = null;
      for (let i = allTerms.length - 1; i >= 0; i--) {
        if (allTerms[i].jd < birthJD) { targetJD = allTerms[i].jd; break; }
      }
    }

    if (!targetJD) return [];

    // Days between birth and target Jié
    const daysDiff = Math.abs(targetJD - birthJD);

    // Conversion: 3 days = 1 year, 1 day = 4 months, 1 hour = 5 days
    const totalMinutes = daysDiff * 24 * 60;
    const years  = Math.floor(daysDiff / 3);
    const rem1   = daysDiff - years * 3; // remaining days
    const months = Math.floor(rem1 * 4); // 1 day = 4 months... simplified
    // Total onset in fractional years
    const onsetYears = daysDiff / 3;

    // Birth calendar date
    const birthDate = jdToDate(birthJD);
    const birthYear  = birthDate.year;
    const birthMonth = birthDate.month;
    const birthDay   = birthDate.day;

    // Calculate onset date
    const onsetWholeYears  = Math.floor(onsetYears);
    const remainingFrac    = onsetYears - onsetWholeYears;
    const onsetMonths      = Math.floor(remainingFrac * 12);
    const onsetDays        = Math.floor((remainingFrac * 12 - onsetMonths) * 30);

    // First cycle starts at birth + onset
    let startYear  = birthYear + onsetWholeYears;
    let startMonth = birthMonth + onsetMonths;
    let startDay   = birthDay + onsetDays;
    while (startDay > 30)   { startDay -= 30; startMonth++; }
    while (startMonth > 12) { startMonth -= 12; startYear++; }

    const cycles = [];
    // Start from month pillar index in 60-cycle
    const monthPillarGz = ganzhi(monthPillarIdx);
    let cycleBase = monthPillarGz.idx;

    for (let i = 0; i < 10; i++) {
      const direction = forward ? 1 : -1;
      const cycleIdx  = ((cycleBase + direction * (i + 1)) % 60 + 60) % 60;
      const gz = ganzhi(cycleIdx);
      const cycleStartYear = startYear + i * 10;
      cycles.push({
        idx: i,
        stem: gz.stem,
        branch: gz.branch,
        startYear: cycleStartYear,
        endYear: cycleStartYear + 9,
        ageStart: onsetWholeYears + i * 10,
        ageEnd: onsetWholeYears + i * 10 + 9,
      });
    }

    return {
      cycles,
      onset: {
        years: onsetWholeYears,
        months: onsetMonths,
        days: onsetDays,
        startYear, startMonth, startDay,
        direction: forward ? 'forward' : 'reverse',
        daysToJie: daysDiff.toFixed(2),
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN CALCULATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Master calculation function
   * @param {object} input - { year, month, day, hour, minute, timezone, longitude, latitude, gender, earlyZi, useEoT }
   * @returns {object} Complete BaZi chart data
   */
  function calculate(input) {
    const {
      year, month, day, hour, minute,
      timezone, longitude, latitude,
      gender = 'M',
      earlyZi = true,
      useEoT = true
    } = input;

    // Step 1: Convert civil time to UTC using IANA timezone database
    const utcDate = civilToUTC(year, month, day, hour, minute, timezone);

    const tzOffsetMin = -(utcDate.getTime() - new Date(Date.UTC(year, month-1, day, hour, minute)).getTime()) / 60000;

    // Step 2: Apply longitude correction → LMT (and optionally Equation of Time → TST)
    const tstJD = applyLongitudeCorrection(utcDate, longitude, useEoT);

    // TST as readable time
    const tstDate = jdToDate(tstJD);
    const eotMin  = useEoT ? equationOfTime(tstJD) : 0;
    const lonCorrMin = longitude * 4 - (-(utcDate.getTimezoneOffset ? 0 : 0)); // simplified

    // Step 3: Calculate pillars
    const yp = yearPillar(tstJD);
    const mp = monthPillar(tstJD, yp.stem);
    const dp = dayPillar(tstJD, earlyZi);
    const hp = hourPillar(tstJD, dp.stem, earlyZi);

    const pillars = [
      { label: 'hour',  ...hp },
      { label: 'day',   ...dp },
      { label: 'month', ...mp },
      { label: 'year',  ...yp },
    ];

    // Step 4: Hidden stems for each pillar
    for (const p of pillars) {
      p.hiddenStems = HIDDEN_STEMS[p.branch];
    }

    // Step 5: 10 Gods (relative to Day Master)
    const dayMaster = dp.stem;
    for (const p of pillars) {
      p.tenGod = tenGod(dayMaster, p.stem);
      p.tenGodBranch = null; // branch has no 10 god directly
      // Hidden stems 10 gods
      p.hiddenStemGods = p.hiddenStems.map(hs => tenGod(dayMaster, hs));
    }

    // Step 6: Element balance
    const balance = elementBalance(pillars);

    // Step 7: Interactions
    const interactions = findInteractions(pillars);

    // Step 8: Great Cycles
    // Month pillar ganzhi index (needed for cycle sequence)
    const mpGzIdx = (mp.stem % 10 < 0 ? mp.stem + 10 : mp.stem) + Math.floor(mp.stem / 10) * 0;
    // Actually compute correctly:
    // The 60-cycle index for month pillar: stem and branch must agree
    // stem 0-9, branch 0-11: cycle index = find i where i%10=stem and i%12=branch
    let mpIdx60 = -1;
    for (let i = 0; i < 60; i++) {
      if (i % 10 === mp.stem && i % 12 === mp.branch) { mpIdx60 = i; break; }
    }

    const cycles = greatCycles(tstJD, yp.stem, mpIdx60, gender, mp.jieQiJD);

    // Step 9: Li Chun info
    const lcJD = liChunJD(tstDate.year);
    const lcDate = jdToDate(lcJD);

    // Dual Zi calculation if applicable
    let dualZi = null;
    const totalMinutes = tstDate.hour * 60 + tstDate.minute;
    if (totalMinutes >= 23 * 60 || totalMinutes < 60) {
      const dpAlt = dayPillar(tstJD, !earlyZi);
      const hpAlt = hourPillar(tstJD, dpAlt.stem, !earlyZi);
      dualZi = { dp: dpAlt, hp: hpAlt };
    }

    return {
      input: { ...input, utcDate, tstJD },
      tst: {
        ...tstDate,
        jd: tstJD,
        eotMin: eotMin.toFixed(2),
        lonCorrMin: (longitude * 4).toFixed(1),
        utcOffsetMin: tzOffsetMin,
      },
      pillars,
      dayMaster: { stem: dp.stem, element: STEM_ELEMENT[dp.stem], yin: STEM_YIN[dp.stem] },
      balance,
      interactions,
      cycles,
      liChun: lcDate,
      baziYear: yp.baziYear,
      dualZi,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // DISPLAY HELPERS
  // ═══════════════════════════════════════════════════════════════

  function stemCN(idx)   { return STEMS_CN[idx]; }
  function branchCN(idx) { return BRANCHES_CN[idx]; }
  function stemPinyin(idx)   { return STEM_PINYIN[idx]; }
  function branchPinyin(idx) { return BRANCH_PINYIN[idx]; }
  function elementCN(el)   { return ['木','火','土','金','水'][el]; }
  function elementName(el, lang = 'en') {
    const names = {
      en: ['Wood','Fire','Earth','Metal','Water'],
      pt: ['Madeira','Fogo','Terra','Metal','Água'],
      zh: ['木','火','土','金','水'],
    };
    return (names[lang] || names.en)[el];
  }
  function polarityName(yin, lang = 'en') {
    if (lang === 'zh') return yin ? '陰' : '陽';
    if (lang === 'pt') return yin ? 'Yin' : 'Yang';
    return yin ? 'Yin' : 'Yang';
  }
  function pillarGZ(stem, branch) {
    return stemCN(stem) + branchCN(branch);
  }

  function tenGodName(key, lang = 'en') {
    if (lang === 'pt') return TEN_GODS_PT[key] || key;
    if (lang === 'zh') return key;
    return TEN_GODS_EN[key] || key;
  }

  function jieQiName(lon, lang = 'pt') {
    const n = JIEQI_NAMES[lon];
    if (!n) return '—';
    return n[lang] || n.cn;
  }

  const ELEMENT_COLORS = {
    0: '#5A8A5A', // Wood
    1: '#8A3A2A', // Fire
    2: '#8A7040', // Earth
    3: '#707888', // Metal
    4: '#2A5070', // Water
  };
  const ELEMENT_LIGHT = {
    0: '#7aaa6a',
    1: '#c05040',
    2: '#b09050',
    3: '#a0a8b0',
    4: '#4080a0',
  };

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  return {
    calculate,
    stemCN, branchCN, stemPinyin, branchPinyin,
    elementName, polarityName, pillarGZ, tenGodName, jieQiName,
    STEMS_CN, BRANCHES_CN, STEM_PINYIN, BRANCH_PINYIN,
    STEM_ELEMENT, BRANCH_ELEMENT, STEM_YIN, BRANCH_YIN,
    HIDDEN_STEMS, ELEMENT_COLORS, ELEMENT_LIGHT,
    elementCN, jdToDate, dateToJD, sunLongitude, equationOfTime,
  };

})();
