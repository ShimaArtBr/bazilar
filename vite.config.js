/**
 * @file vite.config.js
 * @description Configuração Vite para o BaZi PWA.
 *
 * MIGRAÇÃO (REQ-04): sw-hash-inject manual → vite-plugin-pwa (injectManifest).
 *   - strategy: 'injectManifest' preserva public/sw.js como arquivo-fonte.
 *   - self.__WB_MANIFEST substitui CACHE_ASSETS manual com hashes reais dos bundles.
 *   - injectRegister: false — registro manual em src/app.js preservado.
 *   - O plugin gera dist/sw.js com __WB_MANIFEST injetado automaticamente.
 *   - getBuildHash() mantém CACHE_VERSION dinâmico → limpeza de cache no activate.
 *
 * ANTES (sw-hash-inject):
 *   - CACHE_ASSETS listava apenas arquivos estáticos de public/
 *   - Bundles JS/CSS com hash eram cacheados apenas dinamicamente (primeira visita)
 *   - __BUILD_HASH__ era substituído manualmente via closeBundle hook
 *
 * DEPOIS (vite-plugin-pwa):
 *   - self.__WB_MANIFEST contém TODOS os assets do build com hashes corretos
 *   - Pre-cache completo: shell + bundles JS/CSS + ícones + manifest
 *   - Cache revisioning automático via Workbox (sem plugin manual)
 *   - CACHE_VERSION ainda dinâmico via define — activate deleta caches antigos
 *
 * VARIÁVEIS DE AMBIENTE VERCEL (Settings → Environment Variables):
 *   VITE_BAZI_STEMS_V2=0
 *   VITE_BAZI_SOLAR_V2=0
 *   VITE_BAZI_JIEQI_V2=0
 *   VITE_BAZI_EPHEM_V2=0
 */

import { defineConfig } from 'vite';
import { VitePWA }      from 'vite-plugin-pwa';
import { createHash }   from 'crypto';

/**
 * Gera um hash de build determinístico de 8 caracteres.
 * Usado para CACHE_VERSION no sw.js — garante que activate limpe caches antigos.
 * @returns {string}
 */
function getBuildHash() {
  if (process.env.GIT_SHA)                return process.env.GIT_SHA.slice(0, 8);
  if (process.env.VERCEL_GIT_COMMIT_SHA)  return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8);
  return createHash('sha256').update(Date.now().toString()).digest('hex').slice(0, 8);
}

export default defineConfig(() => {
  const buildHash = getBuildHash();

  return {
    root:      '.',
    publicDir: 'public',

    build: {
      outDir:      'dist',
      emptyOutDir: true,
    },

    // Expõe o hash para flags.js e sw.js (substituição via define no bundle)
    define: {
      '__BUILD_HASH__': JSON.stringify(buildHash),
    },

    plugins: [
      VitePWA({
        /**
         * injectManifest: preserva public/sw.js como arquivo-fonte.
         * O plugin injeta self.__WB_MANIFEST no sw.js compilado.
         * Alternativa (generateSW) seria gerado automaticamente — não usada
         * pois o sw.js atual tem lógica personalizada (UNP, sync, push, postMessage).
         */
        strategies:     'injectManifest',
        srcDir:         'public',
        filename:       'sw.js',

        /**
         * injectRegister: false — NÃO gerar script de registro automático.
         * src/app.js já registra o SW manualmente com Update Notification Pattern.
         * Registro automático conflitaria com a lógica UNP existente.
         */
        injectRegister: false,

        /**
         * manifest: espelha public/manifest.json.
         * O plugin usa este objeto para validação e para injetar o link
         * <link rel="manifest"> no index.html durante o build.
         * MANTER sincronizado com public/manifest.json.
         */
        manifest: {
          name:             'BaZi 八字 — Quatro Pilares',
          short_name:       'BaZi',
          description:      'Calcule seu Mapa BaZi com precisão astronômica.',
          start_url:        '/',
          display:          'standalone',
          background_color: '#0F0E0A',
          theme_color:      '#0F0E0A',
          icons: [
            {
              src:   '/icons/icon-192.png',
              sizes: '192x192',
              type:  'image/png',
            },
            {
              src:   '/icons/icon-512.png',
              sizes: '512x512',
              type:  'image/png',
            },
          ],
        },

        /**
         * injectManifestConfig: configuração do Workbox para injeção do manifesto.
         * globPatterns define quais assets do build são incluídos em __WB_MANIFEST.
         * Padrão cobre: HTML, JS, CSS e assets comuns (imagens, fontes, SVG, JSON).
         */
        injectManifestConfig: {
          globPatterns: ['**/*.{html,js,css,png,svg,ico,json,woff2}'],
        },

        /**
         * devOptions: ativa o SW em modo dev para facilitar testes locais.
         * O SW em dev é um stub — não afeta HMR.
         */
        devOptions: {
          enabled: true,
          type:    'module',
        },
      }),
    ],
  };
});

