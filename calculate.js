/**
 * api/calculate.js — Vercel Serverless Function
 *
 * Único ponto de contato entre o browser e o núcleo de cálculo.
 * Recebe POST /api/calculate com JSON de entrada.
 * Devolve JSON com os Quatro Pilares calculados.
 *
 * O código em core/ e data/ nunca é enviado ao browser.
 */

'use strict';

const { calculate } = require('../core/pillars');

// ─────────────────────────────────────────────
// VALIDAÇÃO DE ENTRADA
// ─────────────────────────────────────────────

/**
 * Valida os campos obrigatórios e seus intervalos.
 * @param {object} body
 * @returns {string|null} mensagem de erro ou null se válido
 */
function validate(body) {
  const { year, month, day, hour, minute, longitude, latitude, timezone, gender } = body;

  if (!Number.isInteger(year)   || year < 1800 || year > 2200)  return 'year fora do intervalo (1800–2200)';
  if (!Number.isInteger(month)  || month < 1   || month > 12)   return 'month fora do intervalo (1–12)';
  if (!Number.isInteger(day)    || day < 1     || day > 31)      return 'day fora do intervalo (1–31)';
  if (!Number.isInteger(hour)   || hour < 0    || hour > 23)     return 'hour fora do intervalo (0–23)';
  if (!Number.isInteger(minute) || minute < 0  || minute > 59)   return 'minute fora do intervalo (0–59)';
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) return 'longitude inválida';
  if (typeof latitude  !== 'number' || latitude  < -90  || latitude  > 90)  return 'latitude inválida';
  if (typeof timezone  !== 'number' || timezone  < -12  || timezone  > 14)  return 'timezone inválido';
  if (gender !== 'M' && gender !== 'F') return 'gender deve ser "M" ou "F"';

  // Valida dias impossíveis (fev 30, abr 31 etc.)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return `dia ${day} não existe em ${month}/${year}`;

  return null;
}

// ─────────────────────────────────────────────
// HEADERS CORS
// ─────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// ─────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // Apenas POST
  if (req.method !== 'POST') {
    res.writeHead(405, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // Lê o body (Vercel já parseia se Content-Type: application/json)
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.writeHead(400, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'JSON inválido' }));
    return;
  }

  // Valida
  const err = validate(body);
  if (err) {
    res.writeHead(422, CORS_HEADERS);
    res.end(JSON.stringify({ error: err }));
    return;
  }

  // Calcula
  try {
    // Garante que os tipos estão corretos antes de passar ao núcleo
    const input = {
      year:      body.year,
      month:     body.month,
      day:       body.day,
      hour:      body.hour,
      minute:    body.minute,
      longitude: body.longitude,
      latitude:  body.latitude,
      timezone:  body.timezone,
      dst:       Boolean(body.dst),
      gender:    body.gender,
    };

    const result = calculate(input);

    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify(result));

  } catch (e) {
    // Não expõe stack trace ao browser
    console.error('[BAZILAR] Erro interno:', e);
    res.writeHead(500, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'Erro interno no cálculo' }));
  }
};
