'use strict';
const { calculate } = require('./core/pillars');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function validate(b) {
  if (!Number.isInteger(b.year)   || b.year   < 1800 || b.year   > 2200) return 'year inválido';
  if (!Number.isInteger(b.month)  || b.month  < 1    || b.month  > 12)   return 'month inválido';
  if (!Number.isInteger(b.day)    || b.day    < 1    || b.day    > 31)   return 'day inválido';
  if (!Number.isInteger(b.hour)   || b.hour   < 0    || b.hour   > 23)   return 'hour inválido';
  if (!Number.isInteger(b.minute) || b.minute < 0    || b.minute > 59)   return 'minute inválido';
  if (typeof b.longitude !== 'number') return 'longitude inválida';
  if (typeof b.latitude  !== 'number') return 'latitude inválida';
  if (typeof b.timezone  !== 'number') return 'timezone inválido';
  if (b.gender !== 'M' && b.gender !== 'F') return 'gender inválido';
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  if (req.method !== 'POST')   { res.writeHead(405, CORS); res.end(JSON.stringify({error:'Method Not Allowed'})); return; }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { res.writeHead(400, CORS); res.end(JSON.stringify({error:'JSON inválido'})); return; }

  const err = validate(body);
  if (err) { res.writeHead(422, CORS); res.end(JSON.stringify({error: err})); return; }

  try {
    const result = calculate({
      year: body.year, month: body.month, day: body.day,
      hour: body.hour, minute: body.minute,
      longitude: body.longitude, latitude: body.latitude,
      timezone: body.timezone, dst: Boolean(body.dst),
      gender: body.gender,
    });
    res.writeHead(200, CORS);
    res.end(JSON.stringify(result));
  } catch(e) {
    console.error('[BAZILAR]', e);
    res.writeHead(500, CORS);
    res.end(JSON.stringify({error: 'Erro interno: ' + e.message}));
  }
};
