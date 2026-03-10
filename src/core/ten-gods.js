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
 * Implementação S4 — escola 子平真詮 (ZPZQ).
 *
 * ALGORITMO:
 *   1. 從格 detection (Cóng Gé — Estrutura de Rendição):
 *      Se score extremamente negativo E balanço mostra elemento único dominante (≥ 70% presença),
 *      o DM "segue" o elemento dominante — inverter favorable/unfavorable.
 *   2. Caso padrão (普通格):
 *      - DM forte (strong=true) + 得令 (deLing): precisa drenar → 食傷, 財, 官殺 favorecem
 *      - DM forte sem 得令: moderadamente forte → drenar, mas 印 neutro (não bloqueador)
 *      - DM fraco (!strong): precisa suporte → 比劫, 印 favorecem; resto desfavorável
 *   3. Limites de score para nuance:
 *      - score > +3.0: DM excessivamente forte → 官殺 como 用神 principal
 *      - score < -3.0 sem 從格: DM muito fraco → 印 como 用神 principal
 *
 * @param {{ score: number, strong: boolean, favorable: string[], unfavorable: string[],
 *           dmEl: string, deLing: boolean }} strength
 *   Resultado de getDayMasterStrength() — inclui deLing (S4).
 * @param {{ balance?: Object<string,number> }} [context]
 *   Contexto opcional do mapa. balance = { Wood, Fire, Earth, Metal, Water } de elemBalance().
 * @returns {{ favorable: string[], unfavorable: string[], yongShen: string|null,
 *             xiShen: string[], jiShen: string[], congGe: boolean }}
 *   yongShen: elemento 用神 principal (mais necessário)
 *   xiShen:   elementos 喜神 (auxiliares favoráveis)
 *   jiShen:   elementos 忌神 (desfavoráveis)
 *   congGe:   true se Estrutura de Rendição detectada
 */
export function getFavorableElements(strength, context = {}) {
  if (!strength || typeof strength !== 'object') {
    return { favorable: [], unfavorable: [], yongShen: null, xiShen: [], jiShen: [], congGe: false };
  }

  const { score = 0, strong = false, dmEl = null, deLing = false } = strength;
  const { balance = null } = context;

  const ELEMS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

  /* ── 1. 從格 detection ─────────────────────────────────────────────────────
     Critério: score < -2.5 (DM sem apoio real) E um elemento domina ≥ 65% do balanço.
     Fonte: ZPZQ 論從格 — "四柱無比印，從殺從財從兒皆可論從" */
  let congGe = false;
  let congEl = null;

  if (score < -2.5 && balance) {
    const total = Object.values(balance).reduce((s, v) => s + v, 0);
    if (total > 0) {
      for (const el of ELEMS) {
        if (el === dmEl) continue; // DM element doesn't count toward domination
        const ratio = (balance[el] || 0) / total;
        if (ratio >= 0.65) { congGe = true; congEl = el; break; }
      }
    }
  }

  /* ── 2. Resultado ─────────────────────────────────────────────────────────── */

  if (congGe && congEl) {
    /* 從格: seguir o elemento dominante e o que ele gera */
    const domIdx  = ELEMS.indexOf(congEl);
    const genIdx  = (domIdx + 4) % 5; // elemento que gera o dominante (印 do dominante)
    const outIdx  = (domIdx + 1) % 5; // elemento gerado pelo dominante (食傷 do dominante)
    const favorable   = [congEl, ELEMS[genIdx], ELEMS[outIdx]].filter(Boolean);
    const unfavorable = ELEMS.filter(e => !favorable.includes(e));
    return {
      favorable,
      unfavorable,
      yongShen: congEl,
      xiShen:   [ELEMS[genIdx], ELEMS[outIdx]],
      jiShen:   unfavorable,
      congGe:   true,
    };
  }

  /* ── Caso padrão 普通格 ──────────────────────────────────────────────────── */
  const dmIdx = ELEMS.indexOf(dmEl);
  if (dmIdx === -1) {
    // dmEl desconhecido — fallback defensivo
    return {
      favorable:   Array.isArray(strength.favorable)   ? strength.favorable   : [],
      unfavorable: Array.isArray(strength.unfavorable) ? strength.unfavorable : [],
      yongShen: null, xiShen: [], jiShen: [], congGe: false,
    };
  }

  // Índices relativos ao DM: 0=比劫, 1=食傷, 2=財, 3=官殺, 4=印
  const biJie  = ELEMS[dmIdx];                   // 比劫 — mesmo elemento
  const shiSha = ELEMS[(dmIdx + 1) % 5];         // 食傷 — DM gera
  const cai    = ELEMS[(dmIdx + 2) % 5];         // 財   — DM controla
  const guanSha= ELEMS[(dmIdx + 3) % 5];         // 官殺 — controla DM
  const yin    = ELEMS[(dmIdx + 4) % 5];         // 印   — gera DM

  let yongShen, xiShen, jiShen;

  if (strong && deLing) {
    /* DM forte com 得令 — precisa drenar fortemente
       用神: 官殺 (controla excesso) ou 財 (canaliza energia)
       喜神: 食傷 (drena suavemente)
       忌神: 比劫 (reforça demais), 印 (alimenta quem já está cheio) */
    yongShen = score > 3.0 ? guanSha : cai;
    xiShen   = [shiSha, score > 3.0 ? cai : guanSha];
    jiShen   = [biJie, yin];

  } else if (strong && !deLing) {
    /* DM forte mas sem 得令 — moderadamente forte, drenar mas 印 é neutro
       用神: 財 (canaliza)
       喜神: 食傷, 官殺
       忌神: 比劫 (apenas) */
    yongShen = cai;
    xiShen   = [shiSha, guanSha];
    jiShen   = [biJie];

  } else if (!strong && score < -3.0) {
    /* DM muito fraco — precisa suporte urgente
       用神: 印 (nutre diretamente)
       喜神: 比劫 (apoia)
       忌神: 財 (esgota 印), 官殺 (suprime DM já fraco), 食傷 (drena o pouco que resta) */
    yongShen = yin;
    xiShen   = [biJie];
    jiShen   = [cai, guanSha, shiSha];

  } else {
    /* DM fraco moderado — precisa suporte
       用神: 比劫 ou 印 conforme disponibilidade (sem balance, usar 比劫 como padrão)
       喜神: o outro entre 比劫/印
       忌神: 食傷, 財, 官殺 */
    yongShen = yin;
    xiShen   = [biJie];
    jiShen   = [shiSha, cai, guanSha];
  }

  const favorable   = [yongShen, ...xiShen].filter((v, i, a) => v && a.indexOf(v) === i);
  const unfavorable = jiShen.filter(Boolean);

  return { favorable, unfavorable, yongShen, xiShen, jiShen: unfavorable, congGe: false };
}
