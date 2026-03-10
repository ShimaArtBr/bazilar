/**
 * @file js/adapters/jieqi.adapter.js
 * @description Adapter ESM para o módulo IIFE JieQi (Dr. Li Wei).
 *
 * PROBLEMA: JieQi é um IIFE que referencia `Ephemeris` como variável global
 *   (linha 167 do original: `Ephemeris.sunApparentLongitude(...)`).
 *   O módulo não recebe Ephemeris como parâmetro — fecha sobre o escopo global.
 *
 * SOLUÇÃO:
 *   1. Importar Ephemeris via ESM (ephemeris.iife.js já tem `export default`).
 *   2. Atribuir a `globalThis.Ephemeris` ANTES de importar jieqi.iife.js,
 *      garantindo que o IIFE encontre a dependência no escopo global.
 *   3. Exportar funções wrapper que normalizam a API pública:
 *      - `mes` 0-based → 1-based  (contrato do adapters.test.js)
 *      - campo `JD` uppercase → `jd` lowercase (contrato do adapters.test.js)
 *      - campo `jd` injetado em cada item de getTodos24TermosSolares
 *        (getTodos não inclui JD_exato no spread original — gap confirmado em auditoria)
 *
 * CONTRATO DE API PÚBLICA (conforme adapters.test.js — Ana Luz, S2·E16):
 *   getTermoSolar(ano, mes0)          → { jd, lambda, chines, pinyin, ... }
 *     mes0: índice 0-based (0=LiChun/fev, 11=DaXue/dez)
 *   getTodos24TermosSolares(ano)      → Array<{ jd, lambda, ... }> length=24
 *   JieQi                             → objeto IIFE completo (acesso direto se necessário)
 *
 * ÂNCORA: Este adapter NÃO modifica a lógica interna do IIFE.
 *   Toda adaptação ocorre nos wrappers abaixo.
 *
 * @see plano-infra.md §S1 — Incompatibilidades Críticas · E02
 * @owner JS Engineer S1
 * @sprint S1·W1
 */

// ── 1. Garantir Ephemeris no escopo global antes de carregar JieQi ───────────
import Ephemeris from './ephemeris.iife.js';

/**
 * JieQi referencia `Ephemeris` como variável global (não parametrizada).
 *
 * COMPORTAMENTO ESM: static imports são hoisted — ambos os IIFEs já executaram
 * quando o body deste módulo roda. Isso é SEGURO porque JieQi só usa Ephemeris
 * dentro de corpos de função (_lambdaParaJD, linha 167 do original), nunca no
 * topo do IIFE. A atribuição globalThis.Ephemeris precisa ocorrer apenas antes
 * da PRIMEIRA CHAMADA de qualquer função que dependa de Ephemeris — o que é
 * garantido pelo body top-level deste módulo ser executado antes de qualquer
 * import pelo chamador.
 *
 * @see R-NEW-05 — RISK_REPORT_S1.md
 */
if (typeof globalThis !== 'undefined') {
  globalThis.Ephemeris = Ephemeris;
}

// ── 2. Importar o IIFE de JieQi (já tem `export default JieQi`) ─────────────
import JieQi from './jieqi.iife.js';

// ── 3. Mapeamento mes 0-based → 1-based ─────────────────────────────────────
/**
 * Tabela de conversão: índice 0-based (contrato adapters.test.js)
 * → mês gregoriano 1-based (parâmetro nativo de JieQi.getTermoSolar).
 *
 * O índice 0 corresponde a LiChun (立春, λ=315°), que inicia o ano BaZi
 * e cai em fevereiro (mes gregoriano = 2).
 * Sequência: fev(0), mar(1), abr(2), mai(3), jun(4), jul(5),
 *            ago(6), set(7), out(8), nov(9), dez(10), jan(11)
 *
 * @type {number[]}
 */
const MES_0_TO_1 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1];

// ── 4. Wrappers com normalização ─────────────────────────────────────────────

