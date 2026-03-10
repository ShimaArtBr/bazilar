/**
 * @file src/config/flags.js
 * @description Feature flags para substituição gradual dos módulos BAZILAR → Dr. Li Wei.
 *
 * CRÍTICO (INFRA-1): Usar import.meta.env (build-time via Vite).
 *   localStorage NÃO é acessível no contexto do Service Worker.
 *   process.env NÃO funciona no browser sem bundler.
 *   import.meta.env é resolvido em tempo de build — correto e seguro.
 *
 * VALORES:
 *   0 = módulo BAZILAR legado (default — golden parity garantida)
 *   1 = módulo Dr. Li Wei (ativar apenas após critério de aceite do sprint)
 *
 * ORDEM DE ATIVAÇÃO (imutável — plano-infra.md §S1):
 *   BAZI_STEMS_V2  → S1·W2 (após zero divergência ramo×dia no golden dataset)
 *   BAZI_SOLAR_V2  → S2·W3 (após ±30s máx para 1900–2100)
 *   BAZI_JIEQI_V2  → S2·W4 (após zero mudança de pilar em 1.000 fronteiras)
 *   BAZI_EPHEM_V2  → Fase 3+ (após ±0.01° vs USNO Almanac)
 *
 * VERCEL ENVIRONMENT VARIABLES (configurar no dashboard antes de ativar):
 *   VITE_BAZI_STEMS_V2=0
 *   VITE_BAZI_SOLAR_V2=0
 *   VITE_BAZI_JIEQI_V2=0
 *   VITE_BAZI_EPHEM_V2=0
 *
 * @see plano-infra.md §S1 — Feature Flags
 * @owner JS Engineer S1
 * @sprint S1·W1
 */

/** @type {{ BAZI_STEMS_V2: 0|1, BAZI_SOLAR_V2: 0|1, BAZI_JIEQI_V2: 0|1, BAZI_EPHEM_V2: 0|1 }} */
export const FLAGS = {
  /** Hastes Ocultas com Sīlìng proporcional (hiddenStems.js Li Wei) */
  BAZI_STEMS_V2: Number(import.meta.env?.VITE_BAZI_STEMS_V2 ?? 0),

  /** Tempo Solar Aparente Spencer 1971 (solar_time.js Li Wei) */
  BAZI_SOLAR_V2: Number(import.meta.env?.VITE_BAZI_SOLAR_V2 ?? 0),

  /** 24 Termos Solares por bissecção numérica (jieqi.js Li Wei) */
  BAZI_JIEQI_V2: Number(import.meta.env?.VITE_BAZI_JIEQI_V2 ?? 0),

  /** Efeméride USNO full (ephemeris.js Li Wei) — Fase 3+ */
  BAZI_EPHEM_V2: Number(import.meta.env?.VITE_BAZI_EPHEM_V2 ?? 0),
};

// ── Validação em runtime (desenvolvimento) ───────────────────────────────────
if (import.meta.env?.DEV) {
  const validValues = [0, 1];
  Object.entries(FLAGS).forEach(([key, val]) => {
    if (!validValues.includes(val)) {
      console.error(`[FLAGS] Valor inválido para ${key}: ${val}. Esperado 0 ou 1. Usando 0.`);
      FLAGS[key] = 0;
    }
  });

  // Bloco de ordem: BAZI_EPHEM_V2 só pode ser 1 se BAZI_JIEQI_V2 também for 1
  if (FLAGS.BAZI_EPHEM_V2 === 1 && FLAGS.BAZI_JIEQI_V2 === 0) {
    console.warn('[FLAGS] BAZI_EPHEM_V2=1 requer BAZI_JIEQI_V2=1 (Fase 3+ depende de S2·W4). Ignorando BAZI_EPHEM_V2.');
    FLAGS.BAZI_EPHEM_V2 = 0;
  }
}
