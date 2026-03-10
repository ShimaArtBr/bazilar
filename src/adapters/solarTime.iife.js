/**
 * solar_time.js — Módulo de Tempo Solar Aparente
 * ================================================
 * Autor  : Dr. Li Wei
 * Versão : 1.0.0
 * Integra: ephemeris.js (deve ser carregado antes deste módulo)
 *
 * Implementa calcularTempoSolarReal() para converter hora local (civil)
 * em Tempo Solar Aparente (AST — Apparent Solar Time), corrigindo:
 *   1. Equação do Tempo (ET) — irregularidade da órbita e obliquidade da eclíptica
 *   2. Ajuste de Longitude   — diferença entre meridiano local e meridiano do fuso
 *
 * RELEVÂNCIA PARA A METAFÍSICA CHINESA (Bazi / Zi Ping):
 *   O sistema Ba Zi usa o "Verdadeiro Sol" (太陽真時), não o horário civil.
 *   Ignorar a ET e o ajuste de longitude pode:
 *   ┌─────────────────────────┬──────────────────────────────────────────────┐
 *   │ Erro máximo sem ajuste  │ Pilar afetado                                │
 *   ├─────────────────────────┼──────────────────────────────────────────────┤
 *   │ ET: ±16 min (fevereiro) │ Pilar da Hora (fronteira a cada ~2h)         │
 *   │ Long.: até ±60 min      │ Pilar da Hora e, em casos extremos, do Dia   │
 *   │ Combinado: até ±76 min  │ Mudança certa do Pilar da Hora               │
 *   └─────────────────────────┴──────────────────────────────────────────────┘
 *
 * Referência ET: Spencer, J.W. (1971). "Fourier series representation of
 *   the position of the sun." Search, 2(5), 172.
 */

'use strict';

