/**
 * @file api/pix.js
 * @description Vercel Function — cria cobrança Pix via Mercado Pago.
 *
 * POST /api/pix
 * Body: { valor_centavos: number, user_id: string, email: string }
 * Response: { txid, qrcode_b64, copia_e_cola, expiracao }
 *
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   MP_ACCESS_TOKEN   — Access Token de produção do Mercado Pago
 *   SUPABASE_URL      — https://zgyyvjfckxpwnsucrvfg.supabase.co
 *   SUPABASE_SERVICE_KEY — service_role key (nunca a anon)
 *
 * @sprint S5
 */

export const config = { runtime: 'edge' };

const MP_API = 'https://api.mercadopago.com';

export default async function handler(req) {
  // ── CORS preflight ────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }

  const { valor_centavos, user_id, email } = body;

  if (!valor_centavos || !user_id || !email) {
    return json({ error: 'Campos obrigatórios: valor_centavos, user_id, email' }, 400);
  }

  if (!Number.isInteger(valor_centavos) || valor_centavos < 100) {
    return json({ error: 'valor_centavos deve ser inteiro ≥ 100' }, 400);
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    return json({ error: 'Configuração de pagamento indisponível' }, 500);
  }

  // ── Criar cobrança Pix no Mercado Pago ───────────────────────────────────
  const idempotencyKey = `bazi-${user_id}-${Date.now()}`;
  const valorReais = (valor_centavos / 100).toFixed(2);

  const payload = {
    transaction_amount: parseFloat(valorReais),
    description:        'BaZi — Acesso Premium 30 dias',
    payment_method_id:  'pix',
    payer: {
      email,
    },
    metadata: {
      user_id,
      produto: 'premium_30d',
    },
  };

  let mpResponse;
  try {
    mpResponse = await fetch(`${MP_API}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'Authorization':      `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key':  idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[pix] Erro ao chamar MP API:', err);
    return json({ error: 'Erro ao criar cobrança' }, 502);
  }

  if (!mpResponse.ok) {
    const errBody = await mpResponse.text();
    console.error('[pix] MP API erro:', mpResponse.status, errBody);
    return json({ error: 'Erro na gateway de pagamento' }, 502);
  }

  const mpData = await mpResponse.json();
  const pix = mpData.point_of_interaction?.transaction_data;

  if (!pix?.qr_code) {
    console.error('[pix] Sem QR code na resposta MP:', JSON.stringify(mpData));
    return json({ error: 'QR Code indisponível' }, 502);
  }

  // ── Retorno para o browser ────────────────────────────────────────────────
  return json({
    txid:        String(mpData.id),
    qrcode_b64:  pix.qr_code_base64,
    copia_e_cola: pix.qr_code,
    expiracao:   mpData.date_of_expiration,
    status:      mpData.status,
  }, 200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  'https://bazilar.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
