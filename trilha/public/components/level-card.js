/**
 * BAZILAR · level-card.js
 * Componente de card de nível para uso no index.html da trilha.
 * Exporta renderLevelCards(containerId, levels) para renderização dinâmica.
 */

/**
 * Dados padrão dos 12 níveis.
 * Pode ser sobrescrito passando um array customizado para renderLevelCards.
 */
export const LEVELS = [
  { num: 1,  glyph: '無', name: 'O Vazio Primordial',               group: 'A Raiz',       question: 'De onde tudo começa?',                 interactive: false, href: 'src/levels/level-01.html' },
  { num: 2,  glyph: '陰', name: 'A Primeira Divisão',               group: 'A Raiz',       question: 'Por que existe dualidade?',             interactive: false, href: 'src/levels/level-02.html' },
  { num: 3,  glyph: '道', name: 'A Cosmogênese',                    group: 'A Raiz',       question: 'Como o universo se desdobra?',           interactive: false, href: 'src/levels/level-03.html' },
  { num: 4,  glyph: '卦', name: 'Os Oito Trigramas',                group: 'O Tronco',     question: 'Como a dualidade gera complexidade?',    interactive: false, href: 'src/levels/level-04.html' },
  { num: 5,  glyph: '行', name: 'As Cinco Fases',                   group: 'O Tronco',     question: 'Como a energia se move?',               interactive: true,  href: 'src/levels/level-05.html' },
  { num: 6,  glyph: '干', name: 'Os Dez Troncos',                   group: 'Os Galhos',    question: 'Quais são as qualidades do Céu?',        interactive: true,  href: 'src/levels/level-06.html' },
  { num: 7,  glyph: '支', name: 'Os Doze Ramos',                    group: 'Os Galhos',    question: 'Quais são as qualidades da Terra?',      interactive: true,  href: 'src/levels/level-07.html' },
  { num: 8,  glyph: '甲', name: 'O Ciclo de Sessenta',              group: 'Os Galhos',    question: 'Como Céu e Terra se combinam?',         interactive: false, href: 'src/levels/level-08.html' },
  { num: 9,  glyph: '柱', name: 'O Mapa dos Quatro Pilares',        group: 'As Folhas',    question: 'O que é o meu BaZi?',                   interactive: true,  href: 'src/levels/level-09.html' },
  { num: 10, glyph: '神', name: 'O Mestre do Dia e os Dez Deuses',  group: 'As Folhas',    question: 'Quem sou eu neste mapa?',               interactive: true,  href: 'src/levels/level-10.html' },
  { num: 11, glyph: '運', name: 'Os Grandes Ciclos',                group: 'Os Frutos',    question: 'Como o tempo me transforma?',           interactive: false, href: 'src/levels/level-11.html' },
  { num: 12, glyph: '生', name: 'Os 12 Estágios de Vida',           group: 'Os Frutos',    question: 'Em que fase estou agora?',              interactive: true,  href: 'src/levels/level-12.html' },
];

/**
 * Gera o HTML de um único card de nível.
 * @param {Object} level - Dados do nível (ver LEVELS acima)
 * @param {boolean} locked - Se verdadeiro, renderiza card bloqueado
 * @returns {string} HTML string
 */
export function levelCardHTML(level, locked = false) {
  if (locked) {
    return `<div class="trail-card locked" data-glyph="${level.glyph}" role="listitem" aria-hidden="true"></div>`;
  }

  const interactiveBadge = level.interactive
    ? `<span style="color:var(--gold);font-size:.5rem"> ● INTERATIVO</span>`
    : '';

  return `
    <a class="trail-card"
       href="${level.href}"
       data-glyph="${level.glyph}"
       role="listitem"
       aria-label="Nível ${level.num} — ${level.name}${level.interactive ? ' · Interativo' : ''}">
      <span class="trail-num">NÍVEL ${String(level.num).padStart(2, '0')}${interactiveBadge}</span>
      <span class="trail-name">${level.name}</span>
      <span class="trail-group">${level.group}</span>
      <span class="trail-question">${level.question}</span>
    </a>`;
}

/**
 * Renderiza todos os cards de nível em um container existente no DOM.
 * O container deve ter os elementos .trail-grid com role="list".
 *
 * @param {string} containerId - ID do elemento pai (ex: 'trail-root')
 * @param {Array}  levels      - Array de níveis (padrão: LEVELS)
 */
export function renderLevelCards(containerId, levels = LEVELS) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Grupos de níveis
  const groups = [
    { label: 'A Raiz · Níveis 1–3',    nums: [1, 2, 3],       locked: [] },
    { label: 'O Tronco · Níveis 4–5',  nums: [4, 5],          locked: [null] },
    { label: 'Os Galhos · Níveis 6–8', nums: [6, 7, 8],       locked: [] },
    { label: 'As Folhas · Níveis 9–10',nums: [9, 10],         locked: [null] },
    { label: 'Os Frutos · Níveis 11–12',nums: [11, 12],       locked: [null] },
  ];

  let html = '';
  groups.forEach(group => {
    html += `<div class="trail-group-label">${group.label}</div>`;
    html += `<div class="trail-grid" role="list">`;

    group.nums.forEach(num => {
      const level = levels.find(l => l.num === num);
      if (level) html += levelCardHTML(level);
    });

    // Células bloqueadas para completar o grid de 3
    const total = group.nums.length + group.locked.length;
    const needed = total < 3 ? 3 - total : 0;
    for (let i = 0; i < needed; i++) {
      html += `<div class="trail-card locked" role="listitem" aria-hidden="true"></div>`;
    }

    html += `</div>`;
  });

  container.innerHTML = html;
}
