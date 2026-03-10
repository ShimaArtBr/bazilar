/**
 * sw.js — Service Worker do BaZi PWA
 * =====================================
 * FONTE CANÔNICA: public/sw.js
 *   Processado pelo vite-plugin-pwa (injectManifest strategy).
 *   O plugin injeta self.__WB_MANIFEST com a lista completa de assets
 *   do build (incluindo bundles JS/CSS com hash) antes de gerar dist/sw.js.
 *
 * Estratégia:
 *   • Assets pré-cacheados → self.__WB_MANIFEST (gerado pelo vite-plugin-pwa)
 *   • Assets dinâmicos     → Cache First ao primeiro fetch
 *   • Dados dinâmicos      → Network First (futuras rotas /api/*)
 *   • Fallback offline     → resposta HTML mínima inline
 *
 * Versioning: automático via Workbox revision hashing no __WB_MANIFEST.
 *   Cada build gera URLs únicas — invalida cache automaticamente.
 *
 * Nota: sw.js NÃO usa import/export (suporte ESM em SW ainda é parcial).
 * Toda comunicação com app.js ocorre via postMessage.
 */

'use strict';

// ─── VERSIONING ────────────────────────────────────────────────────────────────

/**
 * Versão do cache estático — dinâmica por build.
 * __BUILD_HASH__ é substituído pelo define do vite.config.js em tempo de build
 * (GIT_SHA, VERCEL_GIT_COMMIT_SHA, ou hash de timestamp como fallback).
 * Mudar esta string por build garante que activate limpe caches de versões anteriores.
 */
const CACHE_VERSION  = 'bazi-v' + __BUILD_HASH__;

/**
 * Cache dedicado para respostas de API (dados dinâmicos).
 * Separado do cache estático para facilitar invalidação independente.
 */
const CACHE_DYNAMIC  = `${CACHE_VERSION}-dynamic`;

/**
 * Lista de assets pré-cacheados injetada pelo vite-plugin-pwa no build.
 *
 * ANTES (CACHE_ASSETS manual): listava apenas arquivos estáticos de public/.
 *   Bundles JS/CSS com hash eram cacheados apenas dinamicamente (primeira visita).
 *
 * AGORA (__WB_MANIFEST): contém TODOS os assets do build com URLs revisioned:
 *   - Shell HTML (/index.html)
 *   - Bundles JS e CSS com hash (ex: /assets/index-Abc123.js)
 *   - Ícones, favicon, manifest.json
 *
 * Em dev (vite dev): __WB_MANIFEST é injetado como array vazio pelo plugin.
 * Em build (vite build): __WB_MANIFEST contém todos os assets com revision hash.
 *
 * @see vite.config.js — injectManifestConfig.globPatterns
 */
const PRECACHE_MANIFEST = self.__WB_MANIFEST || [];


// ─── URLS QUE NUNCA DEVEM SER CACHEADAS ───────────────────────────────────────

/**
 * Padrões de URL cujas respostas são sempre buscadas na rede.
 * Mesmo com cache disponível, a rede tem prioridade.
 */
const NETWORK_ONLY_PATTERNS = [
  /\/api\/auth\//,        // autenticação sempre ao vivo
  /\/api\/payments\//,    // pagamentos nunca cacheados
  /\/api\/webhooks\//,    // webhooks externos
];

// ─── INSTALL — PRÉ-CACHE ──────────────────────────────────────────────────────

/**
 * Evento install: pré-cacheia todos os assets via PRECACHE_MANIFEST (__WB_MANIFEST).
 *
 * PRECACHE_MANIFEST contém objetos { url, revision } gerados pelo vite-plugin-pwa.
 * Extraímos apenas as URLs para cache.addAll(), que é atômico: um único 404
 * reverte toda a instalação.
 *
 * R-NEW-02 CORRIGIDO: skipWaiting() removido do install.
 * SW aguarda em 'waiting' até confirmação via SKIP_WAITING (UNP).
 * Ver app.js: exibirToastAtualizacao()
 */
self.addEventListener('install', (event) => {
  console.log(`[SW] Instalando cache ${CACHE_VERSION}...`);

  // Extrair URLs do manifesto (cada entrada é { url, revision } ou string)
  const precacheUrls = PRECACHE_MANIFEST.map((entry) =>
    typeof entry === 'string' ? entry : entry.url
  );

  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log(`[SW] Pré-cacheando ${precacheUrls.length} assets via __WB_MANIFEST...`);
        // addAll é atômico: um único 404 reverte toda a instalação
        return cache.addAll(precacheUrls);
      })
      .then(() => {
        console.log(`[SW] Instalação concluída. ${precacheUrls.length} assets em cache. Aguardando confirmação do usuário (UNP).`);
        // R-NEW-02: NÃO chamar self.skipWaiting() aqui.
        // O SW ficará em estado 'waiting' até receber postMessage({ type: 'SKIP_WAITING' })
        // enviado pelo app.js após confirmação do usuário via toast de atualização.
      })
      .catch((err) => {
        // Log detalhado para facilitar diagnóstico em CI/CD
        console.error('[SW] Falha na instalação — verifique se todos os assets do __WB_MANIFEST existem:', err);
        throw err; // propaga para cancelar a instalação
      })
  );
});

