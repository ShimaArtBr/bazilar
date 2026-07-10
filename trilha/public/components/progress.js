/**
 * BAZILAR · progress.js
 * Indicador de progresso "Nível X de 12" para uso inline nas páginas de nível.
 * Exporta initProgress({ current, total }) — complementa o nav.js.
 */

export function initProgress({ current = 0, total = 12 } = {}) {
  // Atualiza todos os elementos .level-progress-bar na página
  const bars = document.querySelectorAll('.level-progress-bar');
  bars.forEach(bar => {
    const fill = bar.querySelector('.level-progress-fill');
    if (fill) {
      const pct = current > 0 ? Math.round((current / total) * 100) : 0;
      fill.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', current);
      bar.setAttribute('aria-valuemax', total);
      bar.setAttribute('aria-label', `Progresso na trilha: ${current} de ${total} níveis`);
    }
  });

  // Atualiza badges .level-progress-badge
  const badges = document.querySelectorAll('.level-progress-badge');
  badges.forEach(badge => {
    badge.textContent = current > 0 ? `${current} / ${total}` : `Trilha`;
  });
}

/**
 * Retorna HTML de uma barra de progresso pronta para inserir na página.
 * Uso: document.getElementById('meu-container').innerHTML = progressBarHTML({ current: 5, total: 12 });
 */
export function progressBarHTML({ current = 0, total = 12 } = {}) {
  const pct = current > 0 ? Math.round((current / total) * 100) : 0;
  return `
    <div class="level-progress-bar"
         role="progressbar"
         aria-valuenow="${current}"
         aria-valuemin="0"
         aria-valuemax="${total}"
         aria-label="Progresso na trilha: ${current} de ${total} níveis">
      <div class="level-progress-fill" style="width:${pct}%"></div>
    </div>
    <p class="level-progress-label">Nível ${current} de ${total}</p>
  `;
}
