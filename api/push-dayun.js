/**
 * @file api/push-dayun.js
 * @description Vercel Cron Function — envia Web Push VAPID para usuários
 *              com transição de Da Yun (Grande Ciclo) próxima.
 *
 * Cron: 0 11 * * * (11:00 UTC = 08:00 BRT, diário)
 * Configurar em vercel.json → crons[].
 *
 * Segurança: CRON_SECRET verificado em cada chamada.
 *   curl sem header → 401.
 *
 * Variáveis de ambiente (Vercel):
 *   VAPID_PUBLIC_KEY   — BFgMHYkCn4MIIl1RlhmRqsTUCQt_0dFiiLtFN_38ZJJYQxDSwWCb4qnqXWct0suZa2IagPejXhqzK3pKb9asvL4
 *   VAPID_PRIVATE_KEY  — haO_MUh5o6dLDeExX7VbdmaA-VhrKnxkoLD47ngvHuQ
 *   VAPID_SUBJECT      — mailto:contato@bazilar.app
 *   SUPABASE_URL       — https://zgyyvjfckxpwnsucrvfg.supabase.co
 *   SUPABASE_SERVICE_KEY — service_role key
 *   CRON_SECRET        — string aleatória longa
 *
 * @sprint S5
 */

export const config = { runtime: 'edge' };

// Janela: notificar usuários cuja transição ocorre nos próximos N dias
const JANELA_DIAS = 7;

