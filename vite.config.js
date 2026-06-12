/**
 * @file vite.config.js
 * @description Configuração Vite para o BaZi PWA.
 *
 * MIGRAÇÃO (REQ-04): sw-hash-inject manual → vite-plugin-pwa (injectManifest).
 * - strategy: 'injectManifest' preserva public/sw.js como arquivo-fonte.
 * - self.__WB_MANIFEST substitui CACHE_ASSETS manual com hashes reais dos bundles.
 * - injectRegister: false — registro manual em src/app.js preservado.
 * - O plugin gera dist/sw.js com __WB_MANIFEST injetado automaticamente.
 * - getBuildHash() mantém CACHE_VERSION dinâmico → limpeza de cache no activate.
 *
 * ADIÇÃO: apoie.html declarado como segundo entry point (build.rollupOptions.input)
 * para que o Vite o inclua no dist e a Vercel sirva /apoie via cleanUrls.
 *
 * VARIÁVEIS DE AMBIENTE VERCEL (Settings → Environment Variables):
 * VITE_BAZI_STEMS_V2=0
 * VITE_BAZI_SOLAR_V2=0
 * VITE_BAZI_JIEQI_V2=0
 * VITE_BAZI_EPHEM_V2=0
 */

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { createHash } from 'crypto';
import { resolve } from 'path';

/**
 * Gera um hash de build determinístico de 8 caracteres.
 * Usado para CACHE_VERSION no sw.js — garante que activate limpe caches antigos.
 * @returns {string}
 */
function getBuildHash() {
  if (process.env.GIT_SHA) return process.env.GIT_SHA.slice(0, 8);
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8);
  return createHash('sha256').update(Date.now().toString()).digest('hex').slice(0, 8);
}

export default defineConfig(() => {
  const buildHash = getBuildHash();

  return {
    root: '.',
    publicDir: 'public',

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main:  resolve(__dirname, 'index.html'),
          apoie: resolve(__dirname, 'apoie.html'),
        },
      },
    },

    // Expõe o hash para flags.js e sw.js (substituição via define no bundle)
    define: {
      '__BUILD_HASH__': JSON.stringify(buildHash),
    },

    plugins: [
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        injectRegister: false,
        manifest: {
          name: 'BaZi 八字 — Quatro Pilares',
          short_name: 'BaZi',
          description: 'Calcule seu Mapa BaZi com precisão astronômica.',
          start_url: '/',
          display: 'standalone',
          background_color: '#0F0E0A',
          theme_color: '#0F0E0A',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        injectManifestConfig: {
          globPatterns: ['**/*.{html,js,css,png,svg,ico,json,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
  };
});