/**
 * Retorna o Termo Solar (Jié Qì) que inicia o mês BaZi indicado.
 *
 * NORMALIZAÇÃO aplicada pelo adapter:
 *   - mes: 0-based → 1-based via MES_0_TO_1
 *   - JD (uppercase) → jd (lowercase) no objeto retornado
 *   - em caso de erro, propaga o campo `erro` sem relançar exceção
 *
 * @param {number} ano  - Ano gregoriano (1582–2200)
 * @param {number} mes0 - Índice 0-based do mês BaZi (0=LiChun … 11=DaXue)
 * @returns {{ jd: number, lambda: number, chines: string, pinyin: string,
 *             portugues: string, dataUTC: string, erro: string|null }}
 */
export function getTermoSolar(ano, mes0) {
  const mes1 = MES_0_TO_1[mes0];
  const raw  = JieQi.getTermoSolar(ano, mes1);

  if (!raw || raw.erro) return raw;

  // Normaliza JD → jd (o original expõe uppercase `JD`)
  const { JD, ...rest } = raw;
  return { ...rest, jd: JD };
}

/**
 * Retorna os 24 Termos Solares do ano BaZi completo, ordenados cronologicamente.
 *
 * NORMALIZAÇÃO aplicada pelo adapter:
 *   - Injeta campo `jd` em cada item reconstruindo via Ephemeris.gregorianToJD.
 *   - O IIFE original faz spread de jdParaGregoriano() que retorna
 *     {ano, mes, dia, hora, minuto, segundo} mas NÃO inclui JD_exato.
 *     (gap confirmado em auditoria S2·E16 — adapters.test.js linha 154)
 *
 * @param {number} ano - Ano gregoriano de referência (ano BaZi começa em LiChun)
 * @returns {Array<{ jd: number, lambda: number, chines: string, pinyin: string,
 *                   portugues: string, dataUTC: string, seq: number }>}
 */
export function getTodos24TermosSolares(ano) {
  const raw = JieQi.getTodos24TermosSolares(ano);

  return raw.map(item => {
    if (item.erro) return item; // propaga erro sem modificar

    // Reconstruir jd a partir dos campos de data gregoriana presentes no item.
    // Ephemeris.gregorianToJD aceita dayDecimal (dia + fração de hora).
    const dayDecimal = item.dia
      + (item.hora + (item.minuto + (item.segundo ?? 0) / 60) / 60) / 24;

    const jd = Ephemeris.gregorianToJD(item.ano, item.mes, dayDecimal);

    return { ...item, jd };
  });
}

/**
 * Re-exporta o objeto IIFE completo para casos de uso avançado.
 * Permite acesso a JIE_QI, runTests, _bisseccao etc.
 *
 * @type {object}
 */
export { JieQi };

/**
 * Conveniência: re-exporta _lambdaParaJD para uso em testes de paridade.
 * Calcula a longitude solar no instante JD usando o modelo Li Wei (USNO).
 *
 * @param {number} jd - Número Juliano
 * @returns {number} Longitude eclíptica aparente em graus [0, 360)
 */
export function lambdaParaJD(jd) {
  return JieQi._lambdaParaJD(jd);
}

// ─── RISCO DOCUMENTADO ───────────────────────────────────────────────────────
/**
 * @risk R-NEW-07 · BAIXO · adapters.test.js linha 139-140: limite inferior incorreto
 *
 * O teste espera r.jd > 2459980 para LiChun 2023.
 * LiChun 2023 cai em 2023-02-04 10:42 UTC → JD ≈ 2459979.946.
 * JD 2459980.0 = 2023-02-04 12:00 UTC — o limite inferior está 0.054 JD acima do real.
 *
 * O adapter retorna o valor astronomicamente correto (≈ 2459979.946).
 * O teste falhará neste assert específico — não é bug do adapter.
 *
 * Ação recomendada: Ana Luz corrigir lower bound para > 2459979 (início do dia).
 * Owner: Ana Luz — QA Engineer. Prazo: S1·W2.
 */
