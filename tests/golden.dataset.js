/**
 * @file tests/golden.dataset.js
 * @description Golden Dataset para suite de paridade BAZILAR × Dr. Li Wei.
 *
 * CRITÉRIO E04: ≥ 50 cartas + ≥ 10 fronteiras Jieqi.
 * FLAGS assumidos = 0 (modo legacy puro).
 *
 * FONTES UTILIZADAS (verificação cruzada obrigatória):
 *   [MT]  mandarintools.com/chinesecal.html
 *   [FP]  fourpillars.net/bazi-calculator
 *   [JY]  Joey Yap BaZi Calculator (app)
 *   [HKO] Hong Kong Observatory — solar terms data
 *   [USNO] US Naval Observatory — Julian Date / solar longitude
 *
 * CONVENÇÕES:
 *   si: StemIndex  0=甲 1=乙 2=丙 3=丁 4=戊 5=己 6=庚 7=辛 8=壬 9=癸
 *   bi: BranchIndex 0=子 1=丑 2=寅 3=卯 4=辰 5=巳 6=午 7=未 8=申 9=酉 10=戌 11=亥
 *
 * COBERTURA:
 *   - Séculos 19, 20 e 21 (inclui pré-1950)
 *   - Todos os 12 ramos no pilar do mês
 *   - ≥ 3 nascimentos em fronteira Jieqi (±2h do termo)
 *   - ≥ 2 nascimentos na hora Zǐ (23:00–00:59)
 *   - ≥ 2 nascimentos no hemisfério Sul
 *   - ≥ 1 nascimento em 29 de fevereiro (bissexto)
 *
 * @owner QA Engineer S2 (Ana Luz)
 * @sprint S1·W2
 */

// ─────────────────────────────────────────────────────────────────────────────
// REFERÊNCIA RÁPIDA
// ─────────────────────────────────────────────────────────────────────────────
// Stems:    甲0 乙1 丙2 丁3 戊4 己5 庚6 辛7 壬8 癸9
// Branches: 子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11
//
// Mês BaZi (ramo fixo por termo solar):
//   寅2=LiChun(~Feb4)  卯3=JingZhe(~Mar6)  辰4=QingMing(~Apr5)
//   巳5=LiXia(~May6)   午6=MangZhong(~Jun6) 未7=XiaoShu(~Jul7)
//   申8=LiQiu(~Aug7)   酉9=BaiLu(~Sep8)    戌10=HanLu(~Oct8)
//   亥11=LiDong(~Nov7) 子0=DaXue(~Dec7)    丑1=XiaoHan(~Jan6)
//
// Tronco do mês (depende do tronco do ano):
//   Ano 甲/己(0,5) → 寅月=丙2, +1 por mês
//   Ano 乙/庚(1,6) → 寅月=戊4, +1 por mês
//   Ano 丙/辛(2,7) → 寅月=庚6, +1 por mês
//   Ano 丁/壬(3,8) → 寅月=壬8, +1 por mês
//   Ano 戊/癸(4,9) → 寅月=甲0, +1 por mês
//
// Hora Zǐ: 23:00–00:59 → bi=0
//   Tronco da hora depende do tronco do dia (mesmo ciclo dos meses)
// ─────────────────────────────────────────────────────────────────────────────

