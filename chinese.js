/**
 * chinese.js — Dados tradicionais do sistema BaZi
 *
 * CONFIDENCIAL — não referenciar em nenhum arquivo sob public/
 * Todas as constantes verificadas contra três fontes clássicas.
 */

'use strict';

// ─────────────────────────────────────────────
// DEZ TRONCOS CELESTIAIS (天干 Tiāngān)
// ─────────────────────────────────────────────
// Índice 0–9; par = Yang, ímpar = Yin
const ST = [
  { zh: '甲', py: 'Jiǎ',  el: 'Wood',  po: 'Yang' },
  { zh: '乙', py: 'Yǐ',   el: 'Wood',  po: 'Yin'  },
  { zh: '丙', py: 'Bǐng', el: 'Fire',  po: 'Yang' },
  { zh: '丁', py: 'Dīng', el: 'Fire',  po: 'Yin'  },
  { zh: '戊', py: 'Wù',   el: 'Earth', po: 'Yang' },
  { zh: '己', py: 'Jǐ',   el: 'Earth', po: 'Yin'  },
  { zh: '庚', py: 'Gēng', el: 'Metal', po: 'Yang' },
  { zh: '辛', py: 'Xīn',  el: 'Metal', po: 'Yin'  },
  { zh: '壬', py: 'Rén',  el: 'Water', po: 'Yang' },
  { zh: '癸', py: 'Guǐ',  el: 'Water', po: 'Yin'  },
];

// ─────────────────────────────────────────────
// DOZE RAMOS TERRESTRES (地支 Dìzhī)
// ─────────────────────────────────────────────
const EB = [
  { zh: '子', py: 'Zǐ',   el: 'Water', po: 'Yang', an: 'Rat',     hr: '23–01' },
  { zh: '丑', py: 'Chǒu', el: 'Earth', po: 'Yin',  an: 'Ox',      hr: '01–03' },
  { zh: '寅', py: 'Yín',  el: 'Wood',  po: 'Yang', an: 'Tiger',   hr: '03–05' },
  { zh: '卯', py: 'Mǎo',  el: 'Wood',  po: 'Yin',  an: 'Rabbit',  hr: '05–07' },
  { zh: '辰', py: 'Chén', el: 'Earth', po: 'Yang', an: 'Dragon',  hr: '07–09' },
  { zh: '巳', py: 'Sì',   el: 'Fire',  po: 'Yin',  an: 'Snake',   hr: '09–11' },
  { zh: '午', py: 'Wǔ',   el: 'Fire',  po: 'Yang', an: 'Horse',   hr: '11–13' },
  { zh: '未', py: 'Wèi',  el: 'Earth', po: 'Yin',  an: 'Goat',    hr: '13–15' },
  { zh: '申', py: 'Shēn', el: 'Metal', po: 'Yang', an: 'Monkey',  hr: '15–17' },
  { zh: '酉', py: 'Yǒu',  el: 'Metal', po: 'Yin',  an: 'Rooster', hr: '17–19' },
  { zh: '戌', py: 'Xū',   el: 'Earth', po: 'Yang', an: 'Dog',     hr: '19–21' },
  { zh: '亥', py: 'Hài',  el: 'Water', po: 'Yin',  an: 'Pig',     hr: '21–23' },
];

// ─────────────────────────────────────────────
// TERMOS SOLARES (節氣 Jiéqì) — os 12 que definem meses BaZi
// Apenas os Jié (節), não os Zhōngqì
// ─────────────────────────────────────────────
const MT = [
  { l: 315, n: '立春', py: 'Lì Chūn'   },  // 0  início Primavera
  { l: 345, n: '惊蛰', py: 'Jīng Zhé'  },  // 1  Despertar Insetos
  { l:  15, n: '清明', py: 'Qīng Míng' },  // 2  Clareza e Brilho
  { l:  45, n: '立夏', py: 'Lì Xià'    },  // 3  início Verão
  { l:  75, n: '芒种', py: 'Máng Zhòng'},  // 4  Grão em Espiga
  { l: 105, n: '小暑', py: 'Xiǎo Shǔ' },  // 5  Pequeno Calor
  { l: 135, n: '立秋', py: 'Lì Qiū'   },  // 6  início Outono
  { l: 165, n: '白露', py: 'Bái Lù'   },  // 7  Orvalho Branco
  { l: 195, n: '寒露', py: 'Hán Lù'   },  // 8  Orvalho Frio
  { l: 225, n: '立冬', py: 'Lì Dōng'  },  // 9  início Inverno
  { l: 255, n: '大雪', py: 'Dà Xuě'   },  // 10 Grande Neve
  { l: 285, n: '小寒', py: 'Xiǎo Hán' },  // 11 Pequeno Frio
];

// ─────────────────────────────────────────────
// TABELAS DE DERIVAÇÃO DOS PILARES
// ─────────────────────────────────────────────

// Ramo do mês para cada índice de termo (0–11)
const MBS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];

// Base do tronco do mês por tronco do ano (índice 0–9)
// Ex: ano com tronco 甲(0) ou 己(5) → meses começam em 丙(2)
const YMS = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];

// Base do tronco da hora por tronco do dia (índice 0–9)
const DHS = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];

// ─────────────────────────────────────────────
// DEZ DEUSES (十神 Shíshén)
// ─────────────────────────────────────────────
const TG = {
  ss: { zh: '比肩', py: 'Bǐ Jiān'    },   // Same-polarity same-element
  sd: { zh: '劫财', py: 'Jié Cái'    },   // Diff-polarity same-element
  os: { zh: '食神', py: 'Shí Shén'   },   // Output same
  od: { zh: '伤官', py: 'Shāng Guān' },   // Output diff
  is: { zh: '偏印', py: 'Piān Yìn'   },   // Resource same
  id: { zh: '正印', py: 'Zhèng Yìn'  },   // Resource diff
  cs: { zh: '偏财', py: 'Piān Cái'   },   // Wealth same
  cd: { zh: '正财', py: 'Zhèng Cái'  },   // Wealth diff
  ks: { zh: '七杀', py: 'Qī Shā'     },   // Power same
  kd: { zh: '正官', py: 'Zhèng Guān' },   // Power diff
};

// ─────────────────────────────────────────────
// HASTES OCULTAS (藏干 Cánggān)
// Verificadas contra 3 fontes clássicas
// ─────────────────────────────────────────────
// Índice = ramo (0–11); cada entrada: tronco principal primeiro
const CG = [
  [{ s: 9 }],                         // 子: 癸
  [{ s: 5 }, { s: 9 }, { s: 7 }],    // 丑: 己癸辛
  [{ s: 0 }, { s: 2 }, { s: 4 }],    // 寅: 甲丙戊
  [{ s: 1 }],                         // 卯: 乙
  [{ s: 4 }, { s: 1 }, { s: 9 }],    // 辰: 戊乙癸
  [{ s: 2 }, { s: 6 }, { s: 4 }],    // 巳: 丙庚戊
  [{ s: 3 }, { s: 5 }],              // 午: 丁己
  [{ s: 5 }, { s: 3 }, { s: 1 }],    // 未: 己丁乙
  [{ s: 6 }, { s: 8 }, { s: 4 }],    // 申: 庚壬戊
  [{ s: 7 }],                         // 酉: 辛
  [{ s: 4 }, { s: 7 }, { s: 3 }],    // 戌: 戊辛丁
  [{ s: 8 }, { s: 0 }],              // 亥: 壬甲
];

module.exports = { ST, EB, MT, MBS, YMS, DHS, TG, CG };
