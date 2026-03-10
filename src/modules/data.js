/* ══════════════════════════════════════════════════
   BAZILAR — data.js
   Static data tables. Verified: Taylor Wu 2017, 三命通會, HK Observatory
══════════════════════════════════════════════════ */

export const ST=[{zh:'甲',py:'Jiǎ',el:'Wood',po:'Yang'},{zh:'乙',py:'Yǐ',el:'Wood',po:'Yin'},{zh:'丙',py:'Bǐng',el:'Fire',po:'Yang'},{zh:'丁',py:'Dīng',el:'Fire',po:'Yin'},{zh:'戊',py:'Wù',el:'Earth',po:'Yang'},{zh:'己',py:'Jǐ',el:'Earth',po:'Yin'},{zh:'庚',py:'Gēng',el:'Metal',po:'Yang'},{zh:'辛',py:'Xīn',el:'Metal',po:'Yin'},{zh:'壬',py:'Rén',el:'Water',po:'Yang'},{zh:'癸',py:'Guǐ',el:'Water',po:'Yin'}];

export const EB=[{zh:'子',py:'Zǐ',el:'Water',po:'Yang',an:'Rat',hr:'23–01'},{zh:'丑',py:'Chǒu',el:'Earth',po:'Yin',an:'Ox',hr:'01–03'},{zh:'寅',py:'Yín',el:'Wood',po:'Yang',an:'Tiger',hr:'03–05'},{zh:'卯',py:'Mǎo',el:'Wood',po:'Yin',an:'Rabbit',hr:'05–07'},{zh:'辰',py:'Chén',el:'Earth',po:'Yang',an:'Dragon',hr:'07–09'},{zh:'巳',py:'Sì',el:'Fire',po:'Yin',an:'Snake',hr:'09–11'},{zh:'午',py:'Wǔ',el:'Fire',po:'Yang',an:'Horse',hr:'11–13'},{zh:'未',py:'Wèi',el:'Earth',po:'Yin',an:'Goat',hr:'13–15'},{zh:'申',py:'Shēn',el:'Metal',po:'Yang',an:'Monkey',hr:'15–17'},{zh:'酉',py:'Yǒu',el:'Metal',po:'Yin',an:'Rooster',hr:'17–19'},{zh:'戌',py:'Xū',el:'Earth',po:'Yang',an:'Dog',hr:'19–21'},{zh:'亥',py:'Hài',el:'Water',po:'Yin',an:'Pig',hr:'21–23'}];

export const MT=[{l:315,n:'立春',py:'Lì Chūn'},{l:345,n:'惊蛰',py:'Jīng Zhé'},{l:15,n:'清明',py:'Qīng Míng'},{l:45,n:'立夏',py:'Lì Xià'},{l:75,n:'芒种',py:'Máng Zhòng'},{l:105,n:'小暑',py:'Xiǎo Shǔ'},{l:135,n:'立秋',py:'Lì Qiū'},{l:165,n:'白露',py:'Bái Lù'},{l:195,n:'寒露',py:'Hán Lù'},{l:225,n:'立冬',py:'Lì Dōng'},{l:255,n:'大雪',py:'Dà Xuě'},{l:285,n:'小寒',py:'Xiǎo Hán'}];

export const MBS=[2,3,4,5,6,7,8,9,10,11,0,1];
export const YMS=[2,4,6,8,0,2,4,6,8,0];
export const DHS=[0,2,4,6,8,0,2,4,6,8];

export const HIDDEN=[[9],[5,9,7],[0,2,4],[1],[4,1,9],[2,6,4],[3,5],[5,3,1],[6,8,4],[7],[4,7,3],[8,0]];

// C06 (2026-03-09): todos os zh corrigidos para caracteres tradicionais (繁體字).
// O binding com dez_deuses_bazi_app.json usa d.caractere === tenGod().zh como chave.
// Simplificados anteriores causavam falha silenciosa em 5 dos 10 deuses.
// @see interfaces.d.ts — TenGodResult, TenGodBinding
const TG={ss:{zh:'比肩',py:'Bǐ Jiān'},sd:{zh:'劫財',py:'Jié Cái'},os:{zh:'食神',py:'Shí Shén'},od:{zh:'傷官',py:'Shāng Guān'},is:{zh:'偏印',py:'Piān Yìn'},id:{zh:'正印',py:'Zhèng Yìn'},cs:{zh:'偏財',py:'Piān Cái'},cd:{zh:'正財',py:'Zhèng Cái'},ks:{zh:'七殺',py:'Qī Shā'},kd:{zh:'正官',py:'Zhèng Guān'}};

export function tenGod(dm,o){if(dm<0||o<0)return null;const de=Math.floor(dm/2),oe=Math.floor(o/2),sp=dm%2===o%2;const g=(de+1)%5,gm=(de+4)%5,c=(de+3)%5,cm=(de+2)%5;if(oe===de)return TG[sp?'ss':'sd'];if(oe===g)return TG[sp?'os':'od'];if(oe===gm)return TG[sp?'is':'id'];if(oe===c)return TG[sp?'ks':'kd'];if(oe===cm)return TG[sp?'cs':'cd'];return null;}