// ─── ACTIVATE — LIMPEZA DE CACHES ANTIGOS ─────────────────────────────────────

/**
 * Evento activate: remove caches de versões anteriores.
 *
 * clients.claim() faz o SW recém-ativado assumir controle
 * das abas abertas imediatamente, sem necessidade de reload.
 */
self.addEventListener('activate', (event) => {
  console.log(`[SW] Ativando ${CACHE_VERSION}...`);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Mantém apenas os caches da versão atual
        const cachesToDelete = cacheNames.filter(
          (name) => name !== CACHE_VERSION && name !== CACHE_DYNAMIC
        );

        if (cachesToDelete.length > 0) {
          console.log('[SW] Removendo caches obsoletos:', cachesToDelete);
        }

        return Promise.all(
          cachesToDelete.map((name) => caches.delete(name))
        );
      })
      .then(() => {
        console.log('[SW] Ativação concluída. Assumindo controle de todos os clientes.');
        return self.clients.claim();
      })
  );
});

// ─── FETCH — ESTRATÉGIAS DE CACHE ─────────────────────────────────────────────

/**
 * Evento fetch: intercepta todas as requisições de rede.
 * Roteia para a estratégia apropriada com base na URL.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições que não sejam HTTP/HTTPS (ex.: chrome-extension://, /path relativo)
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) return;

  // Ignora métodos não-GET (POST, PUT, DELETE vão direto para a rede)
  if (request.method !== 'GET') return;

  // URLs que nunca devem ser interceptadas
  if (NETWORK_ONLY_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return; // deixa passar sem intervenção
  }

  // Dados dinâmicos → Network First com fallback para cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navegação (HTML) → Cache First com fallback elegante offline
  if (request.mode === 'navigate') {
    event.respondWith(navigateCacheFirst(request));
    return;
  }

  // Assets estáticos → Cache First puro
  event.respondWith(cacheFirst(request));
});

// ─── ESTRATÉGIA: CACHE FIRST ──────────────────────────────────────────────────

/**
 * Cache First: serve do cache imediatamente.
 * Só vai à rede se o asset não estiver em cache.
 * Ideal para assets versionados que nunca mudam sem novo deploy.
 *
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);

    // Cacheia dinamicamente assets não cobertos pelo __WB_MANIFEST
    // mas que o browser busca durante a execução (ex.: imagens lazy)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      // await garante que a entrada é gravada antes de a aba fechar.
      // Sem await, o browser pode cancelar a escrita se o fetch handler
      // retornar antes da Promise de cache.put() ser resolvida.
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Asset não está em cache e a rede falhou — retorna 503 genérico
    return new Response('Asset não disponível offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// ─── ESTRATÉGIA: NETWORK FIRST ────────────────────────────────────────────────

/**
 * Network First: tenta a rede primeiro.
 * Usa o cache apenas se a rede falhar.
 * Ideal para dados de API que mudam com frequência.
 *
 * Timeout de 4 segundos: se a rede não responder, cai para o cache.
 *
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const TIMEOUT_MS = 4000;

  try {
    // Corrida entre rede e timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
      ),
    ]);

    if (networkResponse.ok) {
      // Atualiza o cache dinâmico com a resposta mais recente
      const cache = await caches.open(CACHE_DYNAMIC);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Rede falhou ou demorou demais → tenta o cache
    const cached = await caches.match(request);

    if (cached) {
      console.warn(`[SW] Network First: usando cache para ${request.url}`);
      return cached;
    }

    // Sem rede e sem cache
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Sem conexão e sem dados em cache.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}

// ─── ESTRATÉGIA: NAVIGATE CACHE FIRST (com fallback offline) ─────────────────

/**
 * Navegação: tenta o cache, depois a rede.
 * Se ambos falharem, serve /offline.html (que lê localStorage e exibe
 * o último mapa BaZi calculado sem nenhuma requisição de rede).
 *
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function navigateCacheFirst(request) {
  // 1. Tenta o cache exato
  const cached = await caches.match(request);
  if (cached) return cached;

  // 2. Tenta a rede
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // 3. Rede indisponível → fallback HTML mínimo inline
    // (offline.html não existe no projeto; usar resposta inline)
    console.warn('[SW] Modo offline: servindo resposta inline.');

    // Último recurso: resposta HTML mínima inline
    return new Response(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
       <title>BaZi — Offline</title></head><body>
       <h1>八字</h1><p>Você está offline. Recarregue quando tiver conexão.</p>
       </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ─── BACKGROUND SYNC — PREFERÊNCIAS DO USUÁRIO ────────────────────────────────

/**
 * Background Sync: sincroniza preferências do usuário quando a conexão retorna.
 *
 * O app.js registra a sync com:
 *   navigator.serviceWorker.ready
 *     .then(sw => sw.sync.register('sync-user-preferences'))
 *
 * As preferências pendentes ficam em IndexedDB (chave 'pending-prefs').
 * Usamos IDB via objeto global simplificado — sem dependência externa.
 */
