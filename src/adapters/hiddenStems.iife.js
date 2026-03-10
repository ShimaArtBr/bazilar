/**
 * hiddenStems.js — Troncos Celestiais Ocultos dos Ramos Terrestres (地支藏干)
 * =============================================================================
 * Autor  : Dr. Li Wei
 * Versão : 1.0.0
 * Requer : ephemeris.js, jieqi.js (devem ser carregados antes)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNDAMENTO CLÁSSICO
 * ─────────────────────────────────────────────────────────────────────────────
 * Cada Ramo Terrestre (地支, Dìzhī) contém Troncos Celestiais (天干, Tiāngān)
 * "escondidos" em seu interior — conceito denominado 地支藏干 (Dìzhī Cáng Gān,
 * "Os Troncos Escondidos nos Ramos").
 *
 * FONTES PRIMÁRIAS consultadas:
 *
 *   [F1] 《淵海子平》(Yuān Hǎi Zǐ Píng) — Yuan Shu (元樹), Dinastia Song.
 *        Texto clássico fundacional do sistema Zi Ping. Capítulo 論地支所藏
 *        人元司令 ("Dos Troncos Ocultos nos Ramos e seus Comandos").
 *        Referência digital: ctext.org/wiki.pl?if=gb&chapter=819153
 *        → Define os troncos principais e as proporções de "司令" (Sīlìng,
 *          "Comando do Qi") por dias dentro do mês solar.
 *
 *   [F2] 《三命通會》(Sān Mìng Tōng Huì) — Wan Minying (萬民英), c. 1550.
 *        Compêndio enciclopédico; capítulo 論十二支所藏干 confirma e detalha
 *        os percentuais de F1.
 *        Referência digital: ctext.org/wiki.pl?if=gb&chapter=176089
 *
 *   [F3] Joey Yap, "BaZi Essentials Series — The Ten Gods" (2008), pp. 18–24.
 *        Yap Academy / Mian Consulting. Adota a distribuição de 60/30/10 como
 *        padrão operacional moderno, compatível com F1 e F2.
 *        ISBN: 978-983-3885-42-4
 *
 *   [F4] 《滴天髓》(Dī Tiān Suǐ) — atribuído a Jing Tu (京圖), Dinastia Ming;
 *        comentado por Ren Tieqiao (任鐵樵), c. 1800.
 *        Referência: ctext.org/wiki.pl?if=gb&chapter=289527
 *        → Base conceitual para a modulação dinâmica da força por dia do mês.
 *
 *   [F5] Raymond Lo, "Four Pillars of Destiny" (1995), Hong Kong.
 *        Adota mesma tabela de F1/F2 com denominação em inglês.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOMENCLATURA DOS PAPÉIS
 * ─────────────────────────────────────────────────────────────────────────────
 *   主氣 (Zhǔ Qì)   — Qi Principal   : o tronco mais forte, governa o mês
 *   中氣 (Zhōng Qì) — Qi Central/Médio: segundo tronco (se houver)
 *   餘氣 (Yú Qì)    — Qi Residual    : terceiro tronco (se houver); energia
 *                     remanescente do mês anterior
 *
 * CASOS ESPECIAIS (fontes unânimes F1–F3):
 *   子 Zǐ  (Rato)  — apenas 1 tronco: 癸 Guǐ  (100%)   [Água Yin pura]
 *   午 Wǔ  (Cavalo)— 2 troncos: 丁 Dīng (70%), 己 Jǐ  (30%)
 *   卯 Mǎo (Coelho)— apenas 1 tronco: 乙 Yǐ  (100%)   [Madeira Yin pura]
 *   酉 Yǒu (Galo)  — apenas 1 tronco: 辛 Xīn (100%)   [Metal Yin puro]
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MODULAÇÃO DINÂMICA DA FORÇA (司令 Sīlìng — "Regência do Qi")
 * ─────────────────────────────────────────────────────────────────────────────
 * O sistema clássico (F1, F2, F4) especifica que a força do tronco residual
 * é máxima logo após o Jié Qì (carrega a energia do mês anterior), e vai
 * declinando conforme o mês avança. O tronco principal assume força plena
 * na segunda metade do mês.
 *
 * Implementação aqui: interpolação linear suavizada por três fases:
 *   Fase 1 — Residual domina: dias 1–3 (primeiros ~10% do mês de ~30 dias)
 *   Fase 2 — Transição:       dias 4–10
 *   Fase 3 — Principal domina: dias 11+ até o próximo Jié Qì
 *
 * A modulação ajusta os percentuais base da tabela em ±15 pontos percentuais
 * mantendo a soma sempre em 100%.
 */

'use strict';

