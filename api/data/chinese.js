/**
 * chinese.js — Dados tradicionais do sistema BaZi
 * CONFIDENCIAL — não referenciar em nenhum arquivo sob public/
 * Fontes: 子平真詮, 三命通會, 滴天髓
 */
'use strict';

const EL_IDX  = { Wood: 0, Fire: 1, Earth: 2, Metal: 3, Water: 4 };
const EL_NAME = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

const ST = [
  { zh: '甲', py: 'Jiǎ',  el: 'Wood',  po: 'Yang', elIdx: 0 },
  { zh: '乙', py: 'Yǐ',   el: 'Wood',  po: 'Yin',  elIdx: 0 },
  { zh: '丙', py: 'Bǐng', el: 'Fire',  po: 'Yang', elIdx: 1 },
  { zh: '丁', py: 'Dīng', el: 'Fire',  po: 'Yin',  elIdx: 1 },
  { zh: '戊', py: 'Wù',   el: 'Earth', po: 'Yang', elIdx: 2 },
  { zh: '己', py: 'Jǐ',   el: 'Earth', po: 'Yin',  elIdx: 2 },
  { zh: '庚', py: 'Gēng', el: 'Metal', po: 'Yang', elIdx: 3 },
  { zh: '辛', py: 'Xīn',  el: 'Metal', po: 'Yin',  elIdx: 3 },
  { zh: '壬', py: 'Rén',  el: 'Water', po: 'Yang', elIdx: 4 },
  { zh: '癸', py: 'Guǐ',  el: 'Water', po: 'Yin',  elIdx: 4 },
];

const EB = [
  { zh: '子', py: 'Zǐ',   el: 'Water', po: 'Yang', an: 'Rat',     hr: '23–01', elIdx: 4 },
  { zh: '丑', py: 'Chǒu', el: 'Earth', po: 'Yin',  an: 'Ox',      hr: '01–03', elIdx: 2 },
  { zh: '寅', py: 'Yín',  el: 'Wood',  po: 'Yang', an: 'Tiger',   hr: '03–05', elIdx: 0 },
  { zh: '卯', py: 'Mǎo',  el: 'Wood',  po: 'Yin',  an: 'Rabbit',  hr: '05–07', elIdx: 0 },
  { zh: '辰', py: 'Chén', el: 'Earth', po: 'Yang', an: 'Dragon',  hr: '07–09', elIdx: 2 },
  { zh: '巳', py: 'Sì',   el: 'Fire',  po: 'Yin',  an: 'Snake',   hr: '09–11', elIdx: 1 },
  { zh: '午', py: 'Wǔ',   el: 'Fire',  po: 'Yang', an: 'Horse',   hr: '11–13', elIdx: 1 },
  { zh: '未', py: 'Wèi',  el: 'Earth', po: 'Yin',  an: 'Goat',    hr: '13–15', elIdx: 2 },
  { zh: '申', py: 'Shēn', el: 'Metal', po: 'Yang', an: 'Monkey',  hr: '15–17', elIdx: 3 },
  { zh: '酉', py: 'Yǒu',  el: 'Metal', po: 'Yin',  an: 'Rooster', hr: '17–19', elIdx: 3 },
  { zh: '戌', py: 'Xū',   el: 'Earth', po: 'Yang', an: 'Dog',     hr: '19–21', elIdx: 2 },
  { zh: '亥', py: 'Hài',  el: 'Water', po: 'Yin',  an: 'Pig',     hr: '21–23', elIdx: 4 },
];

const MT = [
  { l: 315, n: '立春', py: 'Lì Chūn',    season: 0 },
  { l: 345, n: '惊蛰', py: 'Jīng Zhé',   season: 0 },
  { l:  15, n: '清明', py: 'Qīng Míng',  season: 0 },
  { l:  45, n: '立夏', py: 'Lì Xià',     season: 1 },
  { l:  75, n: '芒种', py: 'Máng Zhòng', season: 1 },
  { l: 105, n: '小暑', py: 'Xiǎo Shǔ',  season: 1 },
  { l: 135, n: '立秋', py: 'Lì Qiū',    season: 2 },
  { l: 165, n: '白露', py: 'Bái Lù',    season: 2 },
  { l: 195, n: '寒露', py: 'Hán Lù',    season: 2 },
  { l: 225, n: '立冬', py: 'Lì Dōng',   season: 3 },
  { l: 255, n: '大雪', py: 'Dà Xuě',    season: 3 },
  { l: 285, n: '小寒', py: 'Xiǎo Hán',  season: 3 },
];

// Hastes Ocultas com pesos percentuais (三命通會)
const CG = [
  [{ s: 9, w: 100 }],
  [{ s: 5, w: 60 }, { s: 9, w: 30 }, { s: 7, w: 10 }],
  [{ s: 0, w: 60 }, { s: 2, w: 30 }, { s: 4, w: 10 }],
  [{ s: 1, w: 100 }],
  [{ s: 4, w: 60 }, { s: 1, w: 30 }, { s: 9, w: 10 }],
  [{ s: 2, w: 60 }, { s: 6, w: 30 }, { s: 4, w: 10 }],
  [{ s: 3, w: 60 }, { s: 5, w: 40 }],
  [{ s: 5, w: 60 }, { s: 3, w: 30 }, { s: 1, w: 10 }],
  [{ s: 6, w: 60 }, { s: 8, w: 30 }, { s: 4, w: 10 }],
  [{ s: 7, w: 100 }],
  [{ s: 4, w: 60 }, { s: 7, w: 30 }, { s: 3, w: 10 }],
  [{ s: 8, w: 60 }, { s: 0, w: 40 }],
];