self.addEventListener('sync', (event) => {
  console.log(`[SW] Background Sync disparado: tag="${event.tag}"`);

  if (event.tag === 'sync-user-preferences') {
    event.waitUntil(syncUserPreferences());
  }

  if (event.tag === 'sync-saved-charts') {
    event.waitUntil(syncSavedCharts());
  }
});

/**
 * Lê preferências pendentes do IndexedDB e as envia para /api/preferences.
 * Limpa o registro pendente apenas se o envio tiver sucesso (status 2xx).
 *
 * @returns {Promise<void>}
 */
async function syncUserPreferences() {
  let db;

  try {
    db = await openIDB();
    const pending = await idbGetAll(db, 'pending-prefs');

    if (!pending || pending.length === 0) {
      console.log('[SW] Sync: nenhuma preferência pendente.');
      return;
    }

    console.log(`[SW] Sync: enviando ${pending.length} preferência(s) pendente(s)...`);

    const response = await fetch('/api/preferences', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ preferences: pending }),
    });

    if (!response.ok) {
      throw new Error(`[SW] Sync falhou: HTTP ${response.status}`);
    }

    // Remove registros sincronizados com sucesso
    await idbClear(db, 'pending-prefs');
    console.log('[SW] Sync: preferências sincronizadas com sucesso.');

    // Notifica o cliente que a sync foi concluída
    notifyClients({ type: 'SYNC_COMPLETE', store: 'preferences' });

  } catch (err) {
    console.error('[SW] Sync de preferências falhou (será retentado automaticamente):', err);
    // Não relança: o Background Sync re-tentará automaticamente
  } finally {
    if (db) db.close();
  }
}

/**
 * Sincroniza mapas BaZi salvos localmente que ainda não foram enviados ao servidor.
 *
 * @returns {Promise<void>}
 */
async function syncSavedCharts() {
  let db;

  try {
    db = await openIDB();
    const pending = await idbGetAll(db, 'pending-charts');

    if (!pending || pending.length === 0) return;

    console.log(`[SW] Sync: enviando ${pending.length} mapa(s) pendente(s)...`);

    for (const chart of pending) {
      const response = await fetch('/api/charts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(chart),
      });

      if (response.ok) {
        await idbDelete(db, 'pending-charts', chart.id);
        console.log(`[SW] Sync: mapa ${chart.id} sincronizado.`);
      }
    }

    notifyClients({ type: 'SYNC_COMPLETE', store: 'charts' });

  } catch (err) {
    console.error('[SW] Sync de mapas falhou:', err);
  } finally {
    if (db) db.close();
  }
}

// ─── PUSH NOTIFICATIONS — GRANDES CICLOS DE SORTE (DA YUN) ───────────────────

/**
 * Evento push: recebe notificações do servidor sobre eventos BaZi.
 *
 * Payload esperado (JSON):
 * {
 *   type:    'DA_YUN_START' | 'DA_YUN_WARNING' | 'GENERAL',
 *   title:   string,
 *   body:    string,
 *   pillar:  { stem: string, branch: string },   // apenas para DA_YUN_*
 *   url:     string                              // deep link para o mapa
 * }
 *
 * O servidor envia esta notificação ~30 dias antes do início de um novo
 * Grande Ciclo de Sorte, e no dia exato da transição.
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW] Push recebido sem payload — ignorado.');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    console.error('[SW] Push: payload inválido (não é JSON válido).');
    return;
  }

  const notificationOptions = buildNotificationOptions(payload);

  event.waitUntil(
    self.registration.showNotification(notificationOptions.title, notificationOptions)
  );
});

/**
 * Constrói as opções da notificação com base no tipo do payload.
 *
 * @param {object} payload
 * @returns {NotificationOptions & { title: string }}
 */