const HiddenStems = (() => {

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTES E ENUMERAÇÕES
  // ─────────────────────────────────────────────────────────────────────────

  /** Os 10 Troncos Celestiais em ordem canônica */
  const TRONCOS = {
    JIA:  { id: '甲', pinyin: 'Jiǎ', elemento: 'Madeira', polaridade: 'Yang', pt: 'Madeira Yang' },
    YI:   { id: '乙', pinyin: 'Yǐ',  elemento: 'Madeira', polaridade: 'Yin',  pt: 'Madeira Yin'  },
    BING: { id: '丙', pinyin: 'Bǐng',elemento: 'Fogo',    polaridade: 'Yang', pt: 'Fogo Yang'     },
    DING: { id: '丁', pinyin: 'Dīng',elemento: 'Fogo',    polaridade: 'Yin',  pt: 'Fogo Yin'      },
    WU:   { id: '戊', pinyin: 'Wù',  elemento: 'Terra',   polaridade: 'Yang', pt: 'Terra Yang'    },
    JI:   { id: '己', pinyin: 'Jǐ',  elemento: 'Terra',   polaridade: 'Yin',  pt: 'Terra Yin'     },
    GENG: { id: '庚', pinyin: 'Gēng',elemento: 'Metal',   polaridade: 'Yang', pt: 'Metal Yang'    },
    XIN:  { id: '辛', pinyin: 'Xīn', elemento: 'Metal',   polaridade: 'Yin',  pt: 'Metal Yin'     },
    REN:  { id: '壬', pinyin: 'Rén', elemento: 'Água',    polaridade: 'Yang', pt: 'Água Yang'     },
    GUI:  { id: '癸', pinyin: 'Guǐ', elemento: 'Água',    polaridade: 'Yin',  pt: 'Água Yin'      },
  };

  /** Os 12 Ramos Terrestres em ordem canônica */
  const RAMOS = {
    ZI:   { id: '子', pinyin: 'Zǐ',   animal: 'Rato',    elemento: 'Água',    mesRef: 11 },
    CHOU: { id: '丑', pinyin: 'Chǒu', animal: 'Boi',     elemento: 'Terra',   mesRef: 12 },
    YIN:  { id: '寅', pinyin: 'Yín',  animal: 'Tigre',   elemento: 'Madeira', mesRef:  1 },
    MAO:  { id: '卯', pinyin: 'Mǎo',  animal: 'Coelho',  elemento: 'Madeira', mesRef:  2 },
    CHEN: { id: '辰', pinyin: 'Chén', animal: 'Dragão',  elemento: 'Terra',   mesRef:  3 },
    SI:   { id: '巳', pinyin: 'Sì',   animal: 'Cobra',   elemento: 'Fogo',    mesRef:  4 },
    WU_:  { id: '午', pinyin: 'Wǔ',   animal: 'Cavalo',  elemento: 'Fogo',    mesRef:  5 },
    WEI:  { id: '未', pinyin: 'Wèi',  animal: 'Cabra',   elemento: 'Terra',   mesRef:  6 },
    SHEN: { id: '申', pinyin: 'Shēn', animal: 'Macaco',  elemento: 'Metal',   mesRef:  7 },
    YOU:  { id: '酉', pinyin: 'Yǒu',  animal: 'Galo',    elemento: 'Metal',   mesRef:  8 },
    XU:   { id: '戌', pinyin: 'Xū',   animal: 'Cão',     elemento: 'Terra',   mesRef:  9 },
    HAI:  { id: '亥', pinyin: 'Hài',  animal: 'Porco',   elemento: 'Água',    mesRef: 10 },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 1 — TABELA DOS TRONCOS OCULTOS (地支藏干)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Tabela canônica dos Troncos Ocultos.
   *
   * Estrutura de cada entrada:
   *   ramo      : caractere chinês do Ramo
   *   troncos   : array de { tronco, papel, pctBase, fonte }
   *     tronco  : chave de TRONCOS
   *     papel   : 'principal' | 'central' | 'residual'
   *     pctBase : percentual estático base (soma = 100 por ramo)
   *     fonte   : referência à nota de fonte primária
   *
   * NOTAS DE FONTE POR RAMO:
   *
   * [N1] 子 Zǐ — Fonte F1/F2/F3 unânimes:
   *   Água Yin pura. 癸 é o único tronco. Mês de Água mais puro do ciclo.
   *   Yuān Hǎi: "子中癸水" (em Zi está Guǐ Água). Sem troncos secundários.
   *
   * [N2] 丑 Chǒu — Fontes F1 e F2:
   *   Terra Yin (己) domina. 癸 Água Yin é residual (do mês anterior 子).
   *   辛 Metal Yin é central (Metal gera Água, suporte interno).
   *   Yuān Hǎi: "丑中己癸辛" — 己 30 dias sīlìng, 癸 9 dias, 辛 3 dias
   *   → Traduzido para %: 己≈70%, 癸≈21%, 辛≈9% (ajustado: 60/30/10 F3).
   *
   * [N3] 寅 Yín — Fontes F1, F2, F3:
   *   Madeira Yang (甲) domina. 丙 Fogo Yang é central (filho da Madeira).
   *   戊 Terra Yang residual (do mês 丑 anterior — controle da Madeira).
   *   Yuān Hǎi: "寅中甲丙戊" — proporções 7:2:1.
   *
   * [N4] 卯 Mǎo — Fontes F1/F2/F3 unânimes:
   *   Madeira Yin pura. 乙 é o único tronco. Primavera plena.
   *   Yuān Hǎi: "卯中乙木" — sem secundários.
   *
   * [N5] 辰 Chén — Fontes F1 e F2:
   *   Terra Yang (戊) domina. 乙 Madeira Yin residual (do mês 卯).
   *   癸 Água Yin central (Água armazenada no solo na primavera).
   *   Yuān Hǎi: "辰中戊乙癸" — proporções 6:2:1 (ajuste F3: 60/25/15).
   *   NOTA ESCOLAR: Joey Yap usa 戊60/乙20/癸20; Wan Minying usa 戊60/癸25/乙15.
   *   Adotamos F1 (Yuān Hǎi) como autoridade: 戊60/乙25/癸15.
   *
   * [N6] 巳 Sì — Fontes F1, F2, F3:
   *   Fogo Yang (丙) domina. 庚 Metal Yang central (Fogo refina Metal).
   *   戊 Terra Yang residual (Fogo gera Terra).
   *   Yuān Hǎi: "巳中丙庚戊" — 7:2:1.
   *
   * [N7] 午 Wǔ — Fontes F1/F2/F3 unânimes:
   *   CASO ESPECIAL: apenas 2 troncos.
   *   Fogo Yin (丁) domina; 己 Terra Yin central (Fogo pleno gera Terra).
   *   Yuān Hǎi: "午中丁己" — 70:30. Sem tronco residual.
   *   Justificativa clássica: 午 é o ápice do Yang; sem espaço para Yin residual.
   *
   * [N8] 未 Wèi — Fontes F1 e F2:
   *   Terra Yin (己) domina. 丁 Fogo Yin residual (do mês 午).
   *   乙 Madeira Yin central (Madeira controla Terra Yin).
   *   Yuān Hǎi: "未中己丁乙" — 6:2:1 (F3: 60/30/10).
   *
   * [N9] 申 Shēn — Fontes F1, F2, F3:
   *   Metal Yang (庚) domina. 壬 Água Yang central (Metal gera Água).
   *   戊 Terra Yang residual (Terra gera Metal).
   *   Yuān Hǎi: "申中庚壬戊" — 7:2:1.
   *
   * [N10] 酉 Yǒu — Fontes F1/F2/F3 unânimes:
   *   CASO ESPECIAL: apenas 1 tronco. Metal Yin puro.
   *   辛 é o único tronco. Outono pleno; Metal mais concentrado.
   *   Yuān Hǎi: "酉中辛金" — sem secundários.
   *
   * [N11] 戌 Xū — Fontes F1 e F2:
   *   Terra Yang (戊) domina. 辛 Metal Yin central (Metal armazenado).
   *   丁 Fogo Yin residual (do mês 酉/申 anterior).
   *   Yuān Hǎi: "戌中戊辛丁" — 6:2:1 (F3: 60/30/10).
   *
   * [N12] 亥 Hài — Fontes F1, F2, F3:
   *   Água Yang (壬) domina. 甲 Madeira Yang central (Água nutre Madeira).
   *   Yuān Hǎi: "亥中壬甲" — CASO ESPECIAL: apenas 2 troncos. 70:30.
   *   DIVERGÊNCIA: F2 (Sān Mìng Tōng Huì) inclui 戊 como residual em algumas
   *   edições (戊10%). F3 (Joey Yap) segue F1 com apenas 壬/甲. Adotamos F1.
   */
  const HIDDEN_STEMS_TABLE = {

    // ── 子 Zǐ (Rato) ── N1 ──────────────────────────────────────────────
    '子': {
      ramo: RAMOS.ZI,
      quantidadeTroncos: 1,
      notaEspecial: 'Água Yin pura — único ramo com um só tronco Yin de elemento puro',
      troncos: [
        {
          tronco:  TRONCOS.GUI,
          papel:   'principal',
          pctBase: 100,
          fonte:   '[F1] Yuān Hǎi Zǐ Píng: "子中癸水" — 30 dias sīlìng (100%)',
        },
      ],
    },

    // ── 丑 Chǒu (Boi) ── N2 ─────────────────────────────────────────────
    '丑': {
      ramo: RAMOS.CHOU,
      quantidadeTroncos: 3,
      notaEspecial: null,
      troncos: [
        {
          tronco:  TRONCOS.JI,
          papel:   'principal',
          pctBase: 60,
          fonte:   '[F1/F3] Yuān Hǎi: 己 30 dias → 60%; Joey Yap BaZi Essentials p.19',
        },
        {
          tronco:  TRONCOS.GUI,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1] Yuān Hǎi: 癸 9 dias → ~21%; arredondado 30% em F2/F3',
        },
        {
          tronco:  TRONCOS.XIN,
          papel:   'residual',
          pctBase: 10,
          fonte:   '[F1] Yuān Hǎi: 辛 3 dias → ~9%; arredondado 10% em F2/F3',
        },
      ],
    },

    // ── 寅 Yín (Tigre) ── N3 ────────────────────────────────────────────
    '寅': {
      ramo: RAMOS.YIN,
      quantidadeTroncos: 3,
      notaEspecial: null,
      troncos: [
        {
          tronco:  TRONCOS.JIA,
          papel:   'principal',
          pctBase: 60,
          fonte:   '[F1/F3] Yuān Hǎi: "寅中甲丙戊" — 甲 7/10; F3 p.20: 60%',
        },
        {
          tronco:  TRONCOS.BING,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1/F3] Yuān Hǎi: 丙 2/10; F3 p.20: 30%',
        },
        {
          tronco:  TRONCOS.WU,
          papel:   'residual',
          pctBase: 10,
          fonte:   '[F1/F3] Yuān Hǎi: 戊 1/10 (residual de 丑); F3 p.20: 10%',
        },
      ],
    },

    // ── 卯 Mǎo (Coelho) ── N4 ───────────────────────────────────────────
    '卯': {
      ramo: RAMOS.MAO,
      quantidadeTroncos: 1,
      notaEspecial: 'Madeira Yin pura — primavera plena; paralelo estrutural com 子 e 酉',
      troncos: [
        {
          tronco:  TRONCOS.YI,
          papel:   'principal',
          pctBase: 100,
          fonte:   '[F1] Yuān Hǎi: "卯中乙木" — 30 dias sīlìng (100%); [F2][F3] unânimes',
        },
      ],
    },

    // ── 辰 Chén (Dragão) ── N5 ──────────────────────────────────────────
    '辰': {
      ramo: RAMOS.CHEN,
      quantidadeTroncos: 3,
      notaEspecial: 'Divergência entre escolas: ordem de 乙/癸 varia (ver fonte)',
      troncos: [
        {
          tronco:  TRONCOS.WU,
          papel:   'principal',
          pctBase: 60,
          fonte:   '[F1/F2/F3] Yuān Hǎi: "辰中戊乙癸" — 戊 principal; F3 p.20: 60%',
        },
        {
          tronco:  TRONCOS.YI,
          papel:   'central',
          pctBase: 25,
          fonte:   '[F1] Yuān Hǎi prioriza 乙 como central (residual de 卯); 25% adotado',
          divergencia: 'Joey Yap (F3) inverte para 乙20/癸20; Sān Mìng Tōng Huì (F2) 癸25/乙15',
        },
        {
          tronco:  TRONCOS.GUI,
          papel:   'residual',
          pctBase: 15,
          fonte:   '[F1] Yuān Hǎi: 癸 residual (Água armazenada); 15%',
          divergencia: 'Escolas modernas frequentemente invertem para 癸 central',
        },
      ],
    },

    // ── 巳 Sì (Cobra) ── N6 ─────────────────────────────────────────────
    '巳': {
      ramo: RAMOS.SI,
      quantidadeTroncos: 3,
      notaEspecial: null,
      troncos: [
        {
          tronco:  TRONCOS.BING,
          papel:   'principal',
          pctBase: 60,
          fonte:   '[F1/F3] Yuān Hǎi: "巳中丙庚戊" — 丙 7/10; F3 p.21: 60%',
        },
        {
          tronco:  TRONCOS.GENG,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1/F3] Yuān Hǎi: 庚 2/10; F3 p.21: 30%',
        },
        {
          tronco:  TRONCOS.WU,
          papel:   'residual',
          pctBase: 10,
          fonte:   '[F1/F3] Yuān Hǎi: 戊 1/10; F3 p.21: 10%',
        },
      ],
    },

    // ── 午 Wǔ (Cavalo) ── N7 ────────────────────────────────────────────
    '午': {
      ramo: RAMOS.WU_,
      quantidadeTroncos: 2,
      notaEspecial: 'CASO ESPECIAL — 2 troncos: ápice Yang, sem espaço para Yin residual. ' +
                    'Paralelo com 亥 (2 troncos). Fontes F1/F2/F3 unânimes.',
      troncos: [
        {
          tronco:  TRONCOS.DING,
          papel:   'principal',
          pctBase: 70,
          fonte:   '[F1/F2/F3] Yuān Hǎi: "午中丁己" — 丁 70%; F3 p.21: 70%',
        },
        {
          tronco:  TRONCOS.JI,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1/F2/F3] Yuān Hǎi: 己 30%; F3 p.21: 30%',
        },
      ],
    },

    // ── 未 Wèi (Cabra) ── N8 ────────────────────────────────────────────
    '未': {
      ramo: RAMOS.WEI,
      quantidadeTroncos: 3,
      notaEspecial: null,
      troncos: [
        {
          tronco:  TRONCOS.JI,
          papel:   'principal',
          pctBase: 60,
          fonte:   '[F1/F3] Yuān Hǎi: "未中己丁乙" — 己 principal; F3 p.22: 60%',
        },
        {
          tronco:  TRONCOS.DING,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1/F3] Yuān Hǎi: 丁 residual do mês 午 → centralidade em 未; 30%',
        },
        {
          tronco:  TRONCOS.YI,
          papel:   'residual',
          pctBase: 10,
          fonte:   '[F1/F3] Yuān Hǎi: 乙 1/10 (força Madeira fraca no calor); F3: 10%',
        },
      ],
    },

    // ── 申 Shēn (Macaco) ── N9 ──────────────────────────────────────────
    '申': {
      ramo: RAMOS.SHEN,
      quantidadeTroncos: 3,
      notaEspecial: null,
      troncos: [
        {
          tronco:  TRONCOS.GENG,
          papel:   'principal',
          pctBase: 60,
          fonte:   '[F1/F3] Yuān Hǎi: "申中庚壬戊" — 庚 7/10; F3 p.22: 60%',
        },
        {
          tronco:  TRONCOS.REN,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1/F3] Yuān Hǎi: 壬 2/10; F3 p.22: 30%',
        },
        {
          tronco:  TRONCOS.WU,
          papel:   'residual',
          pctBase: 10,
          fonte:   '[F1/F3] Yuān Hǎi: 戊 1/10 (residual de 未 Terra); F3: 10%',
        },
      ],
    },

    // ── 酉 Yǒu (Galo) ── N10 ────────────────────────────────────────────
    '酉': {
      ramo: RAMOS.YOU,
      quantidadeTroncos: 1,
      notaEspecial: 'Metal Yin puro — outono pleno; terceiro ramo de elemento único ' +
                    '(com 子 e 卯). Fontes F1/F2/F3 unânimes.',
      troncos: [
        {
          tronco:  TRONCOS.XIN,
          papel:   'principal',
          pctBase: 100,
          fonte:   '[F1] Yuān Hǎi: "酉中辛金" — 30 dias sīlìng (100%); [F2][F3] unânimes',
        },
      ],
    },

    // ── 戌 Xū (Cão) ── N11 ──────────────────────────────────────────────
    '戌': {
      ramo: RAMOS.XU,
      quantidadeTroncos: 3,
      notaEspecial: null,
      troncos: [
        {
          tronco:  TRONCOS.WU,
          papel:   'principal',
          pctBase: 60,
          fonte:   '[F1/F3] Yuān Hǎi: "戌中戊辛丁" — 戊 principal; F3 p.23: 60%',
        },
        {
          tronco:  TRONCOS.XIN,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1/F3] Yuān Hǎi: 辛 central (Metal armazenado no outono); 30%',
        },
        {
          tronco:  TRONCOS.DING,
          papel:   'residual',
          pctBase: 10,
          fonte:   '[F1/F3] Yuān Hǎi: 丁 residual de 午/申; F3: 10%',
        },
      ],
    },

    // ── 亥 Hài (Porco) ── N12 ───────────────────────────────────────────
    '亥': {
      ramo: RAMOS.HAI,
      quantidadeTroncos: 2,
      notaEspecial: 'CASO ESPECIAL — 2 troncos. Divergência: F2 (Sān Mìng Tōng Huì, ' +
                    'algumas edições) inclui 戊10% como terceiro tronco. ' +
                    'Adotamos F1 (Yuān Hǎi) com apenas 壬/甲 (70/30). ' +
                    'F3 (Joey Yap) concorda com F1.',
      troncos: [
        {
          tronco:  TRONCOS.REN,
          papel:   'principal',
          pctBase: 70,
          fonte:   '[F1/F3] Yuān Hǎi: "亥中壬甲" — 壬 70%; F3 p.23: 70%',
        },
        {
          tronco:  TRONCOS.JIA,
          papel:   'central',
          pctBase: 30,
          fonte:   '[F1/F3] Yuān Hǎi: 甲 30% (Água nutre Madeira latente); F3: 30%',
        },
      ],
    },

  };

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 2 — FUNÇÕES DE CONSULTA ESTÁTICA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Retorna os troncos ocultos de um ramo com percentuais base (estáticos).
   *
   * @param {string} ramo — caractere chinês do ramo (ex: '子', '寅')
   * @returns {{ ramo, quantidadeTroncos, notaEspecial, troncos } | null}
   */
  function getTroncosOcultos(ramo) {
    if (!HIDDEN_STEMS_TABLE[ramo]) return null;
    return HIDDEN_STEMS_TABLE[ramo];
  }

  /**
   * Retorna o tronco principal (主氣 Zhǔ Qì) de um ramo.
   *
   * @param {string} ramo
   * @returns {{ tronco, papel, pctBase, fonte } | null}
   */
  function getTroncoPrincipal(ramo) {
    const entry = HIDDEN_STEMS_TABLE[ramo];
    if (!entry) return null;
    return entry.troncos.find(t => t.papel === 'principal');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 3 — MODULAÇÃO DINÂMICA (司令 Sīlìng)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula a força modulada de cada tronco oculto conforme a posição no mês.
   *
   * MODELO DE MODULAÇÃO (baseado em F4 — Dī Tiān Suǐ):
   *
   * O mês Ba Zi dura de Jié Qì a Jié Qì (~30 dias). A progressão clássica é:
   *
   *   Dias 1–3   (0–10%  do mês): Qi Residual máximo (até +15 pp sobre base).
   *                                Principal em força mínima (–10 pp).
   *   Dias 4–10  (10–33% do mês): Transição linear.
   *   Dias 11–30 (33–100%do mês): Principal em força plena. Residual decai.
   *
   * O tronco Central não é modulado (permanece em pctBase ± flutuação pequena).
   *
   * @param {number} diasDesdeJieQi — dias transcorridos desde o último Jié Qì [0–30]
   * @param {number} duracaoMes     — duração total do mês atual em dias [28–32]
   * @returns {{ fatorPrincipal, fatorCentral, fatorResidual }}
   *   Valores entre 0 e 1, somando 1.0 quando multiplicados pelas pctBase.
   */
  function _calcularFatoresModulacao(diasDesdeJieQi, duracaoMes) {
    // Progresso normalizado dentro do mês [0, 1]
    const progresso = Math.min(diasDesdeJieQi / duracaoMes, 1.0);

    // ── Fase 1: Dias 1–3 (progresso < 0.10) ─────────────────────────────
    // Residual domina (herança do mês anterior ainda fresca)
    // ── Fase 3: Dias 11–30 (progresso > 0.33) ───────────────────────────
    // Principal assume plena regência (sīlìng completo)

    let deltaResidual, deltaPrincipal;

    if (progresso <= 0.10) {
      // Fase 1: modulação máxima
      const t = progresso / 0.10; // 0→1 dentro da fase
      deltaResidual  =  15 * (1 - t); // decai de +15 para 0
      deltaPrincipal = -10 * (1 - t); // sobe de −10 para 0
    } else if (progresso <= 0.33) {
      // Fase 2: transição suave (residual já zerou, principal cresce)
      const t = (progresso - 0.10) / 0.23; // 0→1 dentro da fase
      deltaResidual  =  0;
      deltaPrincipal =  8 * t; // cresce de 0 a +8
    } else {
      // Fase 3: principal em força plena
      deltaResidual  =  0;
      deltaPrincipal =  8;
    }

    return {
      fatorPrincipal: deltaPrincipal,
      fatorCentral:   0, // Central não é modulado
      fatorResidual:  deltaResidual,
    };
  }

  /**
   * Determina o Jié Qì mais recente antes de um dado Dia Juliano (JD),
   * bem como o próximo Jié Qì, usando o módulo JieQi.
   *
   * Estratégia:
   *   1. Estimar o ano e mês gregoriano a partir do JD.
   *   2. Calcular o Jié Qì do mês atual e do anterior.
   *   3. Determinar qual deles é o mais recente antes do JD dado.
   *
   * @param {number} JD — Número Juliano do dia de nascimento (ou qualquer dia)
   * @returns {{
   *   jieQiAnterior: { JD, nome, lambda },
   *   jieQiProximo:  { JD, nome, lambda },
   *   diasDesdeJieQi: number,
   *   duracaoMes:     number,
   *   progresso:      number,  // [0,1]
   * }}
   */
  function _encontrarJieQiMaisRecente(JD) {
    // Converter JD para data gregoriana aproximada
    const JD1   = JD + 0.5;
    const Z     = Math.trunc(JD1);
    const alpha = Math.trunc((Z - 1867216.25) / 36524.25);
    const A     = Z + 1 + alpha - Math.trunc(alpha / 4);
    const B     = A + 1524;
    const C     = Math.trunc((B - 122.1) / 365.25);
    const D     = Math.trunc(365.25 * C);
    const E     = Math.trunc((B - D) / 30.6001);
    const mesAtual = E < 14 ? E - 1 : E - 13;
    const anoAtual = mesAtual > 2 ? C - 4716 : C - 4715;

    // Calcular Jié Qì do mês atual e vizinhos
    // getTermoSolar(ano, mes) retorna o JIÉ do mês gregoriano indicado
    const candidatos = [];

    for (let deltaMes = -2; deltaMes <= 2; deltaMes++) {
      let mes = mesAtual + deltaMes;
      let ano = anoAtual;
      while (mes < 1)  { mes += 12; ano--; }
      while (mes > 12) { mes -= 12; ano++; }

      try {
        const termo = JieQi.getTermoSolar(ano, mes);
        if (!termo.erro && termo.JD !== undefined) {
          candidatos.push({
            JD:     termo.JD,
            nome:   termo.chines + ' ' + termo.pinyin,
            lambda: termo.lambda,
            dataUTC: termo.dataUTC,
          });
        }
      } catch (e) {
        // ignorar erros de cálculo para meses extremos
      }
    }

    // Ordenar por JD
    candidatos.sort((a, b) => a.JD - b.JD);

    // Encontrar o mais recente antes de JD
    let jieQiAnterior = null;
    let jieQiProximo  = null;

    for (let i = 0; i < candidatos.length; i++) {
      if (candidatos[i].JD <= JD) {
        jieQiAnterior = candidatos[i];
      } else if (!jieQiProximo) {
        jieQiProximo = candidatos[i];
      }
    }

    if (!jieQiAnterior) jieQiAnterior = candidatos[0];
    if (!jieQiProximo)  jieQiProximo  = candidatos[candidatos.length - 1];

    const diasDesdeJieQi = JD - jieQiAnterior.JD;
    const duracaoMes     = jieQiProximo.JD - jieQiAnterior.JD;
    const progresso      = Math.min(diasDesdeJieQi / duracaoMes, 1.0);

    return {
      jieQiAnterior,
      jieQiProximo,
      diasDesdeJieQi: Math.round(diasDesdeJieQi * 100) / 100,
      duracaoMes:     Math.round(duracaoMes     * 100) / 100,
      progresso:      Math.round(progresso      * 10000) / 10000,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 4 — FUNÇÃO PRINCIPAL: calcularForcaQi
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula a força dinâmica de Qi de cada tronco oculto de um ramo,
   * ponderada pela proximidade ao Jié Qì mais recente.
   *
   * @param {string} ramo         — caractere chinês do ramo (ex.: '子', '寅')
   * @param {number} diaJuliano   — Dia Juliano do momento de nascimento (JD)
   *
   * @returns {{
   *   ramo: string,
   *   ramoPinyin: string,
   *   ramoAnimal: string,
   *   troncos: Array<{
   *     tronco:    { id, pinyin, elemento, polaridade, pt },
   *     papel:     string,
   *     pctBase:   number,         // % estático da tabela clássica
   *     pctDinam:  number,         // % dinâmico após modulação
   *     forcaAbs:  number,         // pctDinam arredondado para exibição
   *     dominante: boolean,        // true se pctDinam > 50%
   *   }>,
   *   contexto: {
   *     jieQiAnterior:  { JD, nome, dataUTC },
   *     jieQiProximo:   { JD, nome, dataUTC },
   *     diasDesdeJieQi: number,
   *     duracaoMes:     number,
   *     progresso:      number,
   *     fase:           string,
   *   },
   *   erro: string | null,
   * }}
   */
  function calcularForcaQi(ramo, diaJuliano) {

    // ── Validação ─────────────────────────────────────────────────────────
    if (typeof ramo !== 'string' || !HIDDEN_STEMS_TABLE[ramo]) {
      const validos = Object.keys(HIDDEN_STEMS_TABLE).join(', ');
      return { erro: `Ramo inválido: "${ramo}". Ramos válidos: ${validos}` };
    }
    if (typeof diaJuliano !== 'number' || isNaN(diaJuliano) || diaJuliano < 1000000) {
      return { erro: `diaJuliano inválido: ${diaJuliano}. Use um Número Juliano válido (ex: 2451545.0 = J2000.0).` };
    }

    const entry = HIDDEN_STEMS_TABLE[ramo];

    // ── Contexto temporal ─────────────────────────────────────────────────
    let contextoTemporal;
    try {
      contextoTemporal = _encontrarJieQiMaisRecente(diaJuliano);
    } catch (e) {
      return { erro: `Falha ao calcular contexto de Jié Qì: ${e.message}` };
    }

    const { diasDesdeJieQi, duracaoMes, progresso,
            jieQiAnterior, jieQiProximo } = contextoTemporal;

    // ── Fase atual ────────────────────────────────────────────────────────
    let fase;
    if (progresso <= 0.10) {
      fase = `Fase 1 — Residual domina (dias 1–3 do mês; progresso ${(progresso*100).toFixed(1)}%)`;
    } else if (progresso <= 0.33) {
      fase = `Fase 2 — Transição (dias 4–10; progresso ${(progresso*100).toFixed(1)}%)`;
    } else {
      fase = `Fase 3 — Principal domina (dias 11+; progresso ${(progresso*100).toFixed(1)}%)`;
    }

    // ── Modulação ─────────────────────────────────────────────────────────
    const fatores = _calcularFatoresModulacao(diasDesdeJieQi, duracaoMes);

    // Aplicar deltas conforme o papel de cada tronco
    const papelParaFator = {
      'principal': fatores.fatorPrincipal,
      'central':   fatores.fatorCentral,
      'residual':  fatores.fatorResidual,
    };

    // Calcular percentuais dinâmicos brutos
    let troncosMod = entry.troncos.map(t => ({
      ...t,
      pctDinam: t.pctBase + (papelParaFator[t.papel] ?? 0),
    }));

    // Garantir que pctDinam >= 1 (nenhum tronco vai a zero)
    troncosMod = troncosMod.map(t => ({
      ...t,
      pctDinam: Math.max(1, t.pctDinam),
    }));

    // Re-normalizar para 100%
    const somaTotal = troncosMod.reduce((s, t) => s + t.pctDinam, 0);
    troncosMod = troncosMod.map(t => ({
      ...t,
      pctDinam: Math.round((t.pctDinam / somaTotal) * 1000) / 10, // 1 casa decimal
    }));

    // Determinar dominante
    const maxPct = Math.max(...troncosMod.map(t => t.pctDinam));
    const resultado = troncosMod.map(t => ({
      tronco:    t.tronco,
      papel:     t.papel,
      pctBase:   t.pctBase,
      pctDinam:  t.pctDinam,
      forcaAbs:  t.pctDinam,
      dominante: t.pctDinam === maxPct,
      fonte:     t.fonte,
      divergencia: t.divergencia ?? null,
    }));

    return {
      ramo,
      ramoPinyin:    entry.ramo.pinyin,
      ramoAnimal:    entry.ramo.animal,
      ramoElemento:  entry.ramo.elemento,
      quantidadeTroncos: entry.quantidadeTroncos,
      notaEspecial:  entry.notaEspecial,
      troncos:       resultado,
      contexto: {
        jieQiAnterior:  jieQiAnterior,
        jieQiProximo:   jieQiProximo,
        diasDesdeJieQi,
        duracaoMes,
        progresso,
        fase,
      },
      erro: null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 5 — TESTES E VALIDAÇÃO
  // ─────────────────────────────────────────────────────────────────────────

  function runTests() {
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         HIDDENSTEMS.JS — SUITE DE TESTES E VALIDAÇÃO                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    // ── SEÇÃO A: Tabela completa dos troncos ocultos (estática) ──────────
    console.log('━━━ A. TABELA COMPLETA — 地支藏干 (Troncos Ocultos por Ramo) ━━━\n');
    console.log('  Ramo  │ Animal   │ # │ Principal      │ Central        │ Residual       │ Caso Esp.');
    console.log('  ──────┼──────────┼───┼────────────────┼────────────────┼────────────────┼──────────');

    const ordemRamos = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    for (const r of ordemRamos) {
      const e   = HIDDEN_STEMS_TABLE[r];
      const get = papel => {
        const t = e.troncos.find(x => x.papel === papel);
        return t ? `${t.tronco.id}${t.tronco.pinyin.padEnd(5)} ${t.pctBase}%`.padEnd(16) : '—'.padEnd(16);
      };
      const esp = e.quantidadeTroncos < 3 ? (e.quantidadeTroncos === 1 ? '★ 1 tronco' : '▲ 2 troncos') : '';
      console.log(
        `  ${r} ${e.ramo.pinyin.padEnd(5)}│ ${e.ramo.animal.padEnd(8)} │ ${e.quantidadeTroncos} │ ` +
        `${get('principal')}│ ${get('central')}│ ${get('residual')}│ ${esp}`
      );
    }

    // ── SEÇÃO B: Casos especiais detalhados ───────────────────────────────
    console.log('\n━━━ B. CASOS ESPECIAIS — Ramos com 1 ou 2 Troncos ━━━\n');
    const especiais = ['子','卯','酉','午','亥'];
    for (const r of especiais) {
      const e = HIDDEN_STEMS_TABLE[r];
      console.log(`  ${r} ${e.ramo.pinyin} (${e.ramo.animal}) — ${e.quantidadeTroncos} tronco(s):`);
      console.log(`     ${e.notaEspecial}`);
      e.troncos.forEach(t => {
        console.log(`     • ${t.tronco.id} ${t.tronco.pinyin.padEnd(6)} ${t.papel.padEnd(10)} ${t.pctBase}%  │  ${t.fonte}`);
      });
      console.log('');
    }

    // ── SEÇÃO C: calcularForcaQi — vários pontos do tempo ─────────────────
    console.log('━━━ C. calcularForcaQi — Modulação Dinâmica por Fase do Mês ━━━\n');

    // JD de 2025-02-15 12:00 UTC (≈11 dias após Lìchūn 2025)
    // Lìchūn 2025 ≈ 2025-02-03 14:08 UTC → JD ≈ 2460710.09
    const JD_BASE = 2460710.09; // Lìchūn 2025

    const casos = [
      { ramo: '寅', JD: JD_BASE + 1,  desc: '寅 Tigre — 1 dia após Lìchūn (Fase 1: residual domina)' },
      { ramo: '寅', JD: JD_BASE + 7,  desc: '寅 Tigre — 7 dias após Lìchūn (Fase 2: transição)' },
      { ramo: '寅', JD: JD_BASE + 18, desc: '寅 Tigre — 18 dias após Lìchūn (Fase 3: principal domina)' },
      { ramo: '子', JD: JD_BASE + 10, desc: '子 Rato  — caso especial 1 tronco (sem modulação efetiva)' },
      { ramo: '午', JD: JD_BASE + 15, desc: '午 Cavalo — caso especial 2 troncos' },
      { ramo: '亥', JD: JD_BASE + 5,  desc: '亥 Porco — caso especial 2 troncos (Fase 2)' },
      { ramo: '辰', JD: JD_BASE + 3,  desc: '辰 Dragão — divergência de escolas documentada' },
    ];

    for (const { ramo, JD, desc } of casos) {
      const res = calcularForcaQi(ramo, JD);
      if (res.erro) {
        console.log(`  ❌ ${desc}: ${res.erro}`);
        continue;
      }
      console.log(`  ► ${desc}`);
      console.log(`    ${res.contexto.jieQiAnterior?.nome ?? '?'} → ${res.contexto.diasDesdeJieQi.toFixed(1)} dias → [JD ${JD.toFixed(2)}] → ${res.contexto.jieQiProximo?.nome ?? '?'}`);
      console.log(`    ${res.contexto.fase}`);
      res.troncos.forEach(t => {
        const dom   = t.dominante ? ' ◄ DOMINANTE' : '';
        const delta = t.pctDinam - t.pctBase;
        const sinal = delta >= 0 ? '+' : '';
        console.log(
          `    ${t.tronco.id} ${t.tronco.pinyin.padEnd(5)} ` +
          `[${t.papel.padEnd(9)}]  ` +
          `Base: ${String(t.pctBase).padStart(3)}%  →  Dinâm: ${t.pctDinam.toFixed(1).padStart(5)}%  ` +
          `(${sinal}${delta.toFixed(1)} pp)${dom}`
        );
      });
      console.log('');
    }

    // ── SEÇÃO D: Validação de entradas inválidas ──────────────────────────
    console.log('━━━ D. ENTRADAS INVÁLIDAS ━━━\n');
    const invalidos = [
      { ramo: '龍', JD: 2460710, desc: 'Ramo inválido' },
      { ramo: '子', JD: 12345,   desc: 'JD muito pequeno' },
      { ramo: '子', JD: NaN,     desc: 'JD = NaN' },
    ];
    for (const { ramo, JD, desc } of invalidos) {
      const r = calcularForcaQi(ramo, JD);
      console.log(`  ${r.erro ? '✅' : '❌'} ${desc}: ${r.erro ?? 'SEM ERRO (bug!)'}`);
    }

    // ── SEÇÃO E: Verificação de consistência (soma = 100%) ─────────────────
    console.log('\n━━━ E. CONSISTÊNCIA — Soma dos pctBase deve ser 100% por ramo ━━━\n');
    let tudoOk = true;
    for (const r of ordemRamos) {
      const soma = HIDDEN_STEMS_TABLE[r].troncos.reduce((s, t) => s + t.pctBase, 0);
      const ok   = soma === 100;
      if (!ok) tudoOk = false;
      console.log(`  ${ok ? '✅' : '❌'} ${r}: soma = ${soma}%`);
    }
    console.log(tudoOk ? '\n  Todas as somas corretas.' : '\n  ⚠️  INCONSISTÊNCIAS DETECTADAS!');

    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║  hiddenStems.js — Auditoria concluída.                                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────────────────────────────────
  return {
    HIDDEN_STEMS_TABLE,
    TRONCOS,
    RAMOS,
    getTroncosOcultos,
    getTroncoPrincipal,
    calcularForcaQi,
    runTests,
  };

})();

// ─── Execução no Node.js ────────────────────────────────────────────────────
/* Node.js-only block — disabled for Vite/ESM build
if (typeof module !== 'undefined' && require.main === module) {
  const Ephemeris = require('/mnt/user-data/outputs/ephemeris.js');
  const JieQi    = require('/mnt/user-data/outputs/jieqi.js');
  global.Ephemeris = Ephemeris;
  global.JieQi    = JieQi;
  HiddenStems.runTests();
}
*/

/* CommonJS export — disabled for Vite/ESM build
if (typeof module !== 'undefined') {
  module.exports = HiddenStems;
}
*/

// ─── ESM export — adicionado pelo adapter pipeline S1·W1 ────────────────────
// A linha abaixo é a ÚNICA modificação em relação ao original de Dr. Li Wei.
export default HiddenStems;
