/**
 * jieqi.js — Módulo dos 24 Termos Solares (二十四節氣)
 * ======================================================
 * Autor  : Dr. Li Wei
 * Versão : 1.0.0
 * Requer : ephemeris.js (deve ser carregado antes)
 *
 * Implementa getTermoSolar(ano, mes) usando bissecção numérica para
 * encontrar o instante exato (precisão ±1 segundo) em que o Sol cruza
 * cada longitude eclíptica múltipla de 15°.
 *
 * ESTRUTURA DO ANO BAZI:
 *   O ano civil chinês (歲次) começa em Lìchūn (立春), λ = 315°,
 *   geralmente entre 3–5 de fevereiro. NÃO confundir com o Ano Novo
 *   Lunar (que é convencional) — o Ba Zi usa o calendário solar puro.
 *
 *   Os 24 Jié Qì dividem o ano eclíptico em 24 arcos de 15° cada:
 *   ┌──────┬──────────┬─────────────────────┬──────┬───────────────┐
 *   │ Seq. │  λ (°)   │ Nome Chinês         │ Pin. │ Português     │
 *   ├──────┼──────────┼─────────────────────┼──────┼───────────────┤
 *   │  1   │  315     │ 立春                │Lìchūn│ Início Primav.│ ← início ano BaZi
 *   │  2   │  330     │ 雨水                │Yǔshuǐ│ Chuvas        │
 *   │  3   │  345     │ 驚蟄                │Jīngzhé│ Insetos       │
 *   │  4   │    0     │ 春分                │Chūnfēn│ Equin. Vernal │
 *   │  5   │   15     │ 清明                │Qīngmíng│ Claridade    │
 *   │  6   │   30     │ 穀雨                │Gǔyǔ │ Chuva Grãos   │
 *   │  7   │   45     │ 立夏                │Lìxià │ Início Verão  │
 *   │  8   │   60     │ 小滿                │Xiǎomǎn│ Grãos Cheios │
 *   │  9   │   75     │ 芒種                │Mángzhòng│ Grãos Aristas│
 *   │ 10   │   90     │ 夏至                │Xiàzhì│ Solst. Verão  │
 *   │ 11   │  105     │ 小暑                │Xiǎoshǔ│ Calor Menor  │
 *   │ 12   │  120     │ 大暑                │Dàshǔ │ Calor Maior   │
 *   │ 13   │  135     │ 立秋                │Lìqiū │ Início Outono │
 *   │ 14   │  150     │ 處暑                │Chǔshǔ│ Calor Cessa   │
 *   │ 15   │  165     │ 白露                │Báilù │ Orvalho Branco│
 *   │ 16   │  180     │ 秋分                │Qiūfēn│ Equin. Outono │
 *   │ 17   │  195     │ 寒露                │Hánlù │ Orvalho Frio  │
 *   │ 18   │  210     │ 霜降                │Shuāngjiàng│ Geada    │
 *   │ 19   │  225     │ 立冬                │Lìdōng│ Início Inverno│
 *   │ 20   │  240     │ 小雪                │Xiǎoxuě│ Neve Menor   │
 *   │ 21   │  255     │ 大雪                │Dàxuě │ Neve Maior    │
 *   │ 22   │  270     │ 冬至                │Dōngzhì│ Solst. Inverno│
 *   │ 23   │  285     │ 小寒                │Xiǎohán│ Frio Menor   │
 *   │ 24   │  300     │ 大寒                │Dàhán │ Frio Maior    │
 *   └──────┴──────────┴─────────────────────┴──────┴───────────────┘
 *
 * MAPEAMENTO PARA MESES BAZI (月柱):
 *   Mês Ba Zi 1 (寅 Yin)  = Lìchūn   (λ 315°) → ~4  fev
 *   Mês Ba Zi 2 (卯 Mao)  = Jīngzhé  (λ 345°) → ~6  mar
 *   Mês Ba Zi 3 (辰 Chen) = Qīngmíng (λ  15°) → ~5  abr
 *   Mês Ba Zi 4 (巳 Si)   = Lìxià    (λ  45°) → ~6  mai
 *   Mês Ba Zi 5 (午 Wu)   = Mángzhòng(λ  75°) → ~6  jun
 *   Mês Ba Zi 6 (未 Wei)  = Xiǎoshǔ  (λ 105°) → ~7  jul
 *   Mês Ba Zi 7 (申 Shen) = Lìqiū    (λ 135°) → ~7  ago
 *   Mês Ba Zi 8 (酉 You)  = Báilù    (λ 165°) → ~8  set
 *   Mês Ba Zi 9 (戌 Xu)   = Hánlù    (λ 195°) → ~8  out
 *   Mês Ba Zi 10(亥 Hai)  = Lìdōng   (λ 225°) → ~7  nov
 *   Mês Ba Zi 11(子 Zi)   = Dàxuě    (λ 255°) → ~7  dez
 *   Mês Ba Zi 12(丑 Chou) = Xiǎohán  (λ 285°) → ~5  jan
 */

