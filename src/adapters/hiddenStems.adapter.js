/**
 * @file js/adapters/hiddenStems.adapter.js
 * @description Adapter ESM para o módulo IIFE HiddenStems (Dr. Li Wei).
 *
 * DEPENDÊNCIAS GLOBAIS DO IIFE:
 *   HiddenStems._encontrarJieQiMaisRecente() (interno, chamado por calcularForcaQi)
 *   referencia `JieQi.getTermoSolar(ano, mes)` como variável global.
 *   A função usa JieQi com API NATIVA (mes 1-based) e acessa termo.JD (uppercase).
 *   Por isso, globalThis.JieQi deve ser o objeto IIFE RAW — NÃO o adapter wrapper.
 *
 *   HiddenStems não usa Ephemeris diretamente — apenas JieQi é necessário.
 *
 * NORMALIZAÇÕES APLICADAS:
 *   1. globalThis.JieQi = JieQi (objeto IIFE raw, com API 1-based e campo JD uppercase)
 *   2. getTroncosOcultos(ramo):
 *      - IIFE retorna entry completa: { ramo, troncos, quantidadeTroncos, notaEspecial }
 *      - Adapter extrai e retorna entry.troncos (array) — contrato adapters.test.js
 *      - Cada item: tronco (objeto { id, pinyin, elemento, ... }) → tronco (string = id)
 *        Alinha com interfaces.d.ts HiddenStemEntry.tronco: string
 *
 * CONTRATO DE API PÚBLICA (conforme adapters.test.js — Ana Luz, S2·E16):
 *   getTroncosOcultos(ramo)            → HiddenStemEntry[]
 *     ramo: caractere chinês (ex: '子', '寅')
 *     retorna: [{ tronco: '癸', papel: 'principal', pctBase: 100, fonte: '...' }]
 *   HiddenStems                        → objeto IIFE completo
 *
 * CONTRATO COMPLETO (interfaces.d.ts HiddenStemEntry):
 *   { tronco: string, papel: HiddenStemRole, pctBase: number, fonte: string }
 *
 * @see interfaces.d.ts — HiddenStemEntry, HiddenStemsResult
 * @see plano-infra.md §S1 — Incompatibilidades Críticas · E02
 * @owner JS Engineer S1
 * @sprint S1·W1
 */

// ── 1. Importar Ephemeris e JieQi (raw IIFEs) ────────────────────────────────
// JieQi depende de Ephemeris no escopo global — importar na ordem correta.
import Ephemeris  from './ephemeris.iife.js';
import JieQi      from './jieqi.iife.js';

/**
 * Injetar Ephemeris e JieQi no escopo global antes da primeira chamada.
 *
 * COMPORTAMENTO ESM: static imports são hoisted — os três IIFEs já executaram
 * quando o body deste módulo roda. Isso é SEGURO porque nenhum dos IIFEs usa
 * Ephemeris ou JieQi no topo do IIFE — apenas dentro de corpos de função
 * (call-time). A atribuição globalThis precisa ocorrer antes da PRIMEIRA CHAMADA
 * de qualquer função que dependa dessas variáveis globais, o que é garantido pelo
 * body top-level deste módulo ser executado antes de qualquer uso pelo importador.
 *
 * ORDEM CRÍTICA:
 *   1. Ephemeris → globalThis primeiro (JieQi depende dele em call-time)
 *   2. JieQi     → globalThis segundo (HiddenStems depende do JieQi raw)
 *
 * IMPORTANTE: globalThis.JieQi deve ser o objeto IIFE RAW (não o adapter wrapper),
 * pois _encontrarJieQiMaisRecente() chama JieQi.getTermoSolar(ano, mes) com mes
 * 1-based (API nativa) e acessa termo.JD (uppercase) — incompatível com o wrapper.
 *
 * @see R-NEW-05 — RISK_REPORT_S1.md
 */
if (typeof globalThis !== 'undefined') {
  globalThis.Ephemeris = Ephemeris;
  globalThis.JieQi     = JieQi;
}

// ── 2. Importar o IIFE de HiddenStems ────────────────────────────────────────
import HiddenStems from './hiddenStems.iife.js';

// ── 3. Wrapper: getTroncosOcultos ─────────────────────────────────────────────

/**
 * Retorna os Troncos Celestiais ocultos de um Ramo Terrestre.
 *
 * NORMALIZAÇÃO DE SAÍDA:
 *   O IIFE retorna a entrada completa da tabela:
 *     { ramo: {...}, troncos: [{tronco: {id:'癸',...}, papel, pctBase, fonte}], ... }
 *   O adapter extrai .troncos e normaliza cada item:
 *     tronco (objeto TRONCOS) → tronco (string = caractere chinês, ex: '癸')
 *   Resultado final: [{ tronco: '癸', papel: 'principal', pctBase: 100, fonte: '...' }]
 *
 * @param {string} ramo - Caractere chinês do Ramo Terrestre (ex: '子', '寅', '亥')
 * @returns {import('../../interfaces.d.ts').HiddenStemEntry[] | null}
 *   Array de troncos ocultos, ou null se ramo inválido.
 */
export function getTroncosOcultos(ramo) {
  const entry = HiddenStems.getTroncosOcultos(ramo);
  if (!entry) return null;

  // entry.troncos = [{ tronco: {id, pinyin, elemento, polaridade, pt}, papel, pctBase, fonte }]
  // normalizar tronco objeto → tronco string (id = caractere chinês)
  return entry.troncos.map(t => ({
    tronco:  t.tronco.id,
    papel:   t.papel,
    pctBase: t.pctBase,
    fonte:   t.fonte,
  }));
}

/**
 * Calcula a força dinâmica de Qi de cada tronco oculto, ponderada
 * pela proximidade ao Jié Qì mais recente (Sīlìng proporcional).
 *
 * Passa diretamente ao IIFE — assinatura e retorno são estáveis.
 * JieQi já está em globalThis quando esta função é chamada.
 *
 * @param {string} ramo         - Caractere chinês do Ramo (ex: '子')
 * @param {number} diaJuliano   - Número Juliano do nascimento
 * @returns {object} Resultado completo de HiddenStems.calcularForcaQi()
 */
export function calcularForcaQi(ramo, diaJuliano) {
  return HiddenStems.calcularForcaQi(ramo, diaJuliano);
}

/**
 * Re-exporta o objeto IIFE completo para acesso avançado.
 * Expõe: HIDDEN_STEMS_TABLE, TRONCOS, RAMOS, getTroncoPrincipal, runTests.
 *
 * @type {object}
 */
export { HiddenStems };
