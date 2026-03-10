/**
 * @file interfaces.d.ts
 * @description Contratos de interface entre módulos BAZILAR × Dr. Li Wei × app.js.
 *   Zero `any` não documentado. Cada `any` deve ter JSDoc explicando a limitação.
 *
 * @see plano-infra.md §S1 — E08
 * @owner JS Engineer S1
 * @sprint S1·W1
 */

// ── PILARES ──────────────────────────────────────────────────────────────────

/** Índice de Tronco Celestial: 0=甲 a 9=癸 */
export type StemIndex = 0|1|2|3|4|5|6|7|8|9;

/** Índice de Ramo Terrestre: 0=子 a 11=亥 */
export type BranchIndex = 0|1|2|3|4|5|6|7|8|9|10|11;

/** Um pilar BaZi (Tronco + Ramo) */
export interface Pillar {
  /** Índice do Tronco Celestial (0-9) */
  si: StemIndex;
  /** Índice do Ramo Terrestre (0-11) */
  bi: BranchIndex;
  /** Índice no ciclo de 60 (0-59) */
  idx: number;
}

/** Quatro Pilares completos */
export interface FourPillars {
  year:  Pillar;
  month: Pillar;
  day:   Pillar;
  hour:  Pillar;
  /** Número Juliano do momento de nascimento (Tempo Solar Aparente quando BAZI_SOLAR_V2=1) */
  jd: number;
}

// ── HASTES OCULTAS ───────────────────────────────────────────────────────────

/** Papel do tronco dentro do ramo (San Ming Tong Hui) */
export type HiddenStemRole = 'principal' | 'central' | 'residual';

/** Tronco oculto com metadados de fonte (Dr. Li Wei API) */
export interface HiddenStemEntry {
  /** Caractere chinês do tronco (ex: '甲') */
  tronco: string;
  papel: HiddenStemRole;
  /** Percentual base de Sīlìng (0-100) */
  pctBase: number;
  /** Referência bibliográfica clássica */
  fonte: string;
}

/** Resultado de HiddenStems.getTroncosOcultos(ramo) */
export type HiddenStemsResult = HiddenStemEntry[];

// ── 10 DEUSES ────────────────────────────────────────────────────────────────

/**
 * Retorno de tenGod() de data.js.
 *
 * CONTRATO DE MAPEAMENTO C06 (plano-conteudo.md CORREÇÃO 3 — formalizado 2026-03-09):
 *   O campo `zh` usa EXCLUSIVAMENTE caracteres tradicionais (繁體字).
 *   Correção C06: 5 caracteres simplificados em data.js TG{} foram convertidos
 *   para tradicionais para alinhar com dez_deuses_bazi_app.json.
 *
 *   Binding canônico:
 *     `dezDeuses.find(d => d.caractere === tenGodResult.zh)`
 *
 *   NUNCA usar py como chave de lookup — pinyin não é único entre escolas.
 */
export interface TenGodResult {
  /** Caractere chinês tradicional (繁體字) — chave de lookup para o JSON dos 10 Deuses */
  zh: string;
  /** Pinyin com tons — uso: display apenas, não usar como chave */
  py: string;
}

/**
 * Contrato formal de binding entre tenGod() e dez_deuses_bazi_app.json.
 * @see C06 — plano-conteudo.md
 * @see data.js — função tenGod(), tabela TG
 * @see public/dez_deuses_bazi_app.json — campo `caractere` em cada entrada
 *
 * PRODUTORES:
 *   tenGod(dmStemIdx: StemIndex, stemIdx: StemIndex): TenGodResult | null
 *   computeTenGods(dmStemIdx, allStemIdxs): Array<{ stemIdx, tenGod: TenGodResult }>
 *
 * CONSUMIDORES:
 *   renderer.js  — renderQuatroPilares(), renderPdfContent()
 *   pdf.js       — geração de PDF com label do deus
 *   app.js       — campo tenGods no objeto mapa retornado
 *
 * PADRÃO DE BINDING (canônico — única forma permitida):
 *   const entry = dezDeuses.find(d => d.caractere === tenGodResult.zh);
 *
 * INVARIANTES:
 *   1. tenGod() retorna null para inputs inválidos (dm < 0 ou o < 0) — checar antes do find()
 *   2. zh é sempre caractere tradicional (繁體字) — nunca simplificado (简体字)
 *   3. O JSON garante unicidade de `caractere` — find() nunca retorna duplicatas
 *   4. Se find() retornar undefined, o dado está corrompido — logar como erro crítico
 *
 * MAPEAMENTO COMPLETO (tenGod key → zh → JSON id → nome_pt canônico C09):
 *   ss → 比肩 → bi_jian    → Irmão             (alt: Amigo, Par)
 *   sd → 劫財 → jie_cai    → Rival             (alt: Roubar Riqueza)  ← C06 fix
 *   os → 食神 → shi_shen   → Deus da Expressão (alt: Deus da Comida)
 *   od → 傷官 → shang_guan → Oficial Ferido    (alt: Oficial de Ferimentos) ← C06 fix
 *   cd → 正財 → zheng_cai  → Riqueza Direta    ← C06 fix
 *   cs → 偏財 → pian_cai   → Riqueza Indireta
 *   kd → 正官 → zheng_guan → Oficial Direto
 *   ks → 七殺 → qi_sha     → Sete Mortes       (alt: General) ← C06 fix
 *   id → 正印 → zheng_yin  → Recurso Direto
 *   is → 偏印 → pian_yin   → Recurso Indireto  (alt: Deus Coruja/梟神) ← C06 fix
 */