// Fatores sazonais (旺相休囚死) — [estação][elemento]
// 0=Wood 1=Fire 2=Earth 3=Metal 4=Water
const SEASONAL_FACTOR = [
  [1.2, 0.8, 0.5, 0.3, 0.8],  // Primavera
  [0.8, 1.2, 1.0, 0.5, 0.3],  // Verão
  [0.3, 0.5, 1.0, 1.2, 0.8],  // Outono
  [0.8, 0.3, 0.5, 0.8, 1.2],  // Inverno
];

const MBS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];
const YMS = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
const DHS = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];

const TG = {
  ss: { zh: '比肩', py: 'Bǐ Jiān',    en: 'Friend',            cat: 'peer'     },
  sd: { zh: '劫财', py: 'Jié Cái',    en: 'Rob Wealth',        cat: 'peer'     },
  os: { zh: '食神', py: 'Shí Shén',   en: 'Eating God',        cat: 'output'   },
  od: { zh: '伤官', py: 'Shāng Guān', en: 'Hurting Officer',   cat: 'output'   },
  is: { zh: '偏印', py: 'Piān Yìn',   en: 'Indirect Resource', cat: 'resource' },
  id: { zh: '正印', py: 'Zhèng Yìn',  en: 'Direct Resource',   cat: 'resource' },
  cs: { zh: '偏财', py: 'Piān Cái',   en: 'Indirect Wealth',   cat: 'wealth'   },
  cd: { zh: '正财', py: 'Zhèng Cái',  en: 'Direct Wealth',     cat: 'wealth'   },
  ks: { zh: '七杀', py: 'Qī Shā',     en: 'Seven Killings',    cat: 'power'    },
  kd: { zh: '正官', py: 'Zhèng Guān', en: 'Direct Officer',    cat: 'power'    },
};

const SIX_HARMONIES = [
  { pair: [0, 1],  result: 'Earth', n: '子丑合土' },
  { pair: [2, 10], result: 'Fire',  n: '寅戌合火' },
  { pair: [3, 9],  result: 'Fire',  n: '卯酉合火' },
  { pair: [4, 8],  result: 'Water', n: '辰申合水' },
  { pair: [5, 6],  result: 'Wood',  n: '巳午合木' },
  { pair: [7, 11], result: 'Wood',  n: '未亥合木' },
];

const THREE_HARMONIES = [
  { set: [2, 6, 10],  result: 'Fire',  n: '寅午戌三合火' },
  { set: [3, 7, 11],  result: 'Wood',  n: '卯未亥三合木' },
  { set: [4, 8, 0],   result: 'Water', n: '辰申子三合水' },
  { set: [5, 9, 1],   result: 'Metal', n: '巳酉丑三合金' },
];

const SIX_CLASHES = [
  { pair: [0, 6],  n: '子午冲', severity: 'high'   },
  { pair: [1, 7],  n: '丑未冲', severity: 'medium' },
  { pair: [2, 8],  n: '寅申冲', severity: 'high'   },
  { pair: [3, 9],  n: '卯酉冲', severity: 'high'   },
  { pair: [4, 10], n: '辰戌冲', severity: 'medium' },
  { pair: [5, 11], n: '巳亥冲', severity: 'high'   },
];

const PENALTIES = [
  { set:  [2, 5, 8],  n: '寅巳申三刑', type: 'ungrateful' },
  { set:  [1, 4, 7],  n: '丑戌未三刑', type: 'power'      },
  { pair: [0, 0],     n: '子刑子',      type: 'self'       },
  { pair: [3, 3],     n: '卯刑卯',      type: 'self'       },
  { pair: [6, 6],     n: '午刑午',      type: 'self'       },
  { pair: [9, 9],     n: '酉刑酉',      type: 'self'       },
  { pair: [10, 11],   n: '戌亥相刑',    type: 'rude'       },
];

const HARMS = [
  { pair: [0, 7],  n: '子未害' },
  { pair: [1, 6],  n: '丑午害' },
  { pair: [2, 9],  n: '寅酉害' },
  { pair: [3, 8],  n: '卯申害' },
  { pair: [4, 11], n: '辰亥害' },
  { pair: [5, 10], n: '巳戌害' },
];

const DESTRUCTIONS = [
  { pair: [0, 3],  n: '子卯破' },
  { pair: [1, 10], n: '丑戌破' },
  { pair: [2, 11], n: '寅亥破' },
  { pair: [4, 1],  n: '辰丑破' },
  { pair: [5, 8],  n: '巳申破' },
  { pair: [6, 9],  n: '午酉破' },
];

const TWELVE_PHASES = ['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養'];
const GROWTH_START  = { 0: 11, 2: 2, 4: 2, 6: 5, 8: 8 };

module.exports = {
  ST, EB, MT, CG, MBS, YMS, DHS, TG,
  EL_IDX, EL_NAME, SEASONAL_FACTOR,
  SIX_HARMONIES, THREE_HARMONIES,
  SIX_CLASHES, PENALTIES, HARMS, DESTRUCTIONS,
  TWELVE_PHASES, GROWTH_START,
};
