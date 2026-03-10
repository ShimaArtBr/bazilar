/**
 * @file playwright.config.js
 * @description Configuração Playwright para testes E2E do BaZi PWA.
 *              Cobre os 5 navegadores-alvo do spec REQ-12:
 *              Chrome, Firefox, Safari (WebKit), Edge, Mobile Safari.
 *
 * Execução:
 *   npm run test:e2e            — todos os browsers
 *   npm run test:e2e:smoke      — apenas chromium (CI rápido)
 *   npx playwright test --ui    — modo interativo
 *
 * @persona  Ana Luz — QA Acessibilidade & E2E
 * @sprint   S3·W1 · REQ-12
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  /* Diretório onde ficam os testes E2E */
  testDir: './tests/e2e',

  /* Timeout por teste (ms) */
  timeout: 30_000,

  /* Timeout para asserções expect() */
  expect: { timeout: 5_000 },

  /* Re-executar testes flaky até 2x antes de falhar */
  retries: process.env.CI ? 2 : 0,

  /* Workers paralelos: 1 em CI para reprodutibilidade */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter: lista detalhada + HTML (aberto automaticamente em falha) */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
  ],

  /* Configurações globais compartilhadas entre todos os projetos */
  use: {
    /* URL base do servidor de dev/preview */
    baseURL: 'http://localhost:4173',

    /* Captura screenshot apenas em falha */
    screenshot: 'only-on-failure',

    /* Grava vídeo apenas em falha */
    video: 'retain-on-failure',

    /* Trace para debug de falhas em CI */
    trace: 'on-first-retry',

    /* Locale PT-BR */
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  /* ── Projetos (navegadores-alvo) ─────────────────────────────────────── */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* ── Servidor local ──────────────────────────────────────────────────── */
  webServer: {
    /* `vite preview` serve o build de produção — mais próximo do deploy real */
    command: 'npm run build && npx vite preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