function buildNotificationOptions(payload) {
  const BASE_OPTIONS = {
    icon:   '/icons/icon-192.png',
    badge:  '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: { url: payload.url || '/' },
  };

  switch (payload.type) {

    case 'DA_YUN_START':
      // Novo Grande Ciclo de Sorte iniciou — notificação de alta relevância
      return {
        ...BASE_OPTIONS,
        title: `八字 — Novo Da Yun: ${payload.pillar?.stem ?? ''} ${payload.pillar?.branch ?? ''}`,
        body:  payload.body || 'Seu novo Grande Ciclo de Sorte começa hoje. Toque para ver a análise.',
        tag:   'da-yun-start',              // agrupa notificações do mesmo tipo
        requireInteraction: true,           // permanece visível até o usuário interagir
        actions: [
          { action: 'view',    title: 'Ver Análise' },
          { action: 'dismiss', title: 'Dispensar'   },
        ],
      };

    case 'DA_YUN_WARNING':
      // Aviso ~30 dias antes da transição do ciclo
      return {
        ...BASE_OPTIONS,
        title: '八字 — Da Yun: Transição em 30 dias',
        body:  payload.body || 'Seu Grande Ciclo de Sorte está próximo de mudar. Prepare-se.',
        tag:   'da-yun-warning',
        actions: [
          { action: 'view', title: 'Ver Previsão' },
        ],
      };

    default:
      // Notificação genérica
      return {
        ...BASE_OPTIONS,
        title: payload.title || '八字 BaZi',
        body:  payload.body  || 'Nova atualização disponível.',
        tag:   'bazi-general',
      };
  }
}

/**
 * Evento notificationclick: trata o clique e as ações da notificação.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Reutiliza aba existente se possível
        const existing = windowClients.find(
          (client) => client.url === targetUrl && 'focus' in client
        );

        if (existing) {
          return existing.focus();
        }

        // Abre nova aba
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── MENSAGENS DO CLIENTE (postMessage) ───────────────────────────────────────

/**
 * Canal de comunicação bidirecional com app.js.
 *
 * Mensagens suportadas:
 *   { type: 'SKIP_WAITING' }         → força ativação imediata do SW pendente
 *   { type: 'CACHE_STATUS' }         → responde com versão e tamanho do cache
 *   { type: 'CLEAR_DYNAMIC_CACHE' }  → limpa apenas o cache dinâmico
 */
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  switch (type) {

    case 'SKIP_WAITING':
      console.log('[SW] SKIP_WAITING recebido — assumindo controle agora.');
      self.skipWaiting();
      break;

    case 'CACHE_STATUS':
      event.waitUntil(
        caches.keys().then(async (keys) => {
          const sizes = await Promise.all(
            keys.map(async (key) => {
              const cache   = await caches.open(key);
              const entries = await cache.keys();
              return { name: key, entries: entries.length };
            })
          );
          event.source?.postMessage({ type: 'CACHE_STATUS_RESPONSE', caches: sizes });
        })
      );
      break;

    case 'CLEAR_DYNAMIC_CACHE':
      event.waitUntil(
        caches.delete(CACHE_DYNAMIC).then(() => {
          console.log('[SW] Cache dinâmico limpo.');
          event.source?.postMessage({ type: 'DYNAMIC_CACHE_CLEARED' });
        })
      );
      break;

    default:
      console.warn('[SW] Mensagem desconhecida recebida:', type);
  }
});

// ─── HELPERS: IndexedDB SIMPLIFICADO ──────────────────────────────────────────

/**
 * Abre (ou cria) o banco IndexedDB do BaZi PWA.
 * Stores: 'pending-prefs', 'pending-charts'
 *
 * @returns {Promise<IDBDatabase>}
 */
function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bazi-pwa-db', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-prefs')) {
        db.createObjectStore('pending-prefs', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('pending-charts')) {
        db.createObjectStore('pending-charts', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

/**
 * Retorna todos os registros de um object store.
 *
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @returns {Promise<Array>}
 */
function idbGetAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(storeName, 'readonly');
    const store   = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

/**
 * Remove um registro por chave primária.
 *
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @param {string|number} key
 * @returns {Promise<void>}
 */
function idbDelete(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req   = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Remove todos os registros de um object store.
 *
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @returns {Promise<void>}
 */
function idbClear(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── HELPERS: NOTIFICAÇÃO AOS CLIENTES ────────────────────────────────────────

/**
 * Envia uma mensagem para todas as abas controladas pelo SW.
 *
 * @param {object} message
 */
async function notifyClients(message) {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  allClients.forEach((client) => client.postMessage(message));
}
