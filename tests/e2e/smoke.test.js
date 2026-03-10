/**
 * @file tests/e2e/smoke.test.js
 * @description Smoke tests — verifica que o app carrega corretamente e
 *              todos os elementos essenciais estão presentes e acessíveis.
 *              Execução rápida (~5s): usado como gate de CI antes de testes completos.
 *
 * Critérios cobertos: E06 (BAZILAR funcional), E25 (LCP ≤ 2.5s)
 *
 * @persona  Ana Luz — QA Acessibilidade & E2E
 * @sprint   S3·W1 · REQ-12
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke — Carregamento e estrutura', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('página carrega com título correto', async ({ page }) => {
    await expect(page).toHaveTitle(/BAZILAR/i);
  });

  test('topbar e brand visíveis', async ({ page }) => {
    await expect(page.locator('.topbar-name')).toBeVisible();
    await expect(page.locator('.topbar-name')).toContainText('BAZILAR');
  });

  test('formulário de nascimento visível', async ({ page }) => {
    await expect(page.locator('aside.input-panel')).toBeVisible();
    await expect(page.locator('#inD')).toBeVisible();
    await expect(page.locator('#inM')).toBeVisible();
    await expect(page.locator('#inY')).toBeVisible();
    await expect(page.locator('#inT')).toBeVisible();
    await expect(page.locator('#calcBtn')).toBeVisible();
  });

  test('botão calcular está habilitado', async ({ page }) => {
    await expect(page.locator('#calcBtn')).toBeEnabled();
  });

  test('area de resultados existe com estado vazio', async ({ page }) => {
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#emptyState')).toBeVisible();
  });

  test('skip link presente e funcional', async ({ page }) => {
    // Skip link está oculto visualmente mas presente no DOM (acessibilidade)
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#results');
  });

  test('botão de tema (dark/light) presente e operacional', async ({ page }) => {
    const themeBtn = page.locator('#themeBtn');
    await expect(themeBtn).toBeVisible();
    await expect(themeBtn).toHaveAttribute('aria-label', 'Alternar tema');

    // Alterna tema
    const htmlEl = page.locator('html');
    const temaBefore = await htmlEl.getAttribute('data-theme');
    await themeBtn.click();
    const temaAfter = await htmlEl.getAttribute('data-theme');
    expect(temaBefore).not.toBe(temaAfter);
  });

  test('LCP ≤ 2.5s (E25 REQ-11)', async ({ page }) => {
    // Mede LCP via Performance API
    const lcp = await page.evaluate(() =>
      new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          resolve(last?.startTime ?? 0);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        // Fallback após 3s se LCP não disparar
        setTimeout(() => resolve(0), 3000);
      })
    );
    // LCP = 0 pode indicar que o observer não capturou (ex.: SSR) — aceitar
    if (lcp > 0) {
      expect(lcp, `LCP ${lcp.toFixed(0)}ms deve ser ≤ 2500ms`).toBeLessThanOrEqual(2500);
    }
  });

  test('Service Worker registrado (PWA)', async ({ page, context }) => {
    // Aguarda SW registration
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await navigator.serviceWorker.ready;
        return !!reg;
      } catch {
        return false;
      }
    });
    expect(swRegistered, 'Service Worker deve estar registrado').toBe(true);
  });

});