export const HARMONY6=[{a:0,b:1,el:'Earth'},{a:2,b:11,el:'Wood'},{a:3,b:10,el:'Fire'},{a:4,b:9,el:'Metal'},{a:5,b:8,el:'Water'},{a:6,b:7,el:'Earth'}];
export const HARMONY3=[{branches:[2,6,10],el:'Fire',zh:'火局'},{branches:[5,9,1],el:'Metal',zh:'金局'},{branches:[8,0,4],el:'Water',zh:'水局'},{branches:[11,3,7],el:'Wood',zh:'木局'}];
export const CLASH6=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
export const HARM6=[[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
export const PENALTY3=[{branches:[2,5,8],zh:'寅巳申',type:'arrogance'},{branches:[1,10,7],zh:'丑戌未',type:'ingratitude'},{branches:[0,3],zh:'子卯',type:'self'}];

export const TIANYI={0:[1,7],4:[1,7],6:[1,7],1:[0,8],5:[0,8],2:[11,9],3:[11,9],7:[2,6],8:[3,5],9:[3,5]};
export const TAOHUA={8:9,0:9,4:9,11:0,3:0,7:0,2:3,6:3,10:3,5:6,9:6,1:6};
export const YIMA={8:2,0:2,4:2,11:5,3:5,7:5,2:8,6:8,10:8,5:11,9:11,1:11};

export const ES={Wood:{bg:'rgba(74,128,80,.2)',tx:'#7dba82'},Fire:{bg:'rgba(196,74,53,.2)',tx:'#e05c4a'},Earth:{bg:'rgba(160,128,48,.18)',tx:'#c9a84c'},Metal:{bg:'rgba(128,144,160,.18)',tx:'#b0bec5'},Water:{bg:'rgba(58,124,184,.18)',tx:'#5b9fc9'}};

export const TZ_CC={br:-3,pt:0,es:1,fr:1,de:1,it:1,nl:1,be:1,ch:1,at:1,pl:1,cz:1,sk:1,hu:1,ro:2,bg:2,gr:2,fi:2,ee:2,lv:2,lt:2,dk:1,no:1,se:1,ie:0,gb:0,is:0,ua:2,md:2,by:3,tr:3,ma:1,dz:1,tn:1,ly:2,eg:2,ng:1,gh:0,sn:0,ci:0,ke:3,za:2,sa:3,ye:3,kw:3,iq:3,jo:2,lb:2,il:2,sy:2,cy:2,ir:3.5,pk:5,'in':5.5,np:5.75,lk:5.5,bd:6,mm:6.5,th:7,vn:7,kh:7,la:7,id:7,cn:8,hk:8,tw:8,ph:8,my:8,sg:8,kr:9,jp:9,nz:12,co:-5,ve:-4,pe:-5,cl:-4,ar:-3,bo:-4,py:-4,uy:-3,ec:-5,mx:-6,gt:-6,cr:-6,pa:-5,cu:-5,'do':-4,jm:-5};

// ── 十二長生 Twelve Life Stages ─────────────────────────────────────────────
// Decisão doutrinária C05 (2026-03-09): Escola Yang/Yin diferenciada.
// Troncos Yang → 順行 (forward, +1 mod 12).
// Troncos Yin  → 逆行 (reverse, -1 mod 12).
// Fonte canônica: 子平真詮 (Zi Ping Zhen Quan), Shen Xiaozhan, Dinastia Qing.
// Ref. cruzada:   三命通會 (San Ming Tong Hui), compilação Ming.

export const LIFE_STAGE_NAMES = [
  { seq:0,  zh:'長生', py:'Cháng Shēng', pt:'Nascimento Longo' },
  { seq:1,  zh:'沐浴', py:'Mù Yù',       pt:'Banho Ritual'     },
  { seq:2,  zh:'冠帶', py:'Guān Dài',    pt:'Vestir a Coroa'   },
  { seq:3,  zh:'臨官', py:'Lín Guān',    pt:'Assumir o Cargo'  },
  { seq:4,  zh:'帝旺', py:'Dì Wàng',     pt:'Pico Imperial'    },
  { seq:5,  zh:'衰',   py:'Shuāi',       pt:'Declínio'         },
  { seq:6,  zh:'病',   py:'Bìng',        pt:'Doença'           },
  { seq:7,  zh:'死',   py:'Sǐ',          pt:'Morte'            },
  { seq:8,  zh:'墓',   py:'Mù',          pt:'Túmulo'           },
  { seq:9,  zh:'絕',   py:'Jué',         pt:'Extinção'         },
  { seq:10, zh:'胎',   py:'Tāi',         pt:'Gestação'         },
  { seq:11, zh:'養',   py:'Yǎng',        pt:'Nutrição'         },
];

// LIFE_STAGE_START[stemIdx] = índice de Ramo (EB) onde 長生 ocorre para aquele Tronco.
// Yang stems → forward (+1 mod 12) | Yin stems → reverse (-1 mod 12).
// stemIdx:  0=甲 1=乙 2=丙 3=丁 4=戊 5=己 6=庚 7=辛 8=壬 9=癸
export const LIFE_STAGE_START = [
  11, // 甲 Yang Wood  → 長生 em 亥 (idx 11), forward
   6, // 乙 Yin  Wood  → 長生 em 午 (idx  6), reverse
   2, // 丙 Yang Fire  → 長生 em 寅 (idx  2), forward
   9, // 丁 Yin  Fire  → 長生 em 酉 (idx  9), reverse
   2, // 戊 Yang Earth → 長生 em 寅 (idx  2), forward (同丙)
   9, // 己 Yin  Earth → 長生 em 酉 (idx  9), reverse (同丁)
   5, // 庚 Yang Metal → 長生 em 巳 (idx  5), forward
   0, // 辛 Yin  Metal → 長生 em 子 (idx  0), reverse
   7, // 壬 Yang Water → 長生 em 申 (idx  7), forward
   3, // 癸 Yin  Water → 長生 em 卯 (idx  3), reverse
];
