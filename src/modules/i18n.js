/* ══════════════════════════════════════════════════
   BAZILAR — i18n.js — PT único
   Versão simplificada: somente Português do Brasil
══════════════════════════════════════════════════ */

export const LANG = 'pt';

/* Mantido como objeto para compatibilidade com
   todos os módulos que usam T[code] */
export const T = {
pt:{
  title:'Dados de Nascimento',
  name:'Nome / Apelido',namePH:'como deseja ser chamado(a)',
  date:'Data',
  time:'Hora (00:00 – 23:59)',
  city:'Local de Nascimento (bairro, cidade, país)',cityPH:'bairro, cidade, país',
  coords:'Coordenadas',
  tz:'Fuso Horário (GMT)',
  dst:'Horário de Verão (DST)',
  rstLbl:'Tempo Solar Real',
  gender:'Gênero Biológico',gF:'Feminino',gM:'Masculino',
  advanced:'Opções avançadas',dflt:'PADRÃO',
  earlyDesc:'23:00–23:59 usa o tronco do dia seguinte. Método clássico (子平真詮).',
  lateDesc:'23:00–23:59 é hora 子 do mesmo dia. Método simplificado.',
  hemiLabel:'Hemisfério',
  hemiN:'Norte ↑', hemiS:'Sul ↓',
  hemiNDesc:'BaZi clássico — posições solares universais. Padrão recomendado.',
  hemiSDesc:'Inversão sazonal: ramo do mês +6. Para validação no Hemisfério Sul.',
  hemiNotice:'Hemisfério Sul — inversão sazonal ativa no pilar do mês.',
  clk:'Relógio',corr:'Correção',
  calc:'Calcular Quatro Pilares',
  etitle:'Motor de Cálculo BaZi',
  esub:'Preencha os dados e clique em Calcular para gerar os Quatro Pilares com Tempo Solar Real, Troncos Ocultos, Grandes Ciclos, Estrelas Simbólicas e Interações.',
  errFill:'⚠ Preencha todos os campos corretamente.',
  errGender:'⚠ Selecione o gênero biológico.',
  secPil:'四柱 — Os Quatro Pilares',
  secLog:'Log do Cálculo',
  secElem:'五行 — Balanço dos 5 Elementos',
  secLuck:'大運 — Grandes Ciclos (10 Anos)',
  secStars:'神煞 — Estrelas Simbólicas',
  secInteract:'Interações entre Ramos Terrestres',
  pH:'Hora · 时',pD:'Dia · 日 ★',pM:'Mês · 月',pY:'Ano · 年',
  dm:'Mestre do Dia · 日主',dmSub:'Pilar central do mapa',
  rst:'Tempo Solar Real · TSR',
  yr:'Ano BaZi · 八字年',yrSub:'Muda em 立春 (~4 Fev)',
  sun:'Longitude Solar',sunSub:'Meeus ±0.01°',
  terms:'Termos Solares de %y',
  luckDir:'Direção',luckFwd:'Crescente ⟳',luckBwd:'Decrescente ⟲',luckStart:'Início na idade',
  ziNotice:'Aviso hora Zǐ: nascimento entre 23:00–00:59. Método: %method.',
  acc:'Precisão astronômica: Meeus ±0.01° (~15 s). Termos Solares ±1 s. Ref: 戊午 = 1 Jan 2000.',
  el:{Wood:'Madeira',Fire:'Fogo',Earth:'Terra',Metal:'Metal',Water:'Água'},
  yang:'Yang',yin:'Yin',
  an:{
    Rat:'Rato',Ox:'Boi',Tiger:'Tigre',Rabbit:'Coelho',Dragon:'Dragão',
    Snake:'Serpente',Horse:'Cavalo',Goat:'Cabra',Monkey:'Macaco',
    Rooster:'Galo',Dog:'Cão',Pig:'Porco'
  },
  srcYear:'ano',srcDay:'dia',starFound:'— presente',
  harmony6:'Seis Harmonias',harmony3:'Três Harmonias',
  clash:'Choque',harm:'Dano',penalty:'Penalidade',
  produces:'produz',office:'escritório',greet:'Mapa de',
  starTianYi:'TianYi 天乙 (Boa Fortuna)',
  starTaoHua:'TaoHua 桃花 (Flor de Pêssego)',
  starYiMa:'YiMa 驛馬 (Cavalo Viajante)',
  lTitle:'// Log — %d/%m/%y',
  lSun:'// Lon eclíptica %d/%m/%y',
  lJD:'// Dia Juliano %d/%m/%y',
  lYC:'// Pilar Ano — 甲子=1984',
  lYS:'tAno=(%Y−4)mod10=%si→%sc',
  lYB:'rAno=(%Y−4)mod12=%bi→%bc',
  lMC:'// Pilar Mês — %tn(%tl°)',
  lMB:'rMes=seq[%mi]=%bi→%bc',
  lMS:'tMes=base(%ys)+%mi=%si→%sc',
  lDC:'// Pilar Dia — 戊午(54)JD2451545',
  lDF:'idxDia=(%jd−2451545+54)mod60=%di',
  lHC:'// Pilar Hora — TSR%rst',
  lHB:'rHora=⌊(%rh+1)/2⌋mod12=%bi→%bc(%hrs)',
  lHS:'tHora=base(%ds)+%hi=%si→%sc',
  lRC:'// TSR=relógio+lon+EoT+DST',
  lRF:'TSR=%ct+%lc\'+%eot\'+%dst\'=%rst',
  secStrength:'日主強弱 — Força do Mestre do Dia',
  dmStrong:'Forte (旺)', dmWeak:'Fraco (弱)',
  dmScore:'Pontuação',
  dmFav:'Elementos Favoráveis (用神)',
  dmUnfav:'Elementos Desfavoráveis (忌神)',
  pdfExport:'Exportar PDF',
},
};

/* setLang mantido por compatibilidade — no-op em versão PT-only */
export function setLang(code) { /* PT-only — sem efeito */ }

export function t(k)   { return T.pt[k] || k; }
export function te(e)  { return (T.pt.el && T.pt.el[e]) ? T.pt.el[e] : e; }
export function tp(p)  { return p === 'Yang' ? T.pt.yang : T.pt.yin; }
export function tan(a) { return (T.pt.an && T.pt.an[a]) ? T.pt.an[a] : a; }
export function tsrc(s){ if(!s) return ''; return s==='year'?T.pt.srcYear:s==='day'?T.pt.srcDay:s; }
export function tpl(key, map) {
  let s = t(key);
  Object.keys(map).forEach(function(k){ s = s.split(k).join(map[k]); });
  return s;
}
