/**
 * @file api/pix-webhook.js
 * @description Vercel Function — recebe notificações do Mercado Pago e ativa Premium.
 *
 * O Mercado Pago envia POST quando o status do pagamento muda.
 * Fluxo: payment.updated → busca pagamento na MP API → se approved, ativa premium no Supabase.
 *
 * Configurar no painel MP:
 *   Aplicação → Notificações Webhooks → URL: https://bazilar.app/api/pix-webhook
 *   Eventos: Pagamentos
 *
 * Variáveis de ambiente:
 *   MP_ACCESS_TOKEN      — Access Token Mercado Pago
 *   MP_WEBHOOK_SECRET    — Secret configurado no painel MP (Notificações → Secret)
 *   SUPABASE_URL         — https://zgyyvjfckxpwnsucrvfg.supabase.co
 *   SUPABASE_SERVICE_KEY — service_role key
 *
 * @sprint S5
 */

export const config = { runtime: 'edge' };

const MP_API       = 'https://api.mercadopago.com';
const PREMIUM_DIAS = 30;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // ── Verificação de assinatura MP ─────────────────────────────────────────
  // O MP envia x-signature e x-request-id nos headers.
  const xSignature  = req.headers.get('x-signature');
  const xRequestId  = req.headers.get('x-request-id');
  const secret      = process.env.MP_WEBHOOK_SECRET;

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (secret && xSignature) {
    const valid = await verificarAssinatura(xSignature, xRequestId, body, secret);
    if (!valid) {
      console.warn('[webhook] Assinatura inválida');
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // ── Processar apenas eventos de pagamento ────────────────────────────────
  const { type, data } = body;

  if (type !== 'payment' || !data?.id) {
    // Outros eventos (ex: merchant_order) — ignorar silenciosamente
    return new Response('OK', { status: 200 });
  }

  const paymentId = String(data.id);

  // ── Buscar pagamento completo na MP API ──────────────────────────────────
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  let pagamento;
  try {
    const resp = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!resp.ok) throw new Error(`MP API ${resp.status}`);
    pagamento = await resp.json();
  } catch (err) {
    console.error('[webhook] Erro ao buscar pagamento:', err);
    return new Response('Bad Gateway', { status: 502 });
  }

  // ── Apenas pagamentos aprovados ──────────────────────────────────────────
  if (pagamento.status !== 'approved') {
    console.log(`[webhook] Pagamento ${paymentId} status: ${pagamento.status} — ignorado`);
    return new Response('OK', { status: 200 });
  }

  const user_id     = pagamento.metadata?.user_id;
  const valor_pago  = Math.round(pagamento.transaction_amount * 100); // centavos

  if (!user_id) {
    console.error('[webhook] user_id ausente no metadata do pagamento', paymentId);
    return new Response('OK', { status: 200 }); // não retornar erro — MP reenvia
  }

  // ── Ativar premium no Supabase (service_role bypassa RLS) ───────────────
  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PREMIUM_DIAS);

  try {
    // 1. Inserir em premium_access (upsert pelo txid para idempotência)
    const rPremium = await fetch(`${SUPABASE_URL}/rest/v1/premium_access`, {
      method: 'POST',
      headers: sbHeaders(SUPABASE_SERVICE_KEY),
      body: JSON.stringify({
        user_id,
        txid:           paymentId,
        expires_at:     expiresAt.toISOString(),
        payment_method: 'pix',
        valor_pago,
      }),
    });

    if (!rPremium.ok && rPremium.status !== 409) {
      // 409 = txid duplicado (webhook reenviado) — idempotente, ok ignorar
      const errText = await rPremium.text();
      throw new Error(`Supabase premium_access: ${rPremium.status} ${errText}`);
    }

    // 2. Atualizar tier do usuário
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user_id}`, {
      method: 'PATCH',
      headers: sbHeaders(SUPABASE_SERVICE_KEY),
      body: JSON.stringify({ tier: 'premium' }),
    });

    // 3. Registrar doação
    await fetch(`${SUPABASE_URL}/rest/v1/donations`, {
      method: 'POST',
      headers: sbHeaders(SUPABASE_SERVICE_KEY),
      body: JSON.stringify({ user_id, valor: valor_pago, txid: paymentId }),
    });

    console.log(`[webhook] Premium ativado: user=${user_id} expires=${expiresAt.toISOString()}`);

  } catch (err) {
    console.error('[webhook] Erro ao ativar premium:', err);
    // Retornar 500 faz o MP reenviar — útil para falhas transitórias
    return new Response('Internal Server Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sbHeaders(serviceKey) {
  return {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer':        'return=minimal',
  };
}

/**
 * Verifica assinatura HMAC-SHA256 do Mercado Pago.
 * Formato x-signature: ts=<timestamp>,v1=<hash>
 */
async function verificarAssinatura(xSignature, xRequestId, body, secret) {
  try {
    const parts = Object.fromEntries(xSignature.split(',').map(p => p.split('=')));
    const ts    = parts.ts;
    const v1    = parts.v1;
    if (!ts || !v1) return false;

    const dataId  = body?.data?.id ?? '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return hex === v1;
  } catch {
    return false;
  }
}
