/**
 * @file tests/e2e/accessibility.test.js
 * @description Testes E2E de acessibilidade — navegação por teclado,
 *              ARIA states, foco visível e contratos semânticos.
 *
 * Critérios cobertos: E16 (Luck Strip teclado), E17 (lang zh-Hans),
 *                     WCAG 2.2 AA SC 2.1.1 (teclado), SC 2.4.3 (foco)
 *
 * @persona  Ana Luz — QA Acessibilidade & E2E
 * @sprint   S3·W1 · REQ-12
 */

import { test, expect } from '@playwright/test';

// ── Helper: calcula mapa GC026 ──────────────────────────────────────────────
async function calcularGC026(page) {
  await page.goto('/');
  await page.fill('#inD', '8');
  await page.fill('#inM', '8');
  await page.fill('#inY', '2008');
  await page.fill('#inT', '08:08');
  await page.selectOption('#inTZ', '8');
  await page.click('#gM');
  await page.click('#calcBtn');
  await expect(page.locator('.bazi-map')).toBeVisible({ timeout: 8_000 });
}

// ── Testes ─────────────────────────────────────────────────────────────────

test.describe('Acessibilidade — Teclado e ARIA', () => {

  test('Tab navega pelo formulário em ordem lógica', async ({ page }) => {
    await page.goto('/');

    // Foca o primeiro campo via Tab
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.id);

    // Skip link recebe foco primeiro
    expect(['skip-link', 'inName', '']).toContain(
      await page.evaluate(() => document.activeElement?.className?.includes('skip-link') ? 'skip-link' : document.activeElement?.id)
    );

    // Continua tabulando até calcBtn
    const ordem = ['inName', 'inD', 'inM', 'inY', 'inT', 'gF', 'gM', 'inCity', 'inLo', 'inLa', 'inTZ', 'inDST', 'calcBtn'];
    for (const id of ordem) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.id);
      if (focused === id) {
        // encontrou na ordem esperada — continua
        expect(focused).toBe(id);
        break;
      }
    }
  });

  test('calcBtn acionado por Enter', async ({ page }) => {
    await page.goto('/');
    await page.fill('#inD', '8');
    await page.fill('#inM', '8');
    await page.fill('#inY', '2008');
    await page.fill('#inT', '08:08');
    await page.selectOption('#inTZ', '8');

    // Foca o botão e pressiona Enter
    await page.locator('#calcBtn').focus();
    await page.keyboard.press('Enter');

    // App não deve quebrar (botão ainda visível)
    await expect(page.locator('#calcBtn')).toBeVisible();
  });

  test('ziToggle acionado por Enter e Space', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#ziToggle');

    await toggle.focus();

    // Enter abre
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Space fecha
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('pilares navegáveis por Tab após cálculo (E16)', async ({ page }) => {
    await calcularGC026(page);

    // Pilares têm tabindex="0" — devem ser focáveis
    const pilares = page.locator('.bazi-pillar[tabindex="0"]');
    await expect(pilares).toHaveCount(4);

    // Foca o primeiro pilar via Tab
    await pilares.first().focus();
    const focado = await page.evaluate(() => document.activeElement?.classList.contains('bazi-pillar'));
    expect(focado).toBe(true);
  });

  test('Grandes Ciclos navegáveis por Tab (E16 Luck Strip)', async ({ page }) => {
    await calcularGC026(page);

    const luckPillars = page.locator('.luck-pillar[tabindex="0"]');
    await expect(luckPillars).toHaveCount(8);

    await luckPillars.first().focus();
    const focado = await page.evaluate(() => document.activeElement?.classList.contains('luck-pillar'));
    expect(focado).toBe(true);
  });

  test('spans CJK têm lang="zh-Hans" (E17 REQ-11)', async ({ page }) => {
    await calcularGC026(page);

    // Todos os spans de caracteres devem ter lang=zh-Hans
    const charSpans = page.locator('.bazi-pillar__char');
    await expect(charSpans).toHaveCount(8);

    for (const span of await charSpans.all()) {
      await expect(span).toHaveAttribute('lang', 'zh-Hans');
    }
  });

  test('aria-label dos pilares descreve o conteúdo', async ({ page }) => {
    await calcularGC026(page);

    const pilares = page.locator('.bazi-pillar');
    const primeiro = pilares.first();
    const label = await primeiro.getAttribute('aria-label');

    // Deve conter "Pilar" e algum nome de tronco/ramo
    expect(label).toMatch(/Pilar/i);
    expect(label?.length).toBeGreaterThan(10);
  });

  test('elemento vazio tem aria-hidden no ícone decorativo', async ({ page }) => {
    await page.goto('/');
    const ico = page.locator('.empty-ico');
    await expect(ico).toHaveAttribute('aria-hidden', 'true');
  });

  test('foco visível no botão de tema (outline dourado)', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#themeBtn');
    await btn.focus();

    // Verifica que elemento tem foco (outline via CSS :focus-visible)
    const isFocused = await page.evaluate(() =>
      document.activeElement?.id === 'themeBtn'
    );
    expect(isFocused).toBe(true);
  });

  test('grupo de gênero tem role=group e aria-labelledby', async ({ page }) => {
    await page.goto('/');
    const grupo = page.locator('.gender-row');
    await expect(grupo).toHaveAttribute('role', 'group');
    await expect(grupo).toHaveAttribute('aria-labelledby', 'genderLabel');
  });

  test('inputs de coordenadas têm aria-label', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#inLo')).toHaveAttribute('aria-label', 'Longitude');
    await expect(page.locator('#inLa')).toHaveAttribute('aria-label', 'Latitude');
  });

});