export interface TenGodBinding {
  /** Resultado de tenGod() — nunca null quando usado no binding */
  tenGodResult: TenGodResult;
  /** Entrada correspondente no JSON dos 10 Deuses */
  jsonEntry: {
    id: string;
    caractere: string;
    nome_pt: string;
    pinyin: string;
  };
}

// ── 12 ESTÁGIOS DE VIDA ──────────────────────────────────────────────────────

/**
 * Retorno de getLifeStage() de pillars.js.
 * @see C05 — decisão doutrinária Yang/Yin diferenciada (子平真詮)
 * @see pillars.js — getLifeStage(stemIdx, branchIdx)
 * @see data.js — LIFE_STAGE_NAMES, LIFE_STAGE_START
 *
 * REGRAS:
 *   Yang stems (stemIdx % 2 === 0) → 順行 forward  (+1 mod 12 a partir de LIFE_STAGE_START)
 *   Yin  stems (stemIdx % 2 === 1) → 逆行 reverse  (-1 mod 12 a partir de LIFE_STAGE_START)
 *
 * INTEGRAÇÃO FUTURA (S2·W4):
 *   seq 0 (長生) e seq 4 (帝旺) adicionam bônus de força em getFavorableElements()
 *   seq 8 (墓)  e seq 9 (絕)  subtraem força em getFavorableElements()
 */
export interface LifeStageResult {
  /** Posição na sequência de 12 (0=長生 … 11=養) */
  seq: number;
  /** Caractere chinês tradicional */
  zh: string;
  /** Pinyin com tons */
  py: string;
  /** Nome em português */
  pt: string;
}

// ── EFEMÉRIDE ────────────────────────────────────────────────────────────────

/** Retorno de Ephemeris.sunApparentLongitude() */
export interface SunLongitudeResult {
  /** Longitude eclíptica aparente do Sol em graus [0, 360) */
  lambda: number;
  /** Presente apenas em caso de erro de validação de input */
  error?: string;
}

// ── TEMPO SOLAR ──────────────────────────────────────────────────────────────

/** Retorno de SolarTime.calcularTempoSolarReal() */
export interface SolarTimeResult {
  /** Tempo Solar Aparente em horas decimais */
  ast: number;
  /** Número Juliano em Tempo Solar Aparente */
  jdAst: number;
  /** Equação do Tempo em minutos (Spencer 1971) */
  equacaoDoTempo: number;
  /** Ajuste de longitude em minutos */
  ajusteLongitude: number;
  /** Presente apenas em erro */
  erro?: string;
}

// ── TERMOS SOLARES ───────────────────────────────────────────────────────────

/** Um dos 24 Termos Solares */
export interface TermoSolar {
  /** Número Juliano do momento exato da transição */
  jd: number;
  /** Longitude eclíptica alvo em graus (múltiplo de 15) */
  lambda: number;
  nome: string;
  pinyin: string;
}

// ── FEATURE FLAGS ────────────────────────────────────────────────────────────

/** Valores permitidos para feature flags */
export type FlagValue = 0 | 1;

export interface FeatureFlags {
  BAZI_STEMS_V2: FlagValue;
  BAZI_SOLAR_V2: FlagValue;
  BAZI_JIEQI_V2: FlagValue;
  BAZI_EPHEM_V2: FlagValue;
}

// ── GRANDES CICLOS ───────────────────────────────────────────────────────────

/** Um Grande Ciclo (大運 Dà Yùn) */
export interface LuckPillar {
  si: StemIndex;
  bi: BranchIndex;
  /** Idade de início do ciclo */
  startAge: number;
  /** Ano de início */
  startYear: number;
}

// ── INTERAÇÕES ───────────────────────────────────────────────────────────────

export type InteractionType = 'harmony6' | 'harmony3' | 'clash' | 'harm' | 'penalty';

export interface Interaction {
  type: InteractionType;
  branches: BranchIndex[];
  /** Elemento resultante (para harmonias) */
  el?: string;
  zh?: string;
}

// ── INPUT DE NASCIMENTO ──────────────────────────────────────────────────────

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  /** Hora local civil (0-23) */
  hour: number;
  minute?: number;
  second?: number;
  /** Longitude do local (graus, positivo = Leste) */
  longitude?: number;
  /** Offset UTC em horas (ex: -3 para BRT) */
  timezone?: number;
  gender: 'M' | 'F';
  southernHemisphere?: boolean;
}