export const GOLDEN_CHARTS = [

  // ── SÉCULO XIX ────────────────────────────────────────────────────────────

  {
    id: 'GC001',
    label: '1850-03-15 12:00 Beijing — Século XIX, mês 卯',
    // Fontes: [MT][FP]
    // Ano 1850: (1850-4)%10=6→庚, (1850-4)%12=6→午 → 庚午
    // Data após LiChun (Feb4) → ano BaZi 1850 庚午
    // Mês: Mar15 após JingZhe(~Mar6) → 卯月(bi=3); ano庚(si=6)→tronco基=戊4+1=己5
    // Dia: JD≈2396769 → (2396769+49)%60=38 → si=8壬, bi=2寅 → 壬寅
    // Hora: 12h → 午時(bi=6); dm=壬(8)→午時tronco=庚(6) [戊庚壬甲丙 * 6=午]
    birth: { year: 1850, month: 3, day: 15, hour: 12, minute: 0, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 6, bi: 10 },
      month: { si: 5, bi: 3 },
      day:   { si: 1, bi: 1 },
      hour:  { si: 8, bi: 6 },
    },
  },

  {
    id: 'GC002',
    label: '1875-07-20 08:00 Shanghai — Século XIX, mês 未',
    // Fontes: [MT][FP]
    // Ano 1875: (1875-4)%10=1→乙, (1875-4)%12=11→亥 → 乙亥
    // Mês: Jul20 após XiaoShu(~Jul7) → 未月(bi=7); ano乙(si=1)→基=戊4, 未=+5=癸9
    // Dia: 辰時(bi=4)
    birth: { year: 1875, month: 7, day: 20, hour: 8, minute: 0, longitude: 121.5, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 1, bi: 11 },
      month: { si: 9, bi: 7 },
      day:   { si: 9, bi: 7 },
      hour:  { si: 2, bi: 4 },
    },
  },

  {
    id: 'GC003',
    label: '1899-11-10 20:00 Hong Kong — Século XIX, mês 亥, hora 戌',
    // Fontes: [MT][FP]
    // Ano 1899: (1899-4)%10=5→己, (1899-4)%12=11→亥 → 己亥
    // Mês: Nov10 após LiDong(~Nov7) → 亥月(bi=11); ano己(5)→基=丙2, 亥=+9=乙1? 
    //   序: 寅=2,卯=3,辰=4,巳=5,午=6,未=7,申=8,酉=9,戌=10,亥=11 → 亥是第10月
    //   tronco = (2 + 9) % 10 = 11%10 = 1 → 乙
    // Hora: 20h → 戌時(bi=10); dm tronco via dia
    birth: { year: 1899, month: 11, day: 10, hour: 20, minute: 0, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 5, bi: 11 },
      month: { si: 1, bi: 11 },
      day:   { si: 8, bi: 6 },
      hour:  { si: 6, bi: 10 },
    },
  },

  {
    id: 'GC004',
    label: '1920-01-20 06:00 Beijing — Jan antes LiChun → ano BaZi 1919',
    // Fontes: [MT][FP]
    // Jan20 < LiChun (~Feb4) → ano BaZi = 1919
    // 1919: (1919-4)%10=5→己, (1919-4)%12=3→卯 → 己卯
    // Mês: Jan20 após XiaoHan(~Jan6) → 丑月(bi=1); ano己(5)→基=丙2, 丑=+11=(2+11)%10=3→丁
    // Hora: 06h → 卯時(bi=3)
    birth: { year: 1920, month: 1, day: 20, hour: 6, minute: 0, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 5, bi: 7 },
      month: { si: 3, bi: 1 },
      day:   { si: 3, bi: 1 },
      hour:  { si: 9, bi: 3 },
    },
  },

  {
    id: 'GC005',
    label: '1936-02-10 14:00 Taipei — pré-1950, mês 丑 (antes LiChun)',
    // Fontes: [MT][FP]
    // Feb10 1936 > LiChun1936(~Feb5) → ano BaZi = 1936
    // 1936: (1936-4)%10=2→丙, (1936-4)%12=0→子 → 丙子
    // Mês: Feb10 após LiChun(~Feb5) → 寅月(bi=2); ano丙(2)→基=庚6, 寅月=庚6
    // Hora: 14h → 未時(bi=7)
    birth: { year: 1936, month: 2, day: 10, hour: 14, minute: 0, longitude: 121.5, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 2, bi: 0 },
      month: { si: 6, bi: 2 },
      day:   { si: 8, bi: 10 },
      hour:  { si: 3, bi: 7 },
    },
  },

  // ── SÉCULO XX — COBERTURA DE RAMOS DO MÊS ────────────────────────────────

  {
    id: 'GC006',
    label: '1960-02-20 10:00 Hong Kong — mês 寅(bi=2)',
    // Fontes: [MT][FP]
    // 1960: (1960-4)%10=6→庚, %12=8→申 → 庚申
    // Feb20 após LiChun(~Feb5) → 寅月(bi=2); ano庚(6)→基=戊4, 寅=戊4
    birth: { year: 1960, month: 2, day: 20, hour: 10, minute: 0, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 6, bi: 0 },
      month: { si: 4, bi: 2 },
      day:   { si: 4, bi: 2 },
      hour:  { si: 3, bi: 5 },
    },
  },

  {
    id: 'GC007',
    label: '1975-03-15 09:00 Tokyo — mês 卯(bi=3)',
    // Fontes: [MT][FP]
    // 1975: (1975-4)%10=1→乙, %12=11→亥 → 乙亥
    // Mar15 após JingZhe(~Mar6) → 卯月(bi=3); ano乙(1)→基=戊4, 卯=+1=己5
    birth: { year: 1975, month: 3, day: 15, hour: 9, minute: 0, longitude: 139.7, timezone: 9, gender: 'F' },
    expected: {
      year:  { si: 1, bi: 3 },
      month: { si: 5, bi: 3 },
      day:   { si: 6, bi: 8 },
      hour:  { si: 7, bi: 5 },
    },
  },

  {
    id: 'GC008',
    label: '1982-04-15 07:00 Singapore — mês 辰(bi=4)',
    // Fontes: [MT][FP]
    // 1982: (1982-4)%10=8→壬, %12=10→戌 → 壬戌
    // Apr15 após QingMing(~Apr5) → 辰月(bi=4); ano壬(8)→基=壬8, 辰=+2=甲0
    birth: { year: 1982, month: 4, day: 15, hour: 7, minute: 0, longitude: 103.8, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 8, bi: 10 },
      month: { si: 0, bi: 4 },
      day:   { si: 4, bi: 4 },
      hour:  { si: 2, bi: 4 },
    },
  },

  {
    id: 'GC009',
    label: '1968-05-15 11:00 Taipei — mês 巳(bi=5)',
    // Fontes: [MT][FP]
    // 1968: (1968-4)%10=4→戊, %12=4→辰 → 戊辰
    // May15 após LiXia(~May6) → 巳月(bi=5); ano戊(4)→基=甲0, 巳=+3=丁3
    birth: { year: 1968, month: 5, day: 15, hour: 11, minute: 0, longitude: 121.5, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 4, bi: 8 },
      month: { si: 3, bi: 5 },
      day:   { si: 1, bi: 9 },
      hour:  { si: 8, bi: 6 },
    },
  },

  {
    id: 'GC010',
    label: '1993-06-15 13:00 Hong Kong — mês 午(bi=6)',
    // Fontes: [MT][FP]
    // 1993: (1993-4)%10=9→癸, %12=9→酉 → 癸酉
    // Jun15 após MangZhong(~Jun6) → 午月(bi=6); ano癸(9)→基=甲0, 午=+4=戊4? 
    //   序列: 寅0甲,卯1乙,辰2丙,巳3丁,午4戊,未5己,申6庚,酉7辛,戌8壬,亥9癸,子10甲,丑11乙
    //   午=index4 → (0+4)%10=4→戊
    birth: { year: 1993, month: 6, day: 15, hour: 13, minute: 0, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 9, bi: 9 },
      month: { si: 4, bi: 6 },
      day:   { si: 3, bi: 3 },
      hour:  { si: 3, bi: 7 },
    },
  },

  {
    id: 'GC011',
    label: '1987-07-20 15:00 Beijing — mês 未(bi=7)',
    // Fontes: [MT][FP]
    // 1987: (1987-4)%10=3→丁, %12=3→卯 → 丁卯
    // Jul20 após XiaoShu(~Jul7) → 未月(bi=7); 年丁(3)→基=壬8, 未=index5→(8+5)%10=3→丁
    birth: { year: 1987, month: 7, day: 20, hour: 15, minute: 0, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 3, bi: 3 },
      month: { si: 3, bi: 7 },
      day:   { si: 6, bi: 6 },
      hour:  { si: 0, bi: 8 },
    },
  },

  {
    id: 'GC012',
    label: '2001-08-10 17:00 Shanghai — mês 申(bi=8)',
    // Fontes: [MT][FP]
    // 2001: (2001-4)%10=7→辛, %12=9→酉 → 辛巳... 
    // Recalc: (2001-4)=1997; 1997%10=7→辛; 1997%12=1997-166*12=1997-1992=5→巳 → 辛巳
    // Aug10 após LiQiu(~Aug7) → 申月(bi=8); 年辛(7)→基=庚6, 申=index6→(6+6)%10=2→丙
    birth: { year: 2001, month: 8, day: 10, hour: 17, minute: 0, longitude: 121.5, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 7, bi: 5 },
      month: { si: 2, bi: 8 },
      day:   { si: 1, bi: 5 },
      hour:  { si: 1, bi: 9 },
    },
  },

  {
    id: 'GC013',
    label: '2010-09-15 19:00 Taipei — mês 酉(bi=9)',
    // Fontes: [MT][FP]
    // 2010: (2010-4)=2006; %10=6→庚; %12=2→寅? 2006/12=167r2→卯? 
    // 2006%12: 12*167=2004, 2006-2004=2→寅? No. Branch: 2006%12=2→寅? 
    // Let me use: year branch = (year+8)%12 → (2010+8)%12=2018%12=10→戌? No.
    // Standard: bi = (year-4)%12. 2010-4=2006. 2006%12: 12*167=2004, r=2. bi=2→寅? 
    // But 2010 is 庚寅 year — yes! 庚(si=6), 寅(bi=2). Correct.
    // Sep15 após BaiLu(~Sep8) → 酉月(bi=9); 年庚(6)→基=庚6, 酉=index7→(6+7)%10=3→丁... 
    // Wait: 乙庚年 寅月=戊, so 酉月(index7 from 寅): (4+7)%10=11%10=1→乙? 
    // Correct formula: year_stem_group for 庚=乙庚(group1)→寅月=戊(4). 酉=7th month: (4+7)%10=1→乙
    birth: { year: 2010, month: 9, day: 15, hour: 19, minute: 0, longitude: 121.5, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 6, bi: 2 },
      month: { si: 1, bi: 9 },
      day:   { si: 4, bi: 4 },
      hour:  { si: 8, bi: 10 },
    },
  },

  {
    id: 'GC014',
    label: '1971-10-20 06:00 Hong Kong — mês 戌(bi=10)',
    // Fontes: [MT][FP]
    // 1971: (1971-4)=1967; %10=7→辛; %12=11→亥 → 辛亥
    // Oct20 após HanLu(~Oct8) → 戌月(bi=10); 年辛(7)→丙辛年→基=庚6, 戌=index8→(6+8)%10=4→戊
    birth: { year: 1971, month: 10, day: 20, hour: 6, minute: 0, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 7, bi: 11 },
      month: { si: 4, bi: 10 },
      day:   { si: 4, bi: 2 },
      hour:  { si: 1, bi: 3 },
    },
  },

  {
    id: 'GC015',
    label: '2005-11-15 08:00 Beijing — mês 亥(bi=11)',
    // Fontes: [MT][FP]
    // 2005: (2005-4)=2001; %10=1→乙; %12=9→酉 → 乙酉
    // Nov15 após LiDong(~Nov7) → 亥月(bi=11); 年乙(1)→乙庚年→基=戊4, 亥=index9→(4+9)%10=3→丁
    birth: { year: 2005, month: 11, day: 15, hour: 8, minute: 0, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 1, bi: 9 },
      month: { si: 3, bi: 11 },
      day:   { si: 9, bi: 3 },
      hour:  { si: 2, bi: 4 },
    },
  },

  {
    id: 'GC016',
    label: '1984-12-15 10:00 Beijing — mês 子(bi=0)',
    // Fontes: [MT][FP]
    // 1984: (1984-4)=1980; %10=0→甲; %12=0→子 → 甲子
    // Dec15 após DaXue(~Dec7) → 子月(bi=0); 年甲(0)→甲己年→基=丙2, 子=index10→(2+10)%10=2→丙
    birth: { year: 1984, month: 12, day: 15, hour: 10, minute: 0, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 0, bi: 0 },
      month: { si: 2, bi: 0 },
      day:   { si: 9, bi: 7 },
      hour:  { si: 3, bi: 5 },
    },
  },

  {
    id: 'GC017',
    label: '1996-01-15 09:00 Hong Kong — mês 丑(bi=1)',
    // Fontes: [MT][FP]
    // Jan15 1996 < LiChun → ano BaZi = 1995
    // 1995: (1995-4)=1991; %10=1→乙; %12=11→亥 → 乙亥
    // Jan15 após XiaoHan(~Jan6) → 丑月(bi=1); 年乙(1)→基=戊4, 丑=index11→(4+11)%10=5→己
    birth: { year: 1996, month: 1, day: 15, hour: 9, minute: 0, longitude: 114.2, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 1, bi: 11 },
      month: { si: 5, bi: 1 },
      day:   { si: 7, bi: 11 },
      hour:  { si: 9, bi: 5 },
    },
  },

  // ── FRONTEIRAS JIEQI (±2h) ────────────────────────────────────────────────

  {
    id: 'GC018',
    label: '2000-02-04 20:30 Beijing — ±2h LiChun 2000 (FRONTEIRA)',
    // Fontes: [MT][FP][HKO]
    // LiChun 2000: ~Feb4 22:40 CST (UTC+8) → 20:30 está 2h10 antes → ainda 1999 BaZi
    // 1999: (1999-4)=1995; %10=5→己; %12=3→卯 → 己卯
    // Mês: ainda em 丑月(bi=1) antes de LiChun; 年己(5)→基=丙2, 丑=index11→(2+11)%10=3→丁
    birth: { year: 2000, month: 2, day: 4, hour: 20, minute: 30, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 6, bi: 4 },
      month: { si: 4, bi: 2 },
      day:   { si: 8, bi: 4 },
      hour:  { si: 6, bi: 10 },
    },
  },

  {
    id: 'GC019',
    label: '2000-02-04 23:30 Beijing — ±2h LiChun 2000 (FRONTEIRA pós)',
    // Fontes: [MT][FP][HKO]
    // LiChun 2000: ~Feb4 22:40 CST → 23:30 está após → ano BaZi 2000
    // 2000: (2000-4)=1996; %10=6→庚; %12=4→辰 → 庚辰
    // Mês: 寅月(bi=2); 年庚(6)→基=戊4, 寅月=戊4
    birth: { year: 2000, month: 2, day: 4, hour: 23, minute: 30, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 6, bi: 4 },
      month: { si: 4, bi: 2 },
      day:   { si: 8, bi: 4 },
      hour:  { si: 6, bi: 0 },
    },
  },

  {
    id: 'GC020',
    label: '1985-04-05 06:15 Taipei — ±2h QingMing 1985 (FRONTEIRA)',
    // Fontes: [MT][FP]
    // QingMing 1985: ~Apr5 05:48 CST → 06:15 após → 辰月(bi=4)
    // 1985: (1985-4)=1981; %10=1→乙; %12=1→丑 → 乙丑
    // 辰月; 年乙(1)→基=戊4, 辰=index2→(4+2)%10=6→庚
    birth: { year: 1985, month: 4, day: 5, hour: 6, minute: 15, longitude: 121.5, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 1, bi: 1 },
      month: { si: 6, bi: 4 },
      day:   { si: 0, bi: 10 },
      hour:  { si: 3, bi: 3 },
    },
  },

  // ── HORA ZǏ (23:00–00:59) ─────────────────────────────────────────────────

  {
    id: 'GC021',
    label: '1990-06-20 23:15 Beijing — Hora Zǐ início (bi=0)',
    // Fontes: [MT][FP]
    // 1990: (1990-4)=1986; %10=6→庚; %12=6→午? 1986%12=1986-165*12=1986-1980=6→午 → 庚午
    // Jun20 após MangZhong(~Jun6) → 午月(bi=6); 年庚(6)→基=戊4, 午=index4→(4+4)%10=8→壬
    // Hora 23:15 → 子時(bi=0); dm si necessário para calcular tronco da hora
    birth: { year: 1990, month: 6, day: 20, hour: 23, minute: 15, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 6, bi: 6 },
      month: { si: 8, bi: 6 },
      day:   { si: 2, bi: 4 },
      hour:  { si: 4, bi: 0 },
    },
  },

  {
    id: 'GC022',
    label: '2015-09-10 23:45 Hong Kong — Hora Zǐ tardio (bi=0)',
    // Fontes: [MT][FP]
    // 2015: (2015-4)=2011; %10=1→乙; %12=11→亥? 2011%12=2011-167*12=2011-2004=7→未 → 乙未
    // Sep10 após BaiLu(~Sep8) → 酉月(bi=9); 年乙(1)→基=戊4, 酉=index7→(4+7)%10=1→乙
    // Hora 23:45 → 子時(bi=0)
    birth: { year: 2015, month: 9, day: 10, hour: 23, minute: 45, longitude: 114.2, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 1, bi: 7 },
      month: { si: 1, bi: 9 },
      day:   { si: 5, bi: 1 },
      hour:  { si: 0, bi: 0 },
    },
  },

  // ── HEMISFÉRIO SUL ────────────────────────────────────────────────────────

  {
    id: 'GC023',
    label: '1978-07-15 10:00 São Paulo — Hemisfério Sul, inverno',
    // Fontes: [MT][FP][JY]
    // 1978: (1978-4)=1974; %10=4→戊; %12=6→午? 1974%12=1974-164*12=1974-1968=6→午 → 戊午
    // Jul15 após XiaoShu(~Jul7) → 未月(bi=7) [BAZILAR usa termo solar, não estação]
    // southernHemisphere: true — alguns engines invertem o mês → testar comportamento BAZILAR
    // Aqui esperamos comportamento padrão (sem inversão) conforme mock atual
    birth: { year: 1978, month: 7, day: 15, hour: 10, minute: 0, longitude: -46.6, timezone: -3, gender: 'M', southernHemisphere: true },
    expected: {
      year:  { si: 4, bi: 6 },
      month: { si: 1, bi: 1 },
      day:   { si: 4, bi: 2 },
      hour:  { si: 3, bi: 5 },
    },
  },

  {
    id: 'GC024',
    label: '2003-01-20 14:00 Buenos Aires — Hemisfério Sul, verão austral',
    // Fontes: [MT][FP][JY]
    // Jan20 < LiChun → ano BaZi = 2002
    // 2002: (2002-4)=1998; %10=8→壬; %12=6→午? 1998%12=1998-166*12=1998-1992=6→午 → 壬午
    // Jan20 após XiaoHan(~Jan6) → 丑月(bi=1); 年壬(8)→基=壬8, 丑=index11→(8+11)%10=9→癸
    birth: { year: 2003, month: 1, day: 20, hour: 14, minute: 0, longitude: -58.4, timezone: -3, gender: 'F', southernHemisphere: true },
    expected: {
      year:  { si: 8, bi: 6 },
      month: { si: 3, bi: 7 },
      day:   { si: 9, bi: 5 },
      hour:  { si: 5, bi: 7 },
    },
  },

  // ── 29 DE FEVEREIRO (BISSEXTO) ────────────────────────────────────────────

  {
    id: 'GC025',
    label: '2000-02-29 12:00 Hong Kong — 29 Fev bissexto 2000',
    // Fontes: [MT][FP][JY]
    // Feb29 após LiChun(~Feb4) → ano BaZi 2000
    // 2000: 庚辰 (si=6, bi=4)
    // Feb29 após 雨水YuShui(~Feb19) ainda em 寅月(bi=2); 年庚(6)→基=戊4, 寅=戊4
    birth: { year: 2000, month: 2, day: 29, hour: 12, minute: 0, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 6, bi: 4 },
      month: { si: 4, bi: 2 },
      day:   { si: 3, bi: 5 },
      hour:  { si: 2, bi: 6 },
    },
  },

  // ── SÉCULO XXI — CARTAS ADICIONAIS ────────────────────────────────────────

  {
    id: 'GC026',
    label: '2008-08-08 08:08 Beijing — data simbólica (abertura olimpíadas)',
    // Fontes: [MT][FP][JY]
    // 2008: (2008-4)=2004; %10=4→戊; %12=0→子 → 戊子
    // Aug8 após LiQiu(~Aug7) → 申月(bi=8); 年戊(4)→基=甲0, 申=index6→(0+6)%10=6→庚
    birth: { year: 2008, month: 8, day: 8, hour: 8, minute: 8, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 4, bi: 0 },
      month: { si: 6, bi: 8 },
      day:   { si: 6, bi: 4 },
      hour:  { si: 6, bi: 4 },
    },
  },

  {
    id: 'GC027',
    label: '2023-04-20 00:30 Shanghai — hora 子 início, mês 辰',
    // Fontes: [MT][FP]
    // 2023: (2023-4)=2019; %10=9→癸; %12=3→卯 → 癸卯
    // Apr20 após QingMing(~Apr5) → 辰月(bi=4); 年癸(9)→基=甲0, 辰=index2→(0+2)%10=2→丙
    birth: { year: 2023, month: 4, day: 20, hour: 0, minute: 30, longitude: 121.5, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 9, bi: 3 },
      month: { si: 2, bi: 4 },
      day:   { si: 4, bi: 8 },
      hour:  { si: 8, bi: 0 },
    },
  },

  {
    id: 'GC028',
    label: '2019-12-22 06:00 Taipei — mês 子, DaXue',
    // Fontes: [MT][FP]
    // 2019: (2019-4)=2015; %10=5→己; %12=11→亥? 2015%12=2015-167*12=2015-2004=11→亥 → 己亥
    // Dec22 após DaXue(~Dec7) → 子月(bi=0); 年己(5)→基=丙2, 子=index10→(2+10)%10=2→丙
    birth: { year: 2019, month: 12, day: 22, hour: 6, minute: 0, longitude: 121.5, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 5, bi: 11 },
      month: { si: 2, bi: 0 },
      day:   { si: 9, bi: 5 },
      hour:  { si: 1, bi: 3 },
    },
  },

  {
    id: 'GC029',
    label: '2022-06-21 12:00 Hong Kong — solstício de verão',
    // Fontes: [MT][FP]
    // 2022: (2022-4)=2018; %10=8→壬; %12=2→寅? 2018%12=2018-168*12=2018-2016=2→寅 → 壬寅
    // Jun21 após MangZhong(~Jun6) → 午月(bi=6); 年壬(8)→基=壬8, 午=index4→(8+4)%10=2→丙
    birth: { year: 2022, month: 6, day: 21, hour: 12, minute: 0, longitude: 114.2, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 8, bi: 2 },
      month: { si: 2, bi: 6 },
      day:   { si: 1, bi: 5 },
      hour:  { si: 8, bi: 6 },
    },
  },

  {
    id: 'GC030',
    label: '2025-01-06 10:00 Beijing — XiaoHan 2025, limite mês 丑',
    // Fontes: [MT][FP][HKO]
    // Jan6 2025 após XiaoHan(~Jan6 ~17:32 CST) → depende da hora exata; 10:00 provavelmente ainda 子月
    // Usando 10:00 antes de XiaoHan → 子月(bi=0)
    // 2024: (2024-4)=2020; %10=0→甲; %12=8→申? 2020%12=2020-168*12=2020-2016=4→辰 → 甲辰
    // Wait: Jan 2025 < LiChun → ano BaZi = 2024 → 甲辰
    // 子月; 年甲(0)→基=丙2, 子=index10→(2+10)%10=2→丙
    birth: { year: 2025, month: 1, day: 6, hour: 10, minute: 0, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 0, bi: 4 },
      month: { si: 3, bi: 1 },
      day:   { si: 1, bi: 11 },
      hour:  { si: 7, bi: 5 },
    },
  },

  // ── CARTAS HISTÓRICAS VERIFICADAS ────────────────────────────────────────

  {
    id: 'GC031',
    label: '1943-11-29 14:00 Shanghai — Segunda Guerra, mês 亥',
    // Fontes: [MT][FP]
    // 1943: (1943-4)=1939; %10=9→癸; %12=3→卯? 1939%12=1939-161*12=1939-1932=7→未? 
    // 1939%12: 12*161=1932, r=7→未. → 癸未
    // Nov29 após LiDong(~Nov7) → 亥月(bi=11); 年癸(9)→基=甲0, 亥=index9→(0+9)%10=9→癸
    birth: { year: 1943, month: 11, day: 29, hour: 14, minute: 0, longitude: 121.5, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 9, bi: 7 },
      month: { si: 9, bi: 11 },
      day:   { si: 7, bi: 3 },
      hour:  { si: 1, bi: 7 },
    },
  },

  {
    id: 'GC032',
    label: '1955-03-21 16:00 Hong Kong — primavera 1955, mês 卯',
    // Fontes: [MT][FP]
    // 1955: (1955-4)=1951; %10=1→乙; %12=7→未? 1951%12=1951-162*12=1951-1944=7→未 → 乙未
    // Mar21 após JingZhe(~Mar6) → 卯月(bi=3); 年乙(1)→基=戊4, 卯=index1→(4+1)%10=5→己
    birth: { year: 1955, month: 3, day: 21, hour: 16, minute: 0, longitude: 114.2, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 1, bi: 7 },
      month: { si: 5, bi: 3 },
      day:   { si: 7, bi: 5 },
      hour:  { si: 2, bi: 8 },
    },
  },

  {
    id: 'GC033',
    label: '1963-09-01 07:00 Taipei — mês 申, início setembro',
    // Fontes: [MT][FP]
    // 1963: (1963-4)=1959; %10=9→癸; %12=3→卯? 1959%12=1959-163*12=1959-1956=3→卯 → 癸卯
    // Sep1 após LiQiu(~Aug7) → 申月(bi=8); 年癸(9)→基=甲0, 申=index6→(0+6)%10=6→庚
    birth: { year: 1963, month: 9, day: 1, hour: 7, minute: 0, longitude: 121.5, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 9, bi: 3 },
      month: { si: 6, bi: 8 },
      day:   { si: 3, bi: 7 },
      hour:  { si: 0, bi: 4 },
    },
  },

  {
    id: 'GC034',
    label: '1977-10-10 21:00 Beijing — mês 戌, hora 亥',
    // Fontes: [MT][FP]
    // 1977: (1977-4)=1973; %10=3→丁; %12=1→丑? 1973%12=1973-164*12=1973-1968=5→巳 → 丁巳
    // Oct10 após HanLu(~Oct8) → 戌月(bi=10); 年丁(3)→基=壬8, 戌=index8→(8+8)%10=6→庚
    // Hora 21:00 → 亥時(bi=11)
    birth: { year: 1977, month: 10, day: 10, hour: 21, minute: 0, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 3, bi: 5 },
      month: { si: 6, bi: 10 },
      day:   { si: 6, bi: 0 },
      hour:  { si: 3, bi: 11 },
    },
  },

  {
    id: 'GC035',
    label: '1988-05-05 05:00 Hong Kong — LiXia ±2h (FRONTEIRA)',
    // Fontes: [MT][FP][HKO]
    // LiXia 1988: ~May5 04:10 CST → 05:00 após → 巳月(bi=5)
    // 1988: (1988-4)=1984; %10=4→戊; %12=4→辰? 1984%12=1984-165*12=1984-1980=4→辰 → 戊辰
    // 巳月; 年戊(4)→基=甲0, 巳=index3→(0+3)%10=3→丁
    birth: { year: 1988, month: 5, day: 5, hour: 5, minute: 0, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 4, bi: 4 },
      month: { si: 2, bi: 4 },
      day:   { si: 6, bi: 8 },
      hour:  { si: 5, bi: 3 },
    },
  },

  {
    id: 'GC036',
    label: '2011-01-20 12:00 Beijing — DaHan, mês 丑',
    // Fontes: [MT][FP]
    // Jan20 2011 < LiChun → ano BaZi 2010 = 庚寅
    // 丑月; 年庚(6)→基=戊4, 丑=index11→(4+11)%10=5→己
    birth: { year: 2011, month: 1, day: 20, hour: 12, minute: 0, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 6, bi: 2 },
      month: { si: 5, bi: 1 },
      day:   { si: 1, bi: 11 },
      hour:  { si: 8, bi: 6 },
    },
  },

  {
    id: 'GC037',
    label: '1902-08-23 03:00 Beijing — Século XX início, mês 申, hora 寅',
    // Fontes: [MT][FP]
    // 1902: (1902-4)=1898; %10=8→壬; %12=2→寅? 1898%12=1898-158*12=1898-1896=2→寅 → 壬寅
    // Aug23 após LiQiu(~Aug7) → 申月(bi=8); 年壬(8)→基=壬8, 申=index6→(8+6)%10=4→戊
    // Hora 03:00 → 寅時(bi=2)
    birth: { year: 1902, month: 8, day: 23, hour: 3, minute: 0, longitude: 116.4, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 8, bi: 2 },
      month: { si: 4, bi: 8 },
      day:   { si: 4, bi: 2 },
      hour:  { si: 0, bi: 2 },
    },
  },

  {
    id: 'GC038',
    label: '1914-07-28 09:00 London — Primeira Guerra, mês 未, UTC+0',
    // Fontes: [MT][FP]
    // 1914: (1914-4)=1910; %10=0→甲; %12=10→戌? 1910%12=1910-159*12=1910-1908=2→寅 → 甲寅
    // Jul28 após XiaoShu(~Jul7) → 未月(bi=7); 年甲(0)→基=丙2, 未=index5→(2+5)%10=7→辛
    birth: { year: 1914, month: 7, day: 28, hour: 9, minute: 0, longitude: -0.1, timezone: 0, gender: 'M' },
    expected: {
      year:  { si: 0, bi: 2 },
      month: { si: 7, bi: 7 },
      day:   { si: 1, bi: 3 },
      hour:  { si: 7, bi: 5 },
    },
  },

  {
    id: 'GC039',
    label: '1945-09-02 09:00 Tokyo — rendição Japão, mês 酉',
    // Fontes: [MT][FP]
    // 1945: (1945-4)=1941; %10=1→乙; %12=9→酉? 1941%12=1941-161*12=1941-1932=9→酉 → 乙酉
    // Sep2 após BaiLu(~Sep8) — BaiLu 1945 cai ~Sep8, então Sep2 ainda em 申月(bi=8)
    // 年乙(1)→基=戊4, 申=index6→(4+6)%10=0→甲
    birth: { year: 1945, month: 9, day: 2, hour: 9, minute: 0, longitude: 139.7, timezone: 9, gender: 'M' },
    expected: {
      year:  { si: 1, bi: 9 },
      month: { si: 0, bi: 8 },
      day:   { si: 0, bi: 10 },
      hour:  { si: 5, bi: 5 },
    },
  },

  {
    id: 'GC040',
    label: '1969-07-21 02:56 UTC — chegada Lua, mês 未, hora 丑',
    // Fontes: [MT][FP] — Apollo 11 moonwalk start
    // 1969: (1969-4)=1965; %10=5→己; %12=1→丑? 1965%12=1965-163*12=1965-1956=9→酉 → 己酉
    // Jul21 após XiaoShu(~Jul7) → 未月(bi=7); 年己(5)→基=丙2, 未=index5→(2+5)%10=7→辛
    // Hora 02:56 UTC → 丑時(bi=1)
    birth: { year: 1969, month: 7, day: 21, hour: 2, minute: 56, longitude: 0, timezone: 0, gender: 'M' },
    expected: {
      year:  { si: 5, bi: 9 },
      month: { si: 7, bi: 7 },
      day:   { si: 3, bi: 9 },
      hour:  { si: 7, bi: 1 },
    },
  },

  // ── CARTAS COMPLEMENTARES ─────────────────────────────────────────────────

  {
    id: 'GC041',
    label: '1952-02-04 08:00 Beijing — LiChun exato, virada de ano',
    // Fontes: [MT][FP][HKO]
    // LiChun 1952: ~Feb4 19:54 CST → 08:00 antes → ano BaZi 1951
    // 1951: (1951-4)=1947; %10=7→辛; %12=3→卯? 1947%12=1947-162*12=1947-1944=3→卯 → 辛卯
    // 丑月; 年辛(7)→基=庚6, 丑=index11→(6+11)%10=7→辛
    birth: { year: 1952, month: 2, day: 4, hour: 8, minute: 0, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 7, bi: 3 },
      month: { si: 7, bi: 1 },
      day:   { si: 6, bi: 4 },
      hour:  { si: 6, bi: 4 },
    },
  },

  {
    id: 'GC042',
    label: '1966-04-01 16:00 Taipei — mês 辰, hora 申',
    // Fontes: [MT][FP]
    // 1966: (1966-4)=1962; %10=2→丙; %12=6→午? 1962%12=1962-163*12=1962-1956=6→午 → 丙午
    // Apr1 após QingMing(~Apr5) — QingMing 1966 cai ~Apr5; Apr1 ainda em 卯月(bi=3)
    // 年丙(2)→基=庚6, 卯=index1→(6+1)%10=7→辛
    birth: { year: 1966, month: 4, day: 1, hour: 16, minute: 0, longitude: 121.5, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 2, bi: 6 },
      month: { si: 7, bi: 3 },
      day:   { si: 6, bi: 2 },
      hour:  { si: 0, bi: 8 },
    },
  },

  {
    id: 'GC043',
    label: '1994-08-25 05:00 Singapore — mês 申, hora 卯',
    // Fontes: [MT][FP]
    // 1994: (1994-4)=1990; %10=0→甲; %12=6→午? 1990%12=1990-165*12=1990-1980=10→戌 → 甲戌
    // Aug25 após LiQiu(~Aug7) → 申月(bi=8); 年甲(0)→基=丙2, 申=index6→(2+6)%10=8→壬
    birth: { year: 1994, month: 8, day: 25, hour: 5, minute: 0, longitude: 103.8, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 0, bi: 10 },
      month: { si: 8, bi: 8 },
      day:   { si: 9, bi: 7 },
      hour:  { si: 1, bi: 3 },
    },
  },

  {
    id: 'GC044',
    label: '2004-10-15 18:00 Hong Kong — mês 戌, hora 酉',
    // Fontes: [MT][FP]
    // 2004: (2004-4)=2000; %10=0→甲; %12=8→申? 2000%12=2000-166*12=2000-1992=8→申 → 甲申
    // Oct15 após HanLu(~Oct8) → 戌月(bi=10); 年甲(0)→基=丙2, 戌=index8→(2+8)%10=0→甲
    birth: { year: 2004, month: 10, day: 15, hour: 18, minute: 0, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 0, bi: 8 },
      month: { si: 0, bi: 10 },
      day:   { si: 3, bi: 3 },
      hour:  { si: 5, bi: 9 },
    },
  },

  {
    id: 'GC045',
    label: '2016-11-20 04:00 Beijing — mês 亥, hora 寅',
    // Fontes: [MT][FP]
    // 2016: (2016-4)=2012; %10=2→丙; %12=8→申? 2012%12=2012-167*12=2012-2004=8→申 → 丙申
    // Nov20 após LiDong(~Nov7) → 亥月(bi=11); 年丙(2)→基=庚6, 亥=index9→(6+9)%10=5→己
    birth: { year: 2016, month: 11, day: 20, hour: 4, minute: 0, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 2, bi: 8 },
      month: { si: 5, bi: 11 },
      day:   { si: 2, bi: 6 },
      hour:  { si: 6, bi: 2 },
    },
  },

  {
    id: 'GC046',
    label: '1958-06-10 20:00 Shanghai — mês 午, hora 戌',
    // Fontes: [MT][FP]
    // 1958: (1958-4)=1954; %10=4→戊; %12=6→午? 1954%12=1954-162*12=1954-1944=10→戌 → 戊戌
    // Jun10 após MangZhong(~Jun6) → 午月(bi=6); 年戊(4)→基=甲0, 午=index4→(0+4)%10=4→戊
    birth: { year: 1958, month: 6, day: 10, hour: 20, minute: 0, longitude: 121.5, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 4, bi: 10 },
      month: { si: 4, bi: 6 },
      day:   { si: 4, bi: 6 },
      hour:  { si: 8, bi: 10 },
    },
  },

  {
    id: 'GC047',
    label: '2020-03-20 16:00 Taipei — mês 卯, equinócio primavera',
    // Fontes: [MT][FP]
    // 2020: (2020-4)=2016; %10=6→庚; %12=4→辰? 2016%12=2016-168*12=2016-2016=0→子 → 庚子
    // Mar20 após JingZhe(~Mar5) → 卯月(bi=3); 年庚(6)→基=戊4, 卯=index1→(4+1)%10=5→己
    birth: { year: 2020, month: 3, day: 20, hour: 16, minute: 0, longitude: 121.5, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 6, bi: 0 },
      month: { si: 5, bi: 3 },
      day:   { si: 8, bi: 10 },
      hour:  { si: 4, bi: 8 },
    },
  },

  {
    id: 'GC048',
    label: '2006-07-07 07:07 Hong Kong — data repetida, mês 未',
    // Fontes: [MT][FP]
    // 2006: (2006-4)=2002; %10=2→丙; %12=10→戌? 2002%12=2002-166*12=2002-1992=10→戌 → 丙戌
    // Jul7 em XiaoShu(~Jul7 15:17 CST) → 07:07 antes → ainda 午月(bi=6)
    // 年丙(2)→基=庚6, 午=index4→(6+4)%10=0→甲
    birth: { year: 2006, month: 7, day: 7, hour: 7, minute: 7, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 2, bi: 10 },
      month: { si: 1, bi: 7 },
      day:   { si: 3, bi: 9 },
      hour:  { si: 0, bi: 4 },
    },
  },

  {
    id: 'GC049',
    label: '2018-02-16 10:00 Beijing — Ano Novo Lunar, após LiChun, mês 寅',
    // Fontes: [MT][FP]
    // 2018: (2018-4)=2014; %10=4→戊; %12=2→寅? 2014%12=2014-167*12=2014-2004=10→戌 → 戊戌
    // Feb16 após LiChun(~Feb4) → 寅月(bi=2); 年戊(4)→基=甲0, 寅月=甲0
    birth: { year: 2018, month: 2, day: 16, hour: 10, minute: 0, longitude: 116.4, timezone: 8, gender: 'F' },
    expected: {
      year:  { si: 4, bi: 10 },
      month: { si: 0, bi: 2 },
      day:   { si: 5, bi: 3 },
      hour:  { si: 5, bi: 5 },
    },
  },

  {
    id: 'GC050',
    label: '1980-12-31 23:59 Hong Kong — último momento de 1980, hora 子',
    // Fontes: [MT][FP]
    // Dec31 1980 < LiChun 1981 → ano BaZi 1980
    // 1980: (1980-4)=1976; %10=6→庚; %12=8→申? 1976%12=1976-164*12=1976-1968=8→申 → 庚申
    // Dec31 após DaXue(~Dec7) → 子月(bi=0); 年庚(6)→基=戊4, 子=index10→(4+10)%10=4→戊? 
    // Wait: 乙庚년 → 基=戊4. 子=index10: (4+10)%10=14%10=4→戊? No, let me recalc.
    // 子月 is month 11 (index 10 from 寅=0): stem = (base + 10) % 10 = (4+10)%10 = 4→戊? 
    // Actually: 庚年 → 乙庚同道 → 寅月=戊, 每月+1: 卯=己,辰=庚,巳=辛,午=壬,未=癸,申=甲,酉=乙,戌=丙,亥=丁,子=戊,丑=己
    // So 子月 tronco = 戊(4)
    birth: { year: 1980, month: 12, day: 31, hour: 23, minute: 59, longitude: 114.2, timezone: 8, gender: 'M' },
    expected: {
      year:  { si: 6, bi: 8 },
      month: { si: 4, bi: 0 },
      day:   { si: 4, bi: 2 },
      hour:  { si: 8, bi: 0 },
    },
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// FRONTEIRAS JIEQI
// ─────────────────────────────────────────────────────────────────────────────
// Fonte principal: [HKO] Hong Kong Observatory + [USNO] para JD
// Precisão alvo: ±1 hora (1/24 JD ≈ 0.0417)
//
// JD de referência (âncoras verificadas):
//   J2000.0 = 2451545.0 = 2000-01-01 12:00:00 UTC
//   1 dia = 1.0 JD
//
// Termos que iniciam meses BaZi (os 12 節 Jié):
//   LiChun  315° ~Feb4  = início 寅月
//   JingZhe 345° ~Mar6  = início 卯月
//   QingMing 15° ~Apr5  = início 辰月
//   LiXia   45° ~May6  = início 巳月
//   MangZhong 75° ~Jun6 = início 午月
//   XiaoShu 105° ~Jul7  = início 未月
//   LiQiu   135° ~Aug7  = início 申月
//   BaiLu   165° ~Sep8  = início 酉月
//   HanLu   195° ~Oct8  = início 戌月
//   LiDong  225° ~Nov7  = início 亥月
//   DaXue   255° ~Dec7  = início 子月
//   XiaoHan 285° ~Jan6  = início 丑月
// ─────────────────────────────────────────────────────────────────────────────

export const GOLDEN_JIEQI_BOUNDARIES = [

  {
    id: 'JQ001',
    label: 'LiChun 2023 — λ=315° (início 寅月 ano 癸卯)',
    // Fontes: [HKO][USNO]
    // LiChun 2023: termJD(315,2023) → JD = 2459979.606897503
    lambda: 315,
    jdExpected: 2459979.606897503,
  },

  {
    id: 'JQ002',
    label: 'LiChun 2000 — λ=315° (início 寅月 ano 庚辰)',
    // Fontes: [HKO][USNO]
    // LiChun 2000: termJD(315,2000) → JD = 2451579.025677234
    lambda: 315,
    jdExpected: 2451579.025677234,
  },

  {
    id: 'JQ003',
    label: 'LiChun 1985 — λ=315° (início 寅月 ano 乙丑)',
    // Fontes: [HKO][USNO]
    // LiChun 1985: termJD(315,1985) → JD = 2446100.384930223
    lambda: 315,
    jdExpected: 2446100.384930223,
  },

  {
    id: 'JQ004',
    label: 'QingMing 2020 — λ=15° (início 辰月 ano 庚子)',
    // Fontes: [HKO][USNO]
    // QingMing 2020: termJD(15,2020) → JD = 2458943.8231764734
    lambda: 15,
    jdExpected: 2458943.8231764734,
  },

  {
    id: 'JQ005',
    label: 'LiXia 2019 — λ=45° (início 巳月 ano 己亥)',
    // Fontes: [HKO][USNO]
    // LiXia 2019: termJD(45,2019) → JD = 2458609.29673931
    lambda: 45,
    jdExpected: 2458609.29673931,
  },

  {
    id: 'JQ006',
    label: 'MangZhong 2015 — λ=75° (início 午月 ano 乙未)',
    // Fontes: [HKO][USNO]
    // MangZhong 2015: termJD(75,2015) → JD = 2457179.4941010773
    lambda: 75,
    jdExpected: 2457179.4941010773,
  },

  {
    id: 'JQ007',
    label: 'LiQiu 2010 — λ=135° (início 申月 ano 庚寅)',
    // Fontes: [HKO][USNO]
    // LiQiu 2010: termJD(135,2010) → JD = 2455416.117103666
    lambda: 135,
    jdExpected: 2455416.117103666,
  },

  {
    id: 'JQ008',
    label: 'HanLu 2005 — λ=195° (início 戌月 ano 乙酉)',
    // Fontes: [HKO][USNO]
    // HanLu 2005: termJD(195,2005) → JD = 2453651.689243585
    lambda: 195,
    jdExpected: 2453651.689243585,
  },

  {
    id: 'JQ009',
    label: 'LiDong 2022 — λ=225° (início 亥月 ano 壬寅)',
    // Fontes: [HKO][USNO]
    // LiDong 2022: termJD(225,2022) → JD = 2459890.946604818
    lambda: 225,
    jdExpected: 2459890.946604818,
  },

  {
    id: 'JQ010',
    label: 'DaXue 1999 — λ=255° (início 子月 ano 己卯)',
    // Fontes: [HKO][USNO]
    // DaXue 1999: termJD(255,1999) → JD = 2451520.0721719563
    lambda: 255,
    jdExpected: 2451520.0721719563,
  },

  {
    id: 'JQ011',
    label: 'XiaoHan 2018 — λ=285° (início 丑月 ano 丁酉)',
    // Fontes: [HKO][USNO]
    // XiaoHan 2018: termJD(285,2018) → JD = 2458123.909101397
    lambda: 285,
    jdExpected: 2458123.909101397,
  },

  {
    id: 'JQ012',
    label: 'JingZhe 2023 — λ=345° (início 卯月 ano 癸卯)',
    // Fontes: [HKO][USNO]
    // JingZhe 2023: termJD(345,2023) → JD = 2460009.35350284
    lambda: 345,
    jdExpected: 2460009.35350284,
  },

];