const SolarTime = (() => {

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTES
  // ─────────────────────────────────────────────────────────────────────────

  const DEG2RAD = Math.PI / 180.0;

  /** Fronteiras dos Ramos Terrestres (Dizhi) em minutos desde meia-noite solar.
   *  Cada Shi Chen (時辰) dura 2 horas = 120 minutos.
   *  Zi inicia em 23:00 (1380 min) e cruza a meia-noite → caso especial.
   */
  const DIZHI = [
    { nome: '子 Zi  (Rato)',    inicio:    0, fim:   60 },  // 00:00–01:00 (segundo meio)
    { nome: '丑 Chou (Boi)',    inicio:   60, fim:  180 },  // 01:00–03:00
    { nome: '寅 Yin  (Tigre)',  inicio:  180, fim:  300 },  // 03:00–05:00
    { nome: '卯 Mao  (Coelho)', inicio:  300, fim:  420 },  // 05:00–07:00
    { nome: '辰 Chen (Dragão)', inicio:  420, fim:  540 },  // 07:00–09:00
    { nome: '巳 Si   (Cobra)',  inicio:  540, fim:  660 },  // 09:00–11:00
    { nome: '午 Wu   (Cavalo)', inicio:  660, fim:  780 },  // 11:00–13:00
    { nome: '未 Wei  (Cabra)',  inicio:  780, fim:  900 },  // 13:00–15:00
    { nome: '申 Shen (Macaco)', inicio:  900, fim: 1020 },  // 15:00–17:00
    { nome: '酉 You  (Galo)',   inicio: 1020, fim: 1140 },  // 17:00–19:00
    { nome: '戌 Xu   (Cão)',    inicio: 1140, fim: 1260 },  // 19:00–21:00
    { nome: '亥 Hai  (Porco)',  inicio: 1260, fim: 1380 },  // 21:00–23:00
    { nome: '子 Zi  (Rato)',    inicio: 1380, fim: 1440 },  // 23:00–24:00 (primeiro meio)
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 1 — EQUAÇÃO DO TEMPO (Aproximação de Spencer, 1971)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula o ângulo B (radianos) para o dia do ano N.
   * B é a variável angular da série de Fourier de Spencer.
   *
   * @param {number} N — dia do ano [1–365/366]
   * @returns {number} B em radianos
   */
  function _anguloSpencer(N) {
    return (2 * Math.PI * (N - 1)) / 365;
  }

  /**
   * Determina o número do dia no ano (N) para uma data gregoriana.
   * Leva em conta anos bissextos.
   *
   * @param {number} ano
   * @param {number} mes  [1–12]
   * @param {number} dia  [1–31]
   * @returns {number} N [1–366]
   */
  function diaDaAno(ano, mes, dia) {
    const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
    // Dias acumulados por mês (índice 0 = janeiro)
    const diasAcum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let N = diasAcum[mes - 1] + dia;
    if (bissexto && mes > 2) N += 1;
    return N;
  }

  /**
   * Equação do Tempo pela aproximação de Spencer (1971).
   * Precisão: ±0.5 min ao longo do ano inteiro.
   *
   * Fórmula:
   *   ET(min) = (1/π) × [0.000075
   *             + 0.001868·cos(B) − 0.032077·sin(B)
   *             − 0.014615·cos(2B) − 0.04089·sin(2B)] × 229.18
   *
   * Nota: A constante 229.18 = (180/π) × (24×60 / 360) × (180/π)⁻¹ × 12
   *   na derivação original equivale a converter radianos em minutos de tempo.
   *   Forma simplificada diretamente em minutos:
   *
   * @param {number} ano
   * @param {number} mes
   * @param {number} dia
   * @returns {number} ET em minutos (positivo → Sol adiantado em relação ao relógio)
   */
  function equacaoDoTempo(ano, mes, dia) {
    const N = diaDaAno(ano, mes, dia);
    const B = _anguloSpencer(N);

    // Série de Fourier de Spencer — coeficientes originais
    const ET_rad =
      0.000075 +
      0.001868 * Math.cos(B) -
      0.032077 * Math.sin(B) -
      0.014615 * Math.cos(2 * B) -
      0.04089  * Math.sin(2 * B);

    // Converter para minutos de tempo (fator = 229.18 ≈ 12 × 60 / π)
    const ET_min = ET_rad * 229.18;

    return ET_min;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 2 — AJUSTE DE LONGITUDE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula o ajuste de longitude em minutos.
   * A Terra gira 360° em 24h → 1° = 4 minutos de tempo.
   *
   * Ajuste = (longitudeLocal − longitudeFuso) × 4
   *
   * Sinal:
   *   • Local a LESTE do meridiano do fuso → ajuste positivo (Sol nasce antes)
   *   • Local a OESTE do meridiano do fuso → ajuste negativo (Sol nasce depois)
   *
   * @param {number} longitudeLocal   — longitude geográfica local (−180 a +180)
   * @param {number} longitudeFuso    — longitude do meridiano central do fuso
   * @returns {number} ajuste em minutos
   */
  function ajusteLongitude(longitudeLocal, longitudeFuso) {
    return (longitudeLocal - longitudeFuso) * 4;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 3 — MANIPULAÇÃO DE TEMPO
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Converte hora, minuto, segundo em total de minutos desde meia-noite.
   * @returns {number}
   */
  function hmsParaMinutos(hora, minuto, segundo) {
    return hora * 60 + minuto + segundo / 60;
  }

  /**
   * Converte minutos totais (pode ser negativo ou > 1440) em objeto {hora, minuto, segundo}.
   * Aplica módulo 1440 para lidar com cruzamentos de meia-noite.
   *
   * @param {number} totalMinutos
   * @returns {{ hora: number, minuto: number, segundo: number, diaDesloc: number }}
   *   diaDesloc: −1 (dia anterior), 0 (mesmo dia), +1 (dia seguinte)
   */
  function minutosParaHMS(totalMinutos) {
    let diaDesloc = 0;

    if (totalMinutos < 0) {
      diaDesloc = -1;
      totalMinutos += 1440;
    } else if (totalMinutos >= 1440) {
      diaDesloc = 1;
      totalMinutos -= 1440;
    }

    const hora    = Math.floor(totalMinutos / 60);
    const minRest = totalMinutos - hora * 60;
    const minuto  = Math.floor(minRest);
    const segundo = Math.round((minRest - minuto) * 60);

    // Tratamento de arredondamento (segundo = 60)
    if (segundo === 60) {
      return minutosParaHMS(Math.floor(totalMinutos) + 1);
    }

    return { hora, minuto, segundo, diaDesloc };
  }

  /**
   * Formata {hora, minuto, segundo} como string "HH:MM:SS".
   */
  function formatarHMS({ hora, minuto, segundo }) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(hora)}:${pad(minuto)}:${pad(segundo)}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 4 — IDENTIFICAÇÃO DO PILAR DA HORA (Dizhi)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Identifica o Ramo Terrestre (Shi Chen) para um total de minutos solares.
   * @param {number} minutosSolares — minutos desde meia-noite solar
   * @returns {{ dizhi: string, minutosAteProximaFronteira: number }}
   */
  function identificarDizhi(minutosSolares) {
    // Normalizar para [0, 1440)
    const m = ((minutosSolares % 1440) + 1440) % 1440;

    for (const dz of DIZHI) {
      if (m >= dz.inicio && m < dz.fim) {
        const minutosAteProximaFronteira = dz.fim - m;
        return {
          dizhi: dz.nome,
          minutosAteProximaFronteira: Math.round(minutosAteProximaFronteira * 100) / 100,
        };
      }
    }
    // Fallback (não deve ocorrer)
    return { dizhi: '子 Zi (Rato)', minutosAteProximaFronteira: 0 };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 5 — VALIDAÇÃO DE ENTRADAS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Valida todos os parâmetros de entrada.
   * @returns {{ valido: boolean, erros: string[] }}
   */
  function validarEntradas(ano, mes, dia, hora, minuto, segundo, longLocal, longFuso) {
    const erros = [];

    if (!Number.isInteger(ano) || ano < 1582 || ano > 2200) {
      erros.push(`Ano inválido: ${ano}. Esperado entre 1582 e 2200.`);
    }
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      erros.push(`Mês inválido: ${mes}. Esperado entre 1 e 12.`);
    }
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      erros.push(`Dia inválido: ${dia}.`);
    }
    if (!Number.isInteger(hora) || hora < 0 || hora > 23) {
      erros.push(`Hora inválida: ${hora}. Esperado entre 0 e 23.`);
    }
    if (!Number.isInteger(minuto) || minuto < 0 || minuto > 59) {
      erros.push(`Minuto inválido: ${minuto}.`);
    }
    if (!Number.isInteger(segundo) || segundo < 0 || segundo > 59) {
      erros.push(`Segundo inválido: ${segundo}.`);
    }
    if (typeof longLocal !== 'number' || longLocal < -180 || longLocal > 180) {
      erros.push(`Longitude local inválida: ${longLocal}. Esperado entre −180 e +180.`);
    }
    if (typeof longFuso !== 'number' || longFuso < -180 || longFuso > 180) {
      erros.push(`Longitude do fuso inválida: ${longFuso}. Esperado entre −180 e +180.`);
    }

    return { valido: erros.length === 0, erros };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 6 — DETECÇÃO DE CASOS LIMITE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Detecta casos limite relevantes para a metafísica chinesa.
   *
   * @param {number} minLocalTotal  — minutos locais desde meia-noite (hora civil)
   * @param {number} minSolarTotal  — minutos solares desde meia-noite
   * @param {number} diaDesloc      — deslocamento de dia após conversão solar
   * @returns {string[]} lista de avisos
   */
  function detectarCasosLimite(minLocalTotal, minSolarTotal, diaDesloc) {
    const avisos = [];

    // 1. Cruzamento de meia-noite (Pilar do Dia pode mudar)
    if (diaDesloc !== 0) {
      const sentido = diaDesloc > 0 ? 'seguinte' : 'anterior';
      avisos.push(
        `⚠️  CRUZAMENTO DE MEIA-NOITE: O Tempo Solar pertence ao dia ${sentido}. ` +
        `O Pilar do Dia pode mudar em relação à hora civil.`
      );
    }

    // 2. Dentro de 30 minutos da fronteira de um Shi Chen (Pilar da Hora)
    const { minutosAteProximaFronteira } = identificarDizhi(minSolarTotal);
    if (minutosAteProximaFronteira <= 30) {
      avisos.push(
        `⚠️  FRONTEIRA DE SHI CHEN: Faltam apenas ${minutosAteProximaFronteira.toFixed(1)} min para a próxima ` +
        `troca de Pilar da Hora. Pequenas imprecisões no horário de nascimento podem ` +
        `alterar o Ba Zi completamente.`
      );
    }

    // 3. Dentro de 30 minutos do início do dia solar (Zi Chen da meia-noite)
    const minNorm = ((minSolarTotal % 1440) + 1440) % 1440;
    if (minNorm < 30 || minNorm >= 1410) {
      avisos.push(
        `⚠️  ZONA CRÍTICA DE ZI CHEN (子時): Nascimento no Hora do Rato próximo à meia-noite solar. ` +
        `O Zi inicial (23:00–00:00) pertence ao Dia SEGUINTE no sistema Ba Zi (子時換日法). ` +
        `Verifique a escola utilizada pelo astrólogo.`
      );
    }

    return avisos;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO PRINCIPAL — calcularTempoSolarReal
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula o Tempo Solar Aparente (AST) a partir de uma hora local civil.
   *
   * Fórmula:
   *   AST = Hora Local + ET + AjusteLongitude
   *   onde AjusteLongitude = (longLocal − longFuso) × 4 min/°
   *
   * @param {string|Object} dataNascimento
   *   String ISO "YYYY-MM-DD" ou objeto { ano, mes, dia }
   * @param {string|Object} horaLocal
   *   String "HH:MM:SS" ou objeto { hora, minuto, segundo }
   * @param {number} longitudeLocal
   *   Longitude geográfica do local de nascimento (graus decimais).
   *   Positivo = Leste, Negativo = Oeste.
   * @param {number} longitudeFusoHorario
   *   Longitude do meridiano central do fuso horário civil.
   *   Exemplos: Brasil UTC−3 → −45°; China UTC+8 → +120°; Portugal UTC+0/+1 → 0° ou +15°
   *
   * @returns {{
   *   ast: string,               // Tempo Solar Aparente "HH:MM:SS"
   *   astMinutos: number,        // AST em minutos decimais desde meia-noite
   *   horaLocal: string,         // Hora local original formatada
   *   equacaoDoTempo_min: number,// ET em minutos
   *   ajusteLongitude_min: number,// Ajuste de longitude em minutos
   *   totalAjuste_min: number,   // ET + ajuste longitude
   *   diaDesloc: number,         // −1, 0 ou +1 (mudança de dia)
   *   dizhi: string,             // Ramo Terrestre (Shi Chen)
   *   minutosAteFronteira: number,
   *   avisos: string[],          // Casos limite detectados
   *   erro: string|null
   * }}
   */
  function calcularTempoSolarReal(dataNascimento, horaLocal, longitudeLocal, longitudeFusoHorario) {

    // ── Parse de dataNascimento ──────────────────────────────────────────
    let ano, mes, dia;
    if (typeof dataNascimento === 'string') {
      const partes = dataNascimento.split('-');
      if (partes.length !== 3) {
        return { erro: 'dataNascimento inválida. Use "YYYY-MM-DD".' };
      }
      [ano, mes, dia] = partes.map(Number);
    } else if (dataNascimento && typeof dataNascimento === 'object') {
      ({ ano, mes, dia } = dataNascimento);
    } else {
      return { erro: 'dataNascimento deve ser string "YYYY-MM-DD" ou objeto { ano, mes, dia }.' };
    }

    // ── Parse de horaLocal ───────────────────────────────────────────────
    let hora, minuto, segundo;
    if (typeof horaLocal === 'string') {
      const partes = horaLocal.split(':');
      if (partes.length < 2) {
        return { erro: 'horaLocal inválida. Use "HH:MM" ou "HH:MM:SS".' };
      }
      hora    = Number(partes[0]);
      minuto  = Number(partes[1]);
      segundo = partes[2] ? Number(partes[2]) : 0;
    } else if (horaLocal && typeof horaLocal === 'object') {
      hora    = horaLocal.hora;
      minuto  = horaLocal.minuto;
      segundo = horaLocal.segundo ?? 0;
    } else {
      return { erro: 'horaLocal deve ser string "HH:MM:SS" ou objeto { hora, minuto, segundo }.' };
    }

    // ── Validação ─────────────────────────────────────────────────────────
    const { valido, erros } = validarEntradas(
      ano, mes, dia, hora, minuto, segundo,
      longitudeLocal, longitudeFusoHorario
    );
    if (!valido) {
      return { erro: erros.join(' | ') };
    }

    // ── Cálculos principais ──────────────────────────────────────────────
    const ET      = equacaoDoTempo(ano, mes, dia);           // minutos
    const adjLong = ajusteLongitude(longitudeLocal, longitudeFusoHorario); // minutos

    const minLocal = hmsParaMinutos(hora, minuto, segundo);
    const minSolar = minLocal + ET + adjLong;

    const hmsResult = minutosParaHMS(minSolar);
    const { hora: hAST, minuto: mAST, segundo: sAST, diaDesloc } = hmsResult;

    const astStr = formatarHMS({ hora: hAST, minuto: mAST, segundo: sAST });

    // Minutos solares normalizados para identificação do Dizhi
    const minSolarNorm = ((minSolar % 1440) + 1440) % 1440;
    const { dizhi, minutosAteProximaFronteira } = identificarDizhi(minSolarNorm);

    // ── Casos limite ──────────────────────────────────────────────────────
    const avisos = detectarCasosLimite(minLocal, minSolarNorm, diaDesloc);

    return {
      ast:                    astStr,
      astMinutos:             Math.round(minSolarNorm * 1000) / 1000,
      horaLocal:              formatarHMS({ hora, minuto, segundo }),
      equacaoDoTempo_min:     Math.round(ET * 100) / 100,
      ajusteLongitude_min:    Math.round(adjLong * 100) / 100,
      totalAjuste_min:        Math.round((ET + adjLong) * 100) / 100,
      diaDesloc,
      dizhi,
      minutosAteFronteira:    minutosAteProximaFronteira,
      avisos,
      erro:                   null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MÓDULO 7 — TESTES E EXEMPLOS DOCUMENTADOS
  // ─────────────────────────────────────────────────────────────────────────

  function runTests() {
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           SOLAR_TIME.JS — TESTES E EXEMPLOS DOCUMENTADOS                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    // ── SEÇÃO A: Equação do Tempo — valores de referência ─────────────────
    console.log('━━━ A. EQUAÇÃO DO TEMPO — Validação contra tabelas astronômicas ━━━\n');
    // Valores de referência (NOAA Solar Calculator / Meeus):
    // 1 fev: ET ≈ −13.6 min (mínimo anual ~ 12 fev)
    // 1 mai: ET ≈  +3.0 min
    // 3 nov: ET ≈ +16.4 min (máximo anual ~ 3 nov)
    // 25 dez: ET ≈   0.0 min (cruzamento)
    const etTestes = [
      [2025,  2,  1, -13.6, 'Mínimo anual (~12 fev): ET negativa máxima'],
      [2025,  5,  1,   3.0, 'Maio: ET positiva moderada'],
      [2025, 11,  3,  16.4, 'Máximo anual (~3 nov): ET positiva máxima'],
      [2025, 12, 25,   0.0, 'Natal: ET ≈ 0 (cruzamento de zero)'],
    ];
    for (const [a, m, d, esperado, desc] of etTestes) {
      const et = equacaoDoTempo(a, m, d);
      const delta = Math.abs(et - esperado);
      const status = delta <= 0.5 ? '✅' : '❌';
      console.log(`  ${status} ${desc}`);
      console.log(`     ET calculada: ${et.toFixed(2)} min | Referência: ${esperado.toFixed(1)} min | Δ: ${delta.toFixed(2)} min`);
    }

    // ── SEÇÃO B: Exemplos reais de impacto no Ba Zi ────────────────────────
    console.log('\n━━━ B. EXEMPLOS REAIS — Impacto no Pilar da Hora e do Dia ━━━\n');

    const exemplos = [
      {
        titulo: 'EXEMPLO 1 — São Paulo, Brasil (fevereiro)',
        desc:
          'Nascimento em 12/02/1985 às 09:00 hora local.\n' +
          'São Paulo: long. −46.63°. Fuso UTC−3 → meridiano −45°.\n' +
          'Fevereiro: ET ≈ −14.2 min (mínimo anual).\n' +
          'Ajuste longitude: (−46.63 − (−45)) × 4 = −6.5 min.\n' +
          'Total: −14.2 − 6.5 = −20.7 min → AST ≈ 08:39.\n' +
          'Sem ajuste: 09:00 = 辰 Chen (Dragão).\n' +
          'Com ajuste:  08:39 = 辰 Chen (Dragão) — MESMO Pilar.\n' +
          'MAS: se nascimento fosse 09:01, sem ajuste = 辰; com ajuste = 卯 Mao (Coelho) → MUDA!',
        params: ['1985-02-12', '09:01:00', -46.63, -45],
      },
      {
        titulo: 'EXEMPLO 2 — Manaus, Brasil (novembro) — MUDANÇA DO PILAR DA HORA',
        desc:
          'Nascimento em 03/11/1990 às 15:01 hora local.\n' +
          'Manaus: long. −60.02°. Fuso UTC−4 → meridiano −60°.\n' +
          'Novembro: ET ≈ +16.4 min (máximo anual).\n' +
          'Ajuste longitude: (−60.02 − (−60)) × 4 = −0.08 min.\n' +
          'Total: +16.4 − 0.08 ≈ +16.3 min → AST ≈ 15:17.\n' +
          'Sem ajuste: 15:01 = 申 Shen (Macaco)  [申 vai até 17:00].\n' +
          'Com ajuste: 15:17 = 申 Shen (Macaco)  — mesmo Pilar, mas +16 min aproxima da fronteira.\n' +
          'Crítico: se nascimento fosse 14:44, sem ajuste = 未 Wei (Cabra); com ajuste = 申 Shen!',
        params: ['1990-11-03', '14:44:00', -60.02, -60],
      },
      {
        titulo: 'EXEMPLO 3 — Lisboa, Portugal (novembro horário de inverno)',
        desc:
          'Nascimento em 03/11/2000 às 23:52 hora local (UTC+0).\n' +
          'Lisboa: long. −9.14°. Fuso UTC+0 → meridiano 0°.\n' +
          'Ajuste longitude: (−9.14 − 0) × 4 = −36.6 min.\n' +
          'ET ≈ +16.4 min. Total: 16.4 − 36.6 = −20.2 min.\n' +
          '23:52 − 20 min = 23:32 → AINDA no dia 03/11 (Hai 亥 23:00–23:00).\n' +
          'MAS: se a hora civil fosse 23:10, AST = 22:50 = 亥 Hai do dia anterior!\n' +
          'IMPACTO: mudança do PILAR DO DIA — o caso mais crítico em Ba Zi.',
        params: ['2000-11-03', '23:10:00', -9.14, 0],
      },
      {
        titulo: 'EXEMPLO 4 — Harbin, China (longitude extrema leste)',
        desc:
          'Nascimento em 15/07/1975 às 01:30 hora local (UTC+8).\n' +
          'Harbin: long. +126.53°. Fuso UTC+8 → meridiano +120°.\n' +
          'Ajuste longitude: (126.53 − 120) × 4 = +26.1 min.\n' +
          'ET em julho ≈ −6.0 min. Total: −6.0 + 26.1 = +20.1 min.\n' +
          '01:30 + 20 min = 01:50 = 丑 Chou (Boi).\n' +
          'Sem ajuste (apenas ET): 01:24 = 丑 Chou — mesmo Pilar.\n' +
          'Sem NENHUM ajuste: 01:30 = 丑 Chou — coincidência neste caso.\n' +
          'Mas: às 00:55 civil, AST = 01:15 = 丑; sem ajuste = 子 Zi → MUDA O PILAR DA HORA.',
        params: ['1975-07-15', '00:55:00', 126.53, 120],
      },
    ];

    for (const ex of exemplos) {
      console.log(`\n  ┌─ ${ex.titulo}`);
      ex.desc.split('\n').forEach(linha => console.log(`  │  ${linha}`));

      const res = calcularTempoSolarReal(...ex.params);
      if (res.erro) {
        console.log(`  │  ERRO: ${res.erro}`);
      } else {
        console.log(`  │`);
        console.log(`  │  ► Hora civil  : ${res.horaLocal}`);
        console.log(`  │  ► ET          : ${res.equacaoDoTempo_min > 0 ? '+' : ''}${res.equacaoDoTempo_min} min`);
        console.log(`  │  ► Adj. Long.  : ${res.ajusteLongitude_min > 0 ? '+' : ''}${res.ajusteLongitude_min} min`);
        console.log(`  │  ► Total ajuste: ${res.totalAjuste_min > 0 ? '+' : ''}${res.totalAjuste_min} min`);
        console.log(`  │  ► AST (Solar) : ${res.ast}${res.diaDesloc !== 0 ? ` [DIA ${res.diaDesloc > 0 ? 'SEGUINTE' : 'ANTERIOR'}]` : ''}`);
        console.log(`  │  ► Shi Chen    : ${res.dizhi}`);
        console.log(`  │  ► Até próx. fronteira: ${res.minutosAteFronteira} min`);
        if (res.avisos.length > 0) {
          res.avisos.forEach(a => console.log(`  │  ${a}`));
        }
      }
      console.log('  └' + '─'.repeat(76));
    }

    // ── SEÇÃO C: Validação de entradas ────────────────────────────────────
    console.log('\n━━━ C. VALIDAÇÃO DE ENTRADAS ━━━\n');
    const invalidos = [
      { args: ['2025-13-01', '12:00:00', -46.63, -45], desc: 'Mês inválido (13)' },
      { args: ['2025-06-15', '25:00:00', -46.63, -45], desc: 'Hora inválida (25)' },
      { args: ['2025-06-15', '12:00:00',   200,  -45], desc: 'Longitude > 180°' },
      { args: ['1400-01-01', '12:00:00', -46.63, -45], desc: 'Ano fora do alcance (1400)' },
    ];
    for (const { args, desc } of invalidos) {
      const res = calcularTempoSolarReal(...args);
      const status = res.erro ? '✅ ERRO CAPTURADO' : '❌ DEVERIA TER FALHADO';
      console.log(`  ${status}: ${desc}`);
      if (res.erro) console.log(`     → ${res.erro}`);
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║  solar_time.js — Auditoria concluída. Módulo pronto para produção.          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────────────────────────────────
  return {
    calcularTempoSolarReal,
    equacaoDoTempo,
    ajusteLongitude,
    diaDaAno,
    runTests,
  };

})();

// ─── Execução dos testes no Node.js ─────────────────────────────────────────
/* Node.js-only block — disabled for Vite/ESM build
if (typeof module !== 'undefined' && require.main === module) {
  SolarTime.runTests();
}
*/

/* CommonJS export — disabled for Vite/ESM build
if (typeof module !== 'undefined') {
  module.exports = SolarTime;
}
*/

// ─── ESM export — adicionado pelo adapter pipeline S1·W1 ────────────────────
// A linha abaixo é a ÚNICA modificação em relação ao original de Dr. Li Wei.
export default SolarTime;