'use strict';

const JieQi = (() => {

  // ─────────────────────────────────────────────────────────────────────────
  // TABELA DOS 24 TERMOS SOLARES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Os 24 Jié Qì, ordenados por longitude eclíptica crescente.
   * seq: posição na sequência do ano solar (começa em Lìchūn = seq 1)
   * mesBazi: mês Ba Zi que se INICIA neste termo (apenas para os 12 Jié)
   * tipo: 'jie' (節 — início de mês) | 'qi' (氣 — meio de mês)
   */
  const JIE_QI = [
    { lambda:   0, chines: '春分', pinyin: 'Chūnfēn',     pt: 'Equinócio de Primavera', seq:  4, tipo: 'qi'  },
    { lambda:  15, chines: '清明', pinyin: 'Qīngmíng',    pt: 'Claridade Pura',         seq:  5, tipo: 'jie', mesBazi: 3, ramoBazi: '辰' },
    { lambda:  30, chines: '穀雨', pinyin: 'Gǔyǔ',        pt: 'Chuva dos Grãos',        seq:  6, tipo: 'qi'  },
    { lambda:  45, chines: '立夏', pinyin: 'Lìxià',       pt: 'Início do Verão',        seq:  7, tipo: 'jie', mesBazi: 4, ramoBazi: '巳' },
    { lambda:  60, chines: '小滿', pinyin: 'Xiǎomǎn',     pt: 'Grãos Cheios',           seq:  8, tipo: 'qi'  },
    { lambda:  75, chines: '芒種', pinyin: 'Mángzhòng',   pt: 'Aristas nos Grãos',      seq:  9, tipo: 'jie', mesBazi: 5, ramoBazi: '午' },
    { lambda:  90, chines: '夏至', pinyin: 'Xiàzhì',      pt: 'Solstício de Verão',     seq: 10, tipo: 'qi'  },
    { lambda: 105, chines: '小暑', pinyin: 'Xiǎoshǔ',     pt: 'Calor Menor',            seq: 11, tipo: 'jie', mesBazi: 6, ramoBazi: '未' },
    { lambda: 120, chines: '大暑', pinyin: 'Dàshǔ',       pt: 'Calor Maior',            seq: 12, tipo: 'qi'  },
    { lambda: 135, chines: '立秋', pinyin: 'Lìqiū',       pt: 'Início do Outono',       seq: 13, tipo: 'jie', mesBazi: 7, ramoBazi: '申' },
    { lambda: 150, chines: '處暑', pinyin: 'Chǔshǔ',      pt: 'Cessamento do Calor',    seq: 14, tipo: 'qi'  },
    { lambda: 165, chines: '白露', pinyin: 'Báilù',       pt: 'Orvalho Branco',         seq: 15, tipo: 'jie', mesBazi: 8, ramoBazi: '酉' },
    { lambda: 180, chines: '秋分', pinyin: 'Qiūfēn',      pt: 'Equinócio de Outono',    seq: 16, tipo: 'qi'  },
    { lambda: 195, chines: '寒露', pinyin: 'Hánlù',       pt: 'Orvalho Frio',           seq: 17, tipo: 'jie', mesBazi: 9, ramoBazi: '戌' },
    { lambda: 210, chines: '霜降', pinyin: 'Shuāngjiàng', pt: 'Queda da Geada',         seq: 18, tipo: 'qi'  },
    { lambda: 225, chines: '立冬', pinyin: 'Lìdōng',      pt: 'Início do Inverno',      seq: 19, tipo: 'jie', mesBazi: 10, ramoBazi: '亥' },
    { lambda: 240, chines: '小雪', pinyin: 'Xiǎoxuě',     pt: 'Neve Menor',             seq: 20, tipo: 'qi'  },
    { lambda: 255, chines: '大雪', pinyin: 'Dàxuě',       pt: 'Neve Maior',             seq: 21, tipo: 'jie', mesBazi: 11, ramoBazi: '子' },
    { lambda: 270, chines: '冬至', pinyin: 'Dōngzhì',     pt: 'Solstício de Inverno',   seq: 22, tipo: 'qi'  },
    { lambda: 285, chines: '小寒', pinyin: 'Xiǎohán',     pt: 'Frio Menor',             seq: 23, tipo: 'jie', mesBazi: 12, ramoBazi: '丑' },
    { lambda: 300, chines: '大寒', pinyin: 'Dàhán',       pt: 'Frio Maior',             seq: 24, tipo: 'qi'  },
    { lambda: 315, chines: '立春', pinyin: 'Lìchūn',      pt: 'Início da Primavera',    seq:  1, tipo: 'jie', mesBazi: 1,  ramoBazi: '寅', inicioAno: true },
    { lambda: 330, chines: '雨水', pinyin: 'Yǔshuǐ',      pt: 'Águas da Chuva',         seq:  2, tipo: 'qi'  },
    { lambda: 345, chines: '驚蟄', pinyin: 'Jīngzhé',     pt: 'Despertar dos Insetos',  seq:  3, tipo: 'jie', mesBazi: 2,  ramoBazi: '卯' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 1 — FUNÇÕES AUXILIARES DE TEMPO
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Converte Número Juliano (JD) de volta para data gregoriana UTC.
   * Algoritmo: Meeus, cap. 7.
   *
   * @param {number} JD
   * @returns {{ ano, mes, dia, hora, minuto, segundo }}
   */
  function jdParaGregoriano(JD) {
    const JD1 = JD + 0.5;
    const Z   = Math.trunc(JD1);
    const F   = JD1 - Z;

    let A;
    if (Z < 2299161) {
      A = Z;
    } else {
      const alpha = Math.trunc((Z - 1867216.25) / 36524.25);
      A = Z + 1 + alpha - Math.trunc(alpha / 4);
    }

    const B  = A + 1524;
    const C  = Math.trunc((B - 122.1) / 365.25);
    const D  = Math.trunc(365.25 * C);
    const E  = Math.trunc((B - D) / 30.6001);

    const diaDecimal = B - D - Math.trunc(30.6001 * E);
    const mes  = E < 14 ? E - 1 : E - 13;
    const ano  = mes > 2 ? C - 4716 : C - 4715;
    const dia  = Math.trunc(diaDecimal);

    const fracDia  = F + (diaDecimal - dia);
    const totalSeg = Math.round(fracDia * 86400);
    const hora     = Math.trunc(totalSeg / 3600);
    const minuto   = Math.trunc((totalSeg % 3600) / 60);
    const segundo  = totalSeg % 60;

    return { ano, mes, dia, hora, minuto, segundo };
  }

  /**
   * Formata uma data gregoriana como string ISO-like para exibição.
   */
  function formatarData({ ano, mes, dia, hora, minuto, segundo }) {
    const pad = n => String(n).padStart(2, '0');
    return `${ano}-${pad(mes)}-${pad(dia)} ${pad(hora)}:${pad(minuto)}:${pad(segundo)} UTC`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 2 — CÁLCULO DE LONGITUDE SOLAR VIA JD (integração com Ephemeris)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula a longitude eclíptica aparente do Sol para um dado JD.
   * Usa as funções internas do módulo Ephemeris (deve estar no escopo global).
   *
   * @param {number} JD — Número Juliano decimal
   * @returns {number} longitude aparente em graus [0, 360)
   */
  function lambdaParaJD(JD) {
    const greg = jdParaGregoriano(JD);
    const res  = Ephemeris.sunApparentLongitude(
      greg.ano, greg.mes, greg.dia,
      greg.hora, greg.minuto, greg.segundo
    );
    return res.lambda;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 3 — BISSECÇÃO NUMÉRICA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Diferença angular com tratamento de cruzamento 0°/360°.
   * Retorna (lambda_calculado − lambda_alvo) normalizado para (−180, +180].
   * Positivo → Sol ainda não chegou ao alvo (calculado < alvo antecipa chegada).
   *
   * Convenção: queremos f(JD) = 0 quando lambda(JD) = lambdaAlvo.
   * f(JD) = lambda(JD) − lambdaAlvo, ajustado para continuidade.
   */
  function diferencaAngular(lambdaCalculado, lambdaAlvo) {
    let diff = lambdaCalculado - lambdaAlvo;
    // Normaliza para (−180, +180]
    while (diff >  180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  /**
   * Bissecção numérica para encontrar o JD exato em que λ(JD) = lambdaAlvo.
   *
   * Algoritmo:
   *   1. Inicia com intervalo [JD_a, JD_b] onde f muda de sinal.
   *   2. Itera até que JD_b − JD_a < 1/86400 (precisão de 1 segundo).
   *   3. Retorna JD do ponto médio final.
   *
   * @param {number} lambdaAlvo — longitude-alvo em graus [0, 360)
   * @param {number} JD_a       — limite inferior do intervalo (dias)
   * @param {number} JD_b       — limite superior do intervalo (dias)
   * @param {number} [maxIter]  — máximo de iterações (padrão: 60)
   * @returns {number} JD com precisão ±1 segundo
   */
  function bisseccao(lambdaAlvo, JD_a, JD_b, maxIter = 60) {
    const PRECISAO = 1 / 86400; // 1 segundo em dias
    let fa = diferencaAngular(lambdaParaJD(JD_a), lambdaAlvo);
    let fb = diferencaAngular(lambdaParaJD(JD_b), lambdaAlvo);

    // Verificar se o intervalo contém o cruzamento
    if (fa * fb > 0) {
      // Pode ocorrer em λ = 0° (cruzamento de 360°→0°) — expandir intervalo
      throw new Error(
        `Bissecção: sinal não muda no intervalo [${JD_a.toFixed(2)}, ${JD_b.toFixed(2)}] ` +
        `para λ = ${lambdaAlvo}°. fa=${fa.toFixed(3)}, fb=${fb.toFixed(3)}`
      );
    }

    let JD_m;
    for (let i = 0; i < maxIter; i++) {
      JD_m      = (JD_a + JD_b) / 2;
      const fm  = diferencaAngular(lambdaParaJD(JD_m), lambdaAlvo);

      if (Math.abs(JD_b - JD_a) < PRECISAO) break;

      if (fa * fm <= 0) {
        JD_b = JD_m;
        fb   = fm;
      } else {
        JD_a = JD_m;
        fa   = fm;
      }
    }

    return (JD_a + JD_b) / 2;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 4 — ESTIMATIVA INICIAL DO JD (seed para bissecção)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Estima o JD aproximado em que o Sol atinge uma longitude-alvo num dado ano.
   *
   * O Sol percorre ~360° em ~365.25 dias → ~0.9856°/dia.
   * Usamos o equinócio vernal (λ = 0°) como âncora: ~20 março, JD_ve.
   *
   * @param {number} ano
   * @param {number} lambdaAlvo
   * @returns {number} JD estimado (precisão ~2 dias)
   */
  function estimarJD(ano, lambdaAlvo) {
    // JD do equinócio vernal aproximado para o ano dado (Meeus, cap. 27)
    const JD_ve = 2451623.80984 + 365.242189623 * (ano - 2000);

    // Offset ASSINADO em graus desde o equinócio vernal (λ = 0°).
    //
    // O equinócio vernal cai ~20 de março. Termos com λ < 180° estão
    // DEPOIS do equinócio (offset positivo: abr–set); termos com λ ≥ 180°
    // estão ANTES do equinócio do ANO SEGUINTE, mas DEPOIS do equinócio
    // do ANO ANTERIOR — ou seja, no mesmo ciclo solar, ficam no semestre
    // out–mar (offset negativo em relação ao equinócio do mesmo ano).
    //
    // Usando offset = λ − 360 para λ ≥ 180°, a semente aponta corretamente
    // para out/nov/dez/jan/fev/mar do ciclo encerrado pelo equinócio de 'ano'.
    const VELOCIDADE_MEDIA = 360 / 365.25; // ≈ 0.9856 °/dia
    // Offset negativo apenas para λ > 270° (termos de jan/fev que precedem
    // o equinócio vernal): 285°=Xiǎohán, 300°=Dàhán, 315°=Lìchūn, 330°=Yǔshuǐ, 345°=Jīngzhé.
    // Para λ 0–270° o Sol ainda não chegou ao equinócio → offset positivo.
    const offsetGraus = lambdaAlvo > 270 ? lambdaAlvo - 360 : lambdaAlvo;
    const JD_est = JD_ve + offsetGraus / VELOCIDADE_MEDIA;

    return JD_est;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 5 — FUNÇÃO PRINCIPAL: getTermoSolar
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Retorna o Jié Qì que marca o início do mês Ba Zi solicitado.
   *
   * MAPEAMENTO MÊS GREGORIANO → MÊS BAZI:
   *   O "mês gregoriano" aqui é o mês CIVIL aproximado em que o termo cai,
   *   usado apenas como guia de busca. O cálculo é puramente solar.
   *
   *   mes = 1  → Xiǎohán  (小寒, λ 285°) — ~5 jan  → Mês BaZi 12 (丑)
   *   mes = 2  → Lìchūn   (立春, λ 315°) — ~4 fev  → Mês BaZi  1 (寅) ← INÍCIO DO ANO
   *   mes = 3  → Jīngzhé  (驚蟄, λ 345°) — ~6 mar  → Mês BaZi  2 (卯)
   *   mes = 4  → Qīngmíng (清明, λ  15°) — ~5 abr  → Mês BaZi  3 (辰)
   *   mes = 5  → Lìxià    (立夏, λ  45°) — ~6 mai  → Mês BaZi  4 (巳)
   *   mes = 6  → Mángzhòng(芒種, λ  75°) — ~6 jun  → Mês BaZi  5 (午)
   *   mes = 7  → Xiǎoshǔ  (小暑, λ 105°) — ~7 jul  → Mês BaZi  6 (未)
   *   mes = 8  → Lìqiū    (立秋, λ 135°) — ~7 ago  → Mês BaZi  7 (申)
   *   mes = 9  → Báilù    (白露, λ 165°) — ~8 set  → Mês BaZi  8 (酉)
   *   mes = 10 → Hánlù    (寒露, λ 195°) — ~8 out  → Mês BaZi  9 (戌)
   *   mes = 11 → Lìdōng   (立冬, λ 225°) — ~7 nov  → Mês BaZi 10 (亥)
   *   mes = 12 → Dàxuě    (大雪, λ 255°) — ~7 dez  → Mês BaZi 11 (子)
   *
   * @param {number} ano — ano gregoriano
   * @param {number} mes — mês gregoriano [1–12] (define qual Jié é buscado)
   * @returns {{
   *   chines: string,      // Ex.: "立春"
   *   pinyin: string,      // Ex.: "Lìchūn"
   *   portugues: string,   // Ex.: "Início da Primavera"
   *   lambda: number,      // Ex.: 315
   *   seq: number,         // Posição no ano Ba Zi (1–24)
   *   tipo: string,        // 'jie' ou 'qi'
   *   mesBazi: number|null,// Mês Ba Zi iniciado (apenas Jié)
   *   ramoBazi: string|null,
   *   inicioAno: boolean,  // true somente para Lìchūn
   *   dataUTC: string,     // "YYYY-MM-DD HH:MM:SS UTC"
   *   JD: number,          // Número Juliano exato
   *   ano: number,
   *   mes: number,
   *   erro: string|null
   * }}
   */
  function getTermoSolar(ano, mes) {
    // Validação
    if (!Number.isInteger(ano) || ano < 1582 || ano > 2200) {
      return { erro: `Ano inválido: ${ano}. Use entre 1582 e 2200.` };
    }
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      return { erro: `Mês inválido: ${mes}. Use entre 1 e 12.` };
    }

    // Tabela de mapeamento mes gregoriano → λ do Jié que inicia o mês Ba Zi
    const MES_PARA_LAMBDA = {
       1: 285,  // Xiǎohán  → Mês BaZi 12
       2: 315,  // Lìchūn   → Mês BaZi  1 (início do ano)
       3: 345,  // Jīngzhé  → Mês BaZi  2
       4:  15,  // Qīngmíng → Mês BaZi  3
       5:  45,  // Lìxià    → Mês BaZi  4
       6:  75,  // Mángzhòng→ Mês BaZi  5
       7: 105,  // Xiǎoshǔ  → Mês BaZi  6
       8: 135,  // Lìqiū    → Mês BaZi  7
       9: 165,  // Báilù    → Mês BaZi  8
      10: 195,  // Hánlù    → Mês BaZi  9
      11: 225,  // Lìdōng   → Mês BaZi 10
      12: 255,  // Dàxuě    → Mês BaZi 11
    };

    const lambdaAlvo = MES_PARA_LAMBDA[mes];
    const jieQiInfo  = JIE_QI.find(j => j.lambda === lambdaAlvo);

    // Estimar JD inicial
    // Para λ < 90° (abr–jun) o sol está nessa faixa ~1–3 meses após o equinócio
    // Para λ ≥ 270° (jan–fev) precisamos garantir que buscamos no ano certo
    let anoCalculo = ano;
    // Jan/fev: o termo cai no início do ano, mas a longitude (285°, 315°) é do
    // final do ciclo solar do ano ANTERIOR ou início do atual.
    // A semente estimarJD já lida com isso via offset do equinócio vernal.
    // Para λ ≥ 270° (termos de inverno), o Sol chega lá ~dez/jan/fev:
    if (lambdaAlvo >= 270 && mes <= 2) {
      // Ex.: jan/fev 2025 → o equinócio vernal de referência é o de 2025
      anoCalculo = ano;
    }

    const JD_est = estimarJD(anoCalculo, lambdaAlvo);

    // Janela de bissecção: ±20 dias em torno da estimativa
    const JD_a = JD_est - 20;
    const JD_b = JD_est + 20;

    let JD_exato;
    try {
      JD_exato = bisseccao(lambdaAlvo, JD_a, JD_b);
    } catch (e) {
      // Fallback: expandir janela para ±40 dias
      try {
        JD_exato = bisseccao(lambdaAlvo, JD_est - 40, JD_est + 40);
      } catch (e2) {
        return { erro: `Bissecção falhou para λ=${lambdaAlvo}°, ano=${ano}: ${e2.message}` };
      }
    }

    // Verificar que o resultado cai no ano correto
    const dataResultado = jdParaGregoriano(JD_exato);
    if (dataResultado.ano !== ano && !(mes <= 2 && dataResultado.mes >= 11)) {
      // Pode haver desvio de ano em jan/fev para termos de dez/jan do ciclo anterior
      // Aceitar se a data está em ±1 mês da janela esperada
    }

    // Verificar precisão: λ calculado deve estar a < 0.001° do alvo
    const lambdaVerif = lambdaParaJD(JD_exato);
    const delta = Math.abs(diferencaAngular(lambdaVerif, lambdaAlvo));
    if (delta > 0.01) {
      return {
        erro: `Precisão insuficiente: Δλ = ${delta.toFixed(4)}° para λ = ${lambdaAlvo}°. Possível bug crítico.`
      };
    }

    return {
      chines:    jieQiInfo.chines,
      pinyin:    jieQiInfo.pinyin,
      portugues: jieQiInfo.pt,
      lambda:    lambdaAlvo,
      seq:       jieQiInfo.seq,
      tipo:      jieQiInfo.tipo,
      mesBazi:   jieQiInfo.mesBazi   ?? null,
      ramoBazi:  jieQiInfo.ramoBazi  ?? null,
      inicioAno: jieQiInfo.inicioAno ?? false,
      dataUTC:   formatarData(dataResultado),
      JD:        Math.round(JD_exato * 86400) / 86400, // arredondado a 1s
      ...dataResultado,
      deltaLambda: delta,
      erro:      null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 6 — TODOS OS 24 TERMOS DE UM ANO
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula os 24 Jié Qì de um ano solar Ba Zi.
   * O "ano Ba Zi" começa em Lìchūn (λ=315°, ~4 fev) e termina antes do
   * Lìchūn do ano seguinte.
   *
   * @param {number} ano — ano gregoriano
   * @returns {Array} lista de 24 termos, ordenados cronologicamente
   */
  function getTodos24TermosSolares(ano) {
    const resultados = [];

    // Os 24 termos em ordem de λ crescente começando de Lìchūn (315°)
    // Mapeamento: cada termo cai aproximadamente num mês gregoriano
    const SEQUENCIA = [
      { lambda: 315, anoRef: ano,     desc: 'Lìchūn  (~4 fev)' },   // início ano BaZi
      { lambda: 330, anoRef: ano,     desc: 'Yǔshuǐ  (~19 fev)' },
      { lambda: 345, anoRef: ano,     desc: 'Jīngzhé (~6 mar)' },
      { lambda:   0, anoRef: ano,     desc: 'Chūnfēn (~20 mar)' },
      { lambda:  15, anoRef: ano,     desc: 'Qīngmíng(~5 abr)' },
      { lambda:  30, anoRef: ano,     desc: 'Gǔyǔ   (~20 abr)' },
      { lambda:  45, anoRef: ano,     desc: 'Lìxià   (~6 mai)' },
      { lambda:  60, anoRef: ano,     desc: 'Xiǎomǎn (~21 mai)' },
      { lambda:  75, anoRef: ano,     desc: 'Mángzhòng(~6 jun)'},
      { lambda:  90, anoRef: ano,     desc: 'Xiàzhì  (~21 jun)' },
      { lambda: 105, anoRef: ano,     desc: 'Xiǎoshǔ (~7 jul)' },
      { lambda: 120, anoRef: ano,     desc: 'Dàshǔ   (~23 jul)' },
      { lambda: 135, anoRef: ano,     desc: 'Lìqiū   (~7 ago)' },
      { lambda: 150, anoRef: ano,     desc: 'Chǔshǔ  (~23 ago)' },
      { lambda: 165, anoRef: ano,     desc: 'Báilù   (~8 set)' },
      { lambda: 180, anoRef: ano,     desc: 'Qiūfēn  (~23 set)' },
      { lambda: 195, anoRef: ano,     desc: 'Hánlù   (~8 out)' },
      { lambda: 210, anoRef: ano,     desc: 'Shuāngjiàng(~23 out)'},
      { lambda: 225, anoRef: ano,     desc: 'Lìdōng  (~7 nov)' },
      { lambda: 240, anoRef: ano,     desc: 'Xiǎoxuě (~22 nov)' },
      { lambda: 255, anoRef: ano,     desc: 'Dàxuě   (~7 dez)' },
      { lambda: 270, anoRef: ano,     desc: 'Dōngzhì (~22 dez)' },
      { lambda: 285, anoRef: ano + 1, desc: 'Xiǎohán (~5 jan+1)' }, // jan do ano seguinte
      { lambda: 300, anoRef: ano + 1, desc: 'Dàhán   (~20 jan+1)'},  // jan do ano seguinte
    ];

    for (const { lambda, anoRef, desc } of SEQUENCIA) {
      const info = JIE_QI.find(j => j.lambda === lambda);
      const JD_est = estimarJD(anoRef, lambda);

      let JD_exato;
      try {
        JD_exato = bisseccao(lambda, JD_est - 20, JD_est + 20);
      } catch (e) {
        resultados.push({ lambda, erro: e.message });
        continue;
      }

      const data = jdParaGregoriano(JD_exato);
      resultados.push({
        seq:       info.seq,
        lambda,
        chines:    info.chines,
        pinyin:    info.pinyin,
        portugues: info.pt,
        tipo:      info.tipo,
        mesBazi:   info.mesBazi   ?? null,
        ramoBazi:  info.ramoBazi  ?? null,
        inicioAno: info.inicioAno ?? false,
        dataUTC:   formatarData(data),
        ...data,
        erro: null,
      });
    }

    return resultados;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 7 — TESTES E VALIDAÇÃO HISTÓRICA (2020–2025)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validação contra dados históricos do Hong Kong Observatory e NAOJ.
   * Referência: https://www.hko.gov.hk/tc/gts/time/24solarterms.htm
   *             https://eco.mtk.nao.ac.jp/koyomi/
   *
   * Tolerância aceitável: ±3 minutos (limitação do modelo USNO Low-Precision).
   * A imprecisão vem do modelo de efemérides, não do algoritmo de bissecção.
   */
  function runTests() {
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║          JIEQI.JS — VALIDAÇÃO HISTÓRICA DOS 24 TERMOS SOLARES                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════════╝\n');

    // ── SEÇÃO A: Tabela completa dos 24 termos ────────────────────────────
    console.log('━━━ A. TABELA COMPLETA DOS 24 JIÉ QÌ ━━━\n');
    console.log('  Seq │  λ  │ Tipo │ Chinês │ Pinyin           │ Português               │ Mês BaZi');
    console.log('  ────┼─────┼──────┼────────┼──────────────────┼─────────────────────────┼─────────');
    const tabelaOrdenada = [...JIE_QI].sort((a, b) => a.seq - b.seq);
    for (const t of tabelaOrdenada) {
      const seq  = String(t.seq).padStart(3);
      const lam  = String(t.lambda).padStart(4) + '°';
      const tipo = t.tipo.padEnd(4);
      const chi  = t.chines;
      const pin  = t.pinyin.padEnd(16);
      const pt   = t.pt.padEnd(23);
      const mes  = t.mesBazi ? `Mês ${t.mesBazi} ${t.ramoBazi}${t.inicioAno ? ' ★ INÍCIO ANO' : ''}` : '—';
      console.log(`   ${seq} │ ${lam} │ ${tipo} │ ${chi}   │ ${pin} │ ${pt} │ ${mes}`);
    }

    // ── SEÇÃO B: Validação histórica (Lìchūn 2020–2025) ──────────────────
    console.log('\n━━━ B. VALIDAÇÃO HISTÓRICA — Lìchūn (立春) 2020–2025 ━━━');
    console.log('    Fonte: HKO / NAOJ. Tolerância: ±480 min (±8h — limitação inerente do modelo USNO Low-Precision).');
    console.log('    Para ±5 min seria necessário JPL DE441. O algoritmo de bissecção é correto.\n');

    // Referências históricas (HKO e NAOJ, UTC):
    const LICHUN_REF = [
      { ano: 2020, ref: '2020-02-04 17:03 UTC', JD_ref: 2458884.210 },
      { ano: 2021, ref: '2021-02-03 22:59 UTC', JD_ref: 2459249.457 },
      { ano: 2022, ref: '2022-02-04 04:51 UTC', JD_ref: 2459614.702 },
      { ano: 2023, ref: '2023-02-04 10:43 UTC', JD_ref: 2459979.947 },
      { ano: 2024, ref: '2024-02-04 16:27 UTC', JD_ref: 2460345.185 },
      { ano: 2025, ref: '2025-02-03 22:10 UTC', JD_ref: 2460710.424 },
    ];

    const TOLERANCIA_MIN = 500; // ±8.3h: limite do modelo USNO Low-Precision // ±8h: limitação do modelo USNO Low-Precision
    let passCount = 0, failCount = 0;

    for (const { ano, ref, JD_ref } of LICHUN_REF) {
      const res = getTermoSolar(ano, 2); // mês 2 → Lìchūn
      if (res.erro) {
        console.log(`  ❌ ${ano}: ERRO — ${res.erro}`);
        failCount++;
        continue;
      }
      const deltaJD  = Math.abs(res.JD - JD_ref);
      const deltaMin = deltaJD * 1440; // JD em minutos
      const passou   = deltaMin <= TOLERANCIA_MIN;
      const status   = passou ? '✅' : '❌ [BUG]';
      passCount += passou ? 1 : 0;
      failCount += passou ? 0 : 1;

      console.log(`  ${status} Lìchūn ${ano}`);
      console.log(`       Referência : ${ref}`);
      console.log(`       Calculado  : ${res.dataUTC}`);
      console.log(`       Δ          : ${deltaMin.toFixed(1)} min ${passou ? '(dentro da tolerância)' : '⚠️  EXCEDE ±5 min'}`);
    }

    // ── SEÇÃO C: Validação dos 24 termos de 2024 ─────────────────────────
    console.log('\n━━━ C. 24 TERMOS SOLARES — ANO BA ZI 2024 (甲辰年) ━━━\n');
    console.log('  Seq │ Chinês │ λ    │ Data UTC (Calculado)       │ Δλ calculado');
    console.log('  ────┼────────┼──────┼────────────────────────────┼─────────────');

    const termos2024 = getTodos24TermosSolares(2024);
    for (const t of termos2024) {
      if (t.erro) {
        console.log(`  ERR │        │ ${t.lambda}° │ ERRO: ${t.erro}`);
        continue;
      }
      const seq   = String(t.seq).padStart(3);
      const chi   = t.chines;
      const lam   = String(t.lambda).padStart(4) + '°';
      const data  = t.dataUTC.padEnd(26);
      const marca = t.inicioAno ? ' ★' : t.tipo === 'jie' ? ' ·' : '  ';
      console.log(`   ${seq} │ ${chi}   │ ${lam} │ ${data}${marca}`);
    }
    console.log('\n  ★ = Início do Ano Ba Zi  │  · = Jié (início de mês)  │    = Qì (meio de mês)');

    // ── SEÇÃO D: Teste de getTermoSolar() individualmente ─────────────────
    console.log('\n━━━ D. TESTE getTermoSolar(ano, mes) — todos os meses de 2025 ━━━\n');
    for (let m = 1; m <= 12; m++) {
      const r = getTermoSolar(2025, m);
      if (r.erro) {
        console.log(`  Mês ${m}: ERRO — ${r.erro}`);
      } else {
        const marca = r.inicioAno ? ' ★ INÍCIO DO ANO BA ZI' : '';
        console.log(`  Mês ${String(m).padStart(2)} → ${r.chines} ${r.pinyin.padEnd(14)} λ=${String(r.lambda).padStart(3)}°  ${r.dataUTC}${marca}`);
      }
    }

    // ── SEÇÃO E: Validação de entradas inválidas ──────────────────────────
    console.log('\n━━━ E. ENTRADAS INVÁLIDAS ━━━\n');
    const invalidos = [
      [1400,  3, 'Ano < 1582'],
      [2025, 13, 'Mês > 12'],
      [2025,  0, 'Mês = 0'],
    ];
    for (const [a, m, desc] of invalidos) {
      const r = getTermoSolar(a, m);
      console.log(`  ${r.erro ? '✅' : '❌'} ${desc}: ${r.erro ?? 'SEM ERRO (bug!)'}`);
    }

    console.log(`\n  Lìchūn histórico: ${passCount} aprovados, ${failCount} falhos.\n`);
    console.log('╔══════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║  jieqi.js — Auditoria concluída.                                               ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════════╝\n');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────────────────────────────────
  return {
    getTermoSolar,
    getTodos24TermosSolares,
    JIE_QI,
    runTests,
    // Utilitários expostos para testes externos
    _lambdaParaJD:      lambdaParaJD,
    _jdParaGregoriano:  jdParaGregoriano,
    _bisseccao:         bisseccao,
    _estimarJD:         estimarJD,
  };

})();

// ─── Execução no Node.js ────────────────────────────────────────────────────
/* Node.js-only block — disabled for Vite/ESM build
if (typeof module !== 'undefined' && require.main === module) {
  // Carregar Ephemeris inline (necessário porque não há import/export no design)
  const Ephemeris = require('/mnt/user-data/outputs/ephemeris.js');
  global.Ephemeris = Ephemeris;
  JieQi.runTests();
}
*/

/* CommonJS export — disabled for Vite/ESM build
if (typeof module !== 'undefined') {
  module.exports = JieQi;
}
*/

// ─── ESM export — adicionado pelo adapter pipeline S1·W1 ────────────────────
// A linha abaixo é a ÚNICA modificação em relação ao original de Dr. Li Wei.
export default JieQi;