export default async function handler(req) {
  // ── Autenticação CRON_SECRET ──────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const SUPABASE_URL       = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const VAPID_PUBLIC_KEY   = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY  = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT      = process.env.VAPID_SUBJECT || 'mailto:contato@bazilar.app';

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response('VAPID keys não configuradas', { status: 500 });
  }

  // ── Buscar usuários com transição próxima ────────────────────────────────
  const hoje     = new Date();
  const limite   = new Date(hoje);
  limite.setDate(limite.getDate() + JANELA_DIAS);

  const hojeISO  = hoje.toISOString().split('T')[0];
  const limiteISO = limite.toISOString().split('T')[0];

  const usersResp = await fetch(
    `${SUPABASE_URL}/rest/v1/users?dayun_next_transition=gte.${hojeISO}&dayun_next_transition=lte.${limiteISO}&select=id,email,dayun_next_transition`,
    { headers: sbHeaders(SUPABASE_SERVICE_KEY) }
  );

  if (!usersResp.ok) {
    console.error('[push-dayun] Erro ao buscar usuários:', await usersResp.text());
    return new Response('Supabase error', { status: 502 });
  }

  const users = await usersResp.json();

  if (!users.length) {
    console.log('[push-dayun] Nenhuma transição nos próximos', JANELA_DIAS, 'dias.');
    return new Response(JSON.stringify({ enviadas: 0 }), { status: 200 });
  }

  // ── Para cada usuário, buscar subscriptions ativas ───────────────────────
  let enviadas = 0;
  let falhas   = 0;

  for (const user of users) {
    const subsResp = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${user.id}&active=eq.true&select=endpoint,keys`,
      { headers: sbHeaders(SUPABASE_SERVICE_KEY) }
    );

    if (!subsResp.ok) continue;
    const subs = await subsResp.json();

    const diasRestantes = Math.ceil(
      (new Date(user.dayun_next_transition) - hoje) / (1000 * 60 * 60 * 24)
    );

    const payload = JSON.stringify({
      title: 'BaZi — Transição de Grande Ciclo',
      body:  diasRestantes <= 1
        ? 'Seu novo Grande Ciclo (大運) começa hoje!'
        : `Seu Grande Ciclo muda em ${diasRestantes} dias. Confira seu mapa.`,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      url:   '/?source=push_dayun',
      tag:   'dayun-transition',
    });

    for (const sub of subs) {
      try {
        const ok = await sendWebPush({
          endpoint:   sub.endpoint,
          keys:       sub.keys,
          payload,
          vapidPublic:  VAPID_PUBLIC_KEY,
          vapidPrivate: VAPID_PRIVATE_KEY,
          vapidSubject: VAPID_SUBJECT,
        });

        if (ok) {
          enviadas++;
        } else {
          falhas++;
          // Desativar subscription inválida (410 Gone)
          await fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
            {
              method:  'PATCH',
              headers: sbHeaders(SUPABASE_SERVICE_KEY),
              body:    JSON.stringify({ active: false }),
            }
          );
        }
      } catch (err) {
        console.error('[push-dayun] Erro ao enviar push:', err);
        falhas++;
      }
    }
  }

  console.log(`[push-dayun] enviadas=${enviadas} falhas=${falhas}`);
  return new Response(JSON.stringify({ enviadas, falhas }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Web Push via Web Crypto (Edge Runtime — sem node-fetch ou web-push pkg) ───

/**
 * Envia uma Web Push notification usando VAPID manual via Web Crypto API.
 * Compatível com Edge Runtime (sem Node.js nativo).
 *
 * @returns {Promise<boolean>} true se entregue, false se subscription inválida
 */
async function sendWebPush({ endpoint, keys, payload, vapidPublic, vapidPrivate, vapidSubject }) {
  // Gerar JWT VAPID
  const jwt = await buildVapidJWT(endpoint, vapidSubject, vapidPrivate);

  // Cifrar payload com ECDH + AES-128-GCM (Web Push encryption)
  const encrypted = await encryptPayload(payload, keys.p256dh, keys.auth);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization':  `vapid t=${jwt},k=${vapidPublic}`,
      'Content-Type':   'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL':            '86400',
    },
    body: encrypted,
  });

  if (resp.status === 201 || resp.status === 200) return true;
  if (resp.status === 404 || resp.status === 410) return false; // subscription expirada
  console.warn('[push] Status inesperado:', resp.status, endpoint);
  return false;
}

/**
 * Constrói JWT VAPID assinado com ES256 via Web Crypto.
 */
async function buildVapidJWT(endpoint, subject, privateKeyB64url) {
  const url      = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const exp      = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header  = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims  = b64url(JSON.stringify({ aud: audience, exp, sub: subject }));
  const signing = `${header}.${claims}`;

  // Importar chave privada VAPID (base64url → raw bytes → CryptoKey)
  const keyBytes = base64urlToBytes(privateKeyB64url);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    wrapPkcs8(keyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signing)
  );

  return `${signing}.${bytesToB64url(new Uint8Array(sig))}`;
}

/**
 * Cifra o payload usando RFC 8291 (aes128gcm).
 * Implementação simplificada para Edge Runtime.
 */
async function encryptPayload(payload, p256dhB64url, authB64url) {
  const recipientPublicKey = base64urlToBytes(p256dhB64url);
  const authSecret         = base64urlToBytes(authB64url);

  // Gerar par ECDH efêmero
  const senderKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const senderPublicRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', senderKeys.publicKey)
  );

  // Importar chave pública do receptor
  const recipientKey = await crypto.subtle.importKey(
    'raw', recipientPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  );

  // Derivar shared secret
  const sharedBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: recipientKey },
      senderKeys.privateKey,
      256
    )
  );

  // Salt aleatório 16 bytes
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF para content encryption key e nonce (RFC 8291)
  const prk = await hkdf(authSecret, sharedBits, buildInfo('auth', new Uint8Array(0), new Uint8Array(0)), 32);
  const cek = await hkdf(salt, prk, buildInfo('aesgcm', senderPublicRaw, recipientPublicKey), 16);
  const nonce = await hkdf(salt, prk, buildInfo('nonce', senderPublicRaw, recipientPublicKey), 12);

  // Cifrar com AES-128-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      new TextEncoder().encode(payload)
    )
  );

  // Montar cabeçalho aes128gcm (RFC 8291 §2.1)
  const header = new Uint8Array(21 + senderPublicRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false); // rs = 4096
  header[20] = senderPublicRaw.length;
  header.set(senderPublicRaw, 21);

  const result = new Uint8Array(header.length + ciphertext.length);
  result.set(header, 0);
  result.set(ciphertext, header.length);
  return result;
}

// ── Helpers criptográficos ────────────────────────────────────────────────────

function base64urlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function bytesToB64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64url(str) {
  return bytesToB64url(new TextEncoder().encode(str));
}

/** Wraps raw 32-byte EC private key in minimal PKCS#8 DER for P-256 */
function wrapPkcs8(rawKey) {
  // PKCS#8 template for P-256 private key
  const prefix = new Uint8Array([
    0x30,0x41,0x02,0x01,0x00,0x30,0x13,0x06,0x07,0x2a,0x86,0x48,0xce,0x3d,0x02,0x01,
    0x06,0x08,0x2a,0x86,0x48,0xce,0x3d,0x03,0x01,0x07,0x04,0x27,0x30,0x25,0x02,0x01,
    0x01,0x04,0x20,
  ]);
  const der = new Uint8Array(prefix.length + rawKey.length);
  der.set(prefix); der.set(rawKey, prefix.length);
  return der.buffer;
}

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key, length * 8
  );
  return new Uint8Array(bits);
}

function buildInfo(type, clientPublic, serverPublic) {
  const enc = new TextEncoder();
  const label = enc.encode(`Content-Encoding: ${type}\0`);
  const info = new Uint8Array(label.length + 2 + clientPublic.length + 2 + serverPublic.length);
  let offset = 0;
  info.set(label, offset); offset += label.length;
  new DataView(info.buffer).setUint16(offset, clientPublic.length, false); offset += 2;
  info.set(clientPublic, offset); offset += clientPublic.length;
  new DataView(info.buffer).setUint16(offset, serverPublic.length, false); offset += 2;
  info.set(serverPublic, offset);
  return info;
}

function sbHeaders(serviceKey) {
  return {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer':        'return=minimal',
  };
}
