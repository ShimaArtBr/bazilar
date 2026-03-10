/**
 * @file src/core/ten-gods.js
 * @description Fachada ESM sobre tenGod() (data.js) e calcDayMasterStrength() (pillars.js).
 *
 * STATUS: Mock funcional para E07. A função getFavorableElements() é stub — S4.
 *
 * ORIGEM DA NECESSIDADE:
 *   app.js (Maya Chen) importa: { computeTenGods, getDayMasterStrength, getFavorableElements }
 *   BAZILAR expõe: tenGod(dm, o) em data.js e calcDayMasterStrength() em pillars.js.
 *   Nomes e assinaturas divergem — este módulo faz a ponte sem alterar nenhum dos dois.
 *
 * DESIGN:
 *   computeTenGods(dmStemIdx, allStemIdxs) → mapeia tenGod() para cada stem.
 *   getDayMasterStrength(...)              → proxy direto de calcDayMasterStrength().
 *   getFavorableElements(strength)         → stub documentado, implementação em S4.
 *
 * CONFORMIDADE:
 *   - E07: mock entregue com contratos, TODOs com owner e prazo
 *   - E08: interfaces.d.ts TenGodResult já cobre {zh, py}
 *   - Função pura: sem side-effects, sem estado mutable externo
 *
 * TODO [owner: JS Engineer S2, prazo: S2·W4]:
 *   getFavorableElements() — implementação completa com lógica 喜用神.
 *   C05 (Yang/Yin 12 Estágios) — RESOLVIDO 2026-03-09. Ver pillars.getLifeStage().
 *
 * @see plano-infra.md §S1 — Módulos ausentes (E07)
 * @see interfaces.d.ts — TenGodResult
 * @owner JS Engineer S1
 * @sprint S1·W1 (mock) / S2·W4 (getFavorableElements completo)
 */

import { tenGod } from '../modules/data.js';
import { calcDayMasterStrength } from '../modules/pillars.js';
import { FLAGS } from '../config/flags.js';

// ── computeTenGods ────────────────────────────────────────────────────────────

/**
 * Calcula os 10 Deuses (十神) de cada Tronco Celestial em relação ao Mestre do Dia.
 *
 * Mapeia tenGod(dmStemIdx, stemIdx) para cada elemento de allStemIdxs,
 * preservando o stemIdx original no resultado para rastreabilidade.
 *
 * FLAGS: BAZI_STEMS_V2 reservado para futura integração com hiddenStems.adapter.js
 *   (ponderação Sīlìng proporcional nos 10 Deuses de ramos). Não implementado em S1.
 *
 * @param {number}   dmStemIdx   - Índice do Tronco do Mestre do Dia (0–9)
 * @param {number[]} allStemIdxs - Índices dos Troncos a classificar
 * @returns {Array<{ stemIdx: number, tenGod: { zh: string, py: string } }>}
 *   Array com mesmo comprimento de allStemIdxs. Itens com tenGod=null são filtrados
 *   para stems inválidos (< 0) — não ocorre em uso normal.
 *
 * @example
 *   computeTenGods(0, [0, 6, 8])
 *   // → [
 *   //     { stemIdx: 0, tenGod: { zh: '比肩', py: 'Bǐ Jiān' } },
 *   //     { stemIdx: 6, tenGod: { zh: '七杀', py: 'Qī Shā'  } },
 *   //     { stemIdx: 8, tenGod: { zh: '偏印', py: 'Piān Yìn'} },
 *   //   ]
 */
export function computeTenGods(dmStemIdx, allStemIdxs) {
  if (!Array.isArray(allStemIdxs) || allStemIdxs.length === 0) return [];

  // TODO S2·W4 [owner: JS Engineer S2]: quando BAZI_STEMS_V2=1, ponderar
  // tenGod dos ramos pela força dinâmica de Qi via hiddenStems.adapter.js.
  // FLAGS.BAZI_STEMS_V2 verificado aqui para extensão futura sem refactor.
  void FLAGS.BAZI_STEMS_V2; // reservado

  return allStemIdxs.map(stemIdx => {
    const tg = tenGod(dmStemIdx, stemIdx);
    return {
      stemIdx,
      tenGod: tg ?? { zh: '—', py: '—' }, // fallback defensivo para stems inválidos
    };
  });
}

// ── getDayMasterStrength ──────────────────────────────────────────────────────

/**
 * Calcula a força do Mestre do Dia (日主強弱).
 * Proxy direto sobre calcDayMasterStrength() de pillars.js.
 *
 * Relações de score:
 *   比劫 (mesmo elemento)   → +1.0 (enraíza o DM)
 *   食伤 (DM gera)          → −0.7 (drena output do DM)
 *   财   (DM controla)      → −0.6 (DM gasta energia no controle)
 *   官杀 (controla o DM)    → −0.9 (suprime o DM)
 *   印   (gera o DM)        → +0.8 (nutre o DM)
 *
 * @param {number}   dmStemIdx            - Índice do Tronco do Mestre do Dia (0–9)
 * @param {number[]} stems                - Índices dos 4 Troncos dos pilares
 * @param {number[]} branchIdxs           - Índices dos 4 Ramos dos pilares
 * @param {number}   monthBranchPillarIdx - Posição do Ramo do Mês em branchIdxs (padrão: 2)
 * @returns {{ score: number, strong: boolean, favorable: string[], unfavorable: string[], dmEl: string }}
 */
export function getDayMasterStrength(dmStemIdx, stems, branchIdxs, monthBranchPillarIdx) {
  return calcDayMasterStrength(dmStemIdx, stems, branchIdxs, monthBranchPillarIdx);
}

// ── getFavorableElements ──────────────────────────────────────────────────────

/**
 * Determina os elementos favoráveis (喜用神 Xǐ Yòng Shén) e desfavoráveis (忌神 Jì Shén).
 *
 * STATUS: STUB — retorna os campos já calculados por getDayMasterStrength().
 *   A lógica completa (análise de Estrutura Especial, Fluxo, inverso) é S4.
 *
 * TODO [owner: JS Engineer S2, prazo: S2·W4]:
 *   Implementar análise completa de 喜用神:
 *   1. Verificar Estruturas Especiais (從格, 化格) — podem inverter favorable/unfavorable
 *   2. Considerar fluxo dos Grandes Ciclos (Da Yun) no cálculo de tendência
 *   3. C05 (Yang/Yin 12 Estágios順逆) — RESOLVIDO 2026-03-09.
 *      Escola Yang/Yin diferenciada (子平真詮). Ver data.js LIFE_STAGE_* e pillars.getLifeStage().
 *      帝旺(seq4)/長生(seq0) reforçam força; 絕(seq9)/墓(seq8) enfraquecem — integrar em S2·W4.
 *
 * @param {{ score: number, strong: boolean, favorable: string[], unfavorable: string[], dmEl: string }} strength
 *   Resultado de getDayMasterStrength()
 * @returns {{ favorable: string[], unfavorable: string[] }}
 */
export function getFavorableElements(strength) {
  // Stub: propaga o que calcDayMasterStrength já computou.
  // Em S4, esta função adicionará análise de Estrutura Especial e Fluxo.
  if (!strength || typeof strength !== 'object') {
    return { favorable: [], unfavorable: [] };
  }
  return {
    favorable:   Array.isArray(strength.favorable)   ? strength.favorable   : [],
    unfavorable: Array.isArray(strength.unfavorable) ? strength.unfavorable : [],
  };
}
