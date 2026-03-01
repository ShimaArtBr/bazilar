/**
 * i18n.js — Internacionalização BAZILAR
 * Roda no browser. Não contém lógica de cálculo.
 */

export const T = {
  en: {
    flag: '🇺🇸', lbl: 'EN',
    title: 'Birth Data', date: 'Date', year: 'Year', month: 'Month', day: 'Day',
    time: 'Time (00:00–23:59)', city: 'Birth Location',
    cityPH: 'e.g. London, UK',
    long: 'Longitude', lat: 'Latitude', tz: 'Time Zone (GMT)',
    dst: 'Daylight Saving Time (DST)', rstLbl: 'Real Solar Time',
    clk: 'Clock', corr: 'Correction',
    calc: 'Calculate Four Pillars',
    etitle: 'BaZi Calculation Engine',
    esub: 'Fill in the birth data and click Calculate to generate the Four Pillars based on Real Solar Time and astronomical Solar Terms.',
    errFill: '⚠ Please fill in all fields correctly.',
    secPil: '四柱 — The Four Pillars', secLog: 'Calculation Log',
    pH: 'Hour · 时', pD: 'Day · 日 ★', pM: 'Month · 月', pY: 'Year · 年',
    dm: 'Day Master · 日主', dmSub: 'Central pillar of the BaZi chart',
    rst: 'Real Solar Time · RST',
    yr: 'BaZi Year · 八字年', yrSub: 'Changes at 立春 (~4 Feb)',
    sun: 'Solar Longitude', sunSub: 'Meeus formula',
    terms: 'Solar Terms of %y — BaZi month indicator',
    acc: '<strong>Astronomical precision:</strong> Solar longitude by Meeus ±0.01° (~15 s). Solar Terms by bisection ±1 s. Day pillar reference verified: 戊午 = 1 Jan 2000.',
    el: { Wood: 'Wood', Fire: 'Fire', Earth: 'Earth', Metal: 'Metal', Water: 'Water' },
    yang: 'Yang', yin: 'Yin',
    lTitle: '// Calculation log — %d/%m/%y',
    lSun:   '// Ecliptic longitude of the Sun on %d/%m/%y',
    lJD:    '// Julian Day Number (Meeus) for %d/%m/%y noon',
    lYC:    '// Year Pillar — 60-cycle from 甲子 = 1984',
    lYS:    'yearStem = (%Y − 4) mod 10 = %si → %sc',
    lYB:    'yearBranch = (%Y − 4) mod 12 = %bi → %bc',
    lMC:    '// Month Pillar — term %tn (lon %tl°)',
    lMB:    'monthBranch = seq[%mi] = %bi → %bc',
    lMS:    'monthStem = base(%ys) + %mi = %si → %sc',
    lDC:    '// Day Pillar — ref: 戊午 (idx 54) at JD 2451545',
    lDF:    'dayIdx = (%jd − 2451545 + 54) mod 60 = %di',
    lHC:    '// Hour Pillar — RST %rst',
    lHB:    'hourBranch = ⌊(%rh + 1) / 2⌋ mod 12 = %bi → %bc (%hrs)',
    lHS:    'hourStem = base(%ds) + %hi = %si → %sc',
    lRC:    '// RST = clock + lonCorr + EoT + DST',
    lRF:    'RST = %ct + %lc\' + %eot\' + %dst\' = %rst',
  },

  zh: {
    flag: '🇨🇳', lbl: '中',
    title: '出生信息', date: '日期', year: '年', month: '月', day: '日',
    time: '时间 (00:00–23:59)', city: '出生地点',
    cityPH: '例如：北京，中国',
    long: '经度', lat: '纬度', tz: '时区 (GMT)',
    dst: '夏令时 (DST)', rstLbl: '真太阳时',
    clk: '时钟', corr: '修正',
    calc: '计算四柱',
    etitle: '八字排盘引擎',
    esub: '填写出生信息，点击计算，根据真太阳时和天文节气生成四柱。',
    errFill: '⚠ 请正确填写所有字段。',
    secPil: '四柱排盘', secLog: '计算日志',
    pH: '时柱', pD: '日柱 ★', pM: '月柱', pY: '年柱',
    dm: '日主', dmSub: '八字命盘的核心',
    rst: '真太阳时',
    yr: '八字年', yrSub: '以立春换年 (~2月4日)',
    sun: '太阳黄经', sunSub: '米乌斯公式',
    terms: '%y年节气 — 八字月份指标',
    acc: '<strong>天文精度：</strong>米乌斯公式太阳黄经 ±0.01°。二分法节气精度 ±1秒。日柱参考验证：戊午 = 2000年1月1日。',
    el: { Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水' },
    yang: '阳', yin: '阴',
    lTitle: '// 计算日志 — %d/%m/%y',
    lSun:   '// %d/%m/%y 太阳黄经',
    lJD:    '// %d/%m/%y 正午儒略日 (米乌斯)',
    lYC:    '// 年柱 — 六十甲子循环 甲子 = 1984',
    lYS:    '年干 = (%Y − 4) mod 10 = %si → %sc',
    lYB:    '年支 = (%Y − 4) mod 12 = %bi → %bc',
    lMC:    '// 月柱 — 节气 %tn (黄经 %tl°)',
    lMB:    '月支 = seq[%mi] = %bi → %bc',
    lMS:    '月干 = base(%ys) + %mi = %si → %sc',
    lDC:    '// 日柱 — 参考：戊午 (idx 54) JD 2451545',
    lDF:    '日序 = (%jd − 2451545 + 54) mod 60 = %di',
    lHC:    '// 时柱 — 真太阳时 %rst',
    lHB:    '时支 = ⌊(%rh + 1) / 2⌋ mod 12 = %bi → %bc (%hrs)',
    lHS:    '时干 = base(%ds) + %hi = %si → %sc',
    lRC:    '// 真太阳时 = 时钟 + 经度差 + 均时差 + 夏令时',
    lRF:    '真太阳时 = %ct + %lc\' + %eot\' + %dst\' = %rst',
  },

  es: {
    flag: '🇪🇸', lbl: 'ES',
    title: 'Datos de Nacimiento', date: 'Fecha', year: 'Año', month: 'Mes', day: 'Día',
    time: 'Hora (00:00–23:59)', city: 'Lugar de Nacimiento',
    cityPH: 'ej. Madrid, España',
    long: 'Longitud', lat: 'Latitud', tz: 'Huso Horario (GMT)',
    dst: 'Horario de Verano (DST)', rstLbl: 'Tiempo Solar Real',
    clk: 'Reloj', corr: 'Corrección',
    calc: 'Calcular Cuatro Pilares',
    etitle: 'Motor de Cálculo BaZi',
    esub: 'Rellene los datos y haga clic en Calcular para generar los Cuatro Pilares basándose en el Tiempo Solar Real y los Términos Solares astronómicos.',
    errFill: '⚠ Complete todos los campos correctamente.',
    secPil: '四柱 — Los Cuatro Pilares', secLog: 'Registro de Cálculo',
    pH: 'Hora · 时', pD: 'Día · 日 ★', pM: 'Mes · 月', pY: 'Año · 年',
    dm: 'Maestro del Día · 日主', dmSub: 'Pilar central del mapa BaZi',
    rst: 'Tiempo Solar Real · TSR',
    yr: 'Año BaZi · 八字年', yrSub: 'Cambia en 立春 (~4 Feb)',
    sun: 'Longitud Solar', sunSub: 'Calculada por fórmula de Meeus',
    terms: 'Términos Solares de %y — indicador del mes BaZi',
    acc: '<strong>Precisión astronómica:</strong> Longitud solar por Meeus ±0.01° (~15 s). Términos Solares por bisección ±1 s. Referencia del día verificada: 戊午 = 1 Ene 2000.',
    el: { Wood: 'Madera', Fire: 'Fuego', Earth: 'Tierra', Metal: 'Metal', Water: 'Agua' },
    yang: 'Yang', yin: 'Yin',
    lTitle: '// Registro de cálculo — %d/%m/%y',
    lSun:   '// Longitud eclíptica del Sol el %d/%m/%y',
    lJD:    '// Número de Día Juliano (Meeus) para %d/%m/%y mediodía',
    lYC:    '// Pilar del Año — ciclo 60 desde 甲子 = 1984',
    lYS:    'troncoAño = (%Y − 4) mod 10 = %si → %sc',
    lYB:    'ramaAño = (%Y − 4) mod 12 = %bi → %bc',
    lMC:    '// Pilar del Mes — término %tn (lon %tl°)',
    lMB:    'ramaMes = seq[%mi] = %bi → %bc',
    lMS:    'troncoMes = base(%ys) + %mi = %si → %sc',
    lDC:    '// Pilar del Día — ref: 戊午 (idx 54) en JD 2451545',
    lDF:    'idxDía = (%jd − 2451545 + 54) mod 60 = %di',
    lHC:    '// Pilar de la Hora — TSR %rst',
    lHB:    'ramaHora = ⌊(%rh + 1) / 2⌋ mod 12 = %bi → %bc (%hrs)',
    lHS:    'troncoHora = base(%ds) + %hi = %si → %sc',
    lRC:    '// TSR = reloj + corrLong + EoT + DST',
    lRF:    'TSR = %ct + %lc\' + %eot\' + %dst\' = %rst',
  },

  pt: {
    flag: '🇧🇷', lbl: 'PT',
    title: 'Dados de Nascimento', date: 'Data', year: 'Ano', month: 'Mês', day: 'Dia',
    time: 'Hora (00:00–23:59)', city: 'Local de Nascimento',
    cityPH: 'ex: São Paulo, Brasil',
    long: 'Longitude', lat: 'Latitude', tz: 'Fuso Horário (GMT)',
    dst: 'Horário de Verão (DST)', rstLbl: 'Tempo Solar Real',
    clk: 'Relógio', corr: 'Correção',
    calc: 'Calcular Quatro Pilares',
    etitle: 'Motor de Cálculo BaZi',
    esub: 'Preencha os dados e clique em Calcular para gerar os Quatro Pilares com base no Tempo Solar Real e nos Termos Solares astronômicos.',
    errFill: '⚠ Preencha todos os campos corretamente.',
    secPil: '四柱 — Os Quatro Pilares', secLog: 'Log do Cálculo',
    pH: 'Hora · 时', pD: 'Dia · 日 ★', pM: 'Mês · 月', pY: 'Ano · 年',
    dm: 'Mestre do Dia · 日主', dmSub: 'Pilar central do mapa BaZi',
    rst: 'Tempo Solar Real · TSR',
    yr: 'Ano BaZi · 八字年', yrSub: 'Muda em 立春 (~4 Fev)',
    sun: 'Longitude Solar', sunSub: 'Calculada pela fórmula de Meeus',
    terms: 'Termos Solares de %y — indicador do mês BaZi',
    acc: '<strong>Precisão astronômica:</strong> Longitude solar pela fórmula de Meeus ±0.01° (~15 s). Termos Solares por bissecção ±1 s. Referência do pilar do dia verificada: 戊午 = 1 Jan 2000.',
    el: { Wood: 'Madeira', Fire: 'Fogo', Earth: 'Terra', Metal: 'Metal', Water: 'Água' },
    yang: 'Yang', yin: 'Yin',
    lTitle: '// Log do cálculo — %d/%m/%y',
    lSun:   '// Longitude eclíptica do Sol em %d/%m/%y',
    lJD:    '// Número do Dia Juliano (Meeus) para %d/%m/%y ao meio-dia',
    lYC:    '// Pilar do Ano — ciclo 60 desde 甲子 = 1984',
    lYS:    'troncoAno = (%Y − 4) mod 10 = %si → %sc',
    lYB:    'ramoAno = (%Y − 4) mod 12 = %bi → %bc',
    lMC:    '// Pilar do Mês — termo %tn (lon %tl°)',
    lMB:    'ramoMes = seq[%mi] = %bi → %bc',
    lMS:    'troncoMes = base(%ys) + %mi = %si → %sc',
    lDC:    '// Pilar do Dia — ref: 戊午 (idx 54) em JD 2451545',
    lDF:    'idxDia = (%jd − 2451545 + 54) mod 60 = %di',
    lHC:    '// Pilar da Hora — TSR %rst',
    lHB:    'ramoHora = ⌊(%rh + 1) / 2⌋ mod 12 = %bi → %bc (%hrs)',
    lHS:    'troncoHora = base(%ds) + %hi = %si → %sc',
    lRC:    '// TSR = relógio + corrLong + EoT + DST',
    lRF:    'TSR = %ct + %lc\' + %eot\' + %dst\' = %rst',
  },
};

/** Idioma ativo — mutável por applyLang() */
export let LANG = 'pt';

/** Retorna string traduzida pela chave. */
export function t(key) {
  return (T[LANG] || T.pt)[key] ?? key;
}

/** Traduz nome de elemento (Wood→Madeira etc.) */
export function te(el) {
  const n = T[LANG];
  return (n?.el?.[el]) ?? el;
}

/** Traduz polaridade. */
export function tp(pol) {
  return pol === 'Yang' ? t('yang') : t('yin');
}

/** Substitui tokens %x em strings traduzidas. */
export function tpl(key, map) {
  let s = t(key);
  for (const [k, v] of Object.entries(map)) {
    s = s.split(k).join(v);
  }
  return s;
}

/** Aplica idioma e atualiza referência exportada. */
export function setLang(code) {
  LANG = T[code] ? code : 'pt';
}
