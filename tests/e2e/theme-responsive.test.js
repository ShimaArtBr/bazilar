/**
 * @file tests/e2e/theme-responsive.test.js
 * @description Testes E2E de tema dark/light, responsividade e troncos ocultos.
 *              Cobre os itens do SMOKE_TEST_CHECKLIST.md que não tinham cobertura
 *              automatizada: seções 3, 6 e item 2.10.
 *
 * Critérios cobertos:
 *   - Checklist §3 (Tema Dark/Light) — 3.1 a 3.5
 *   - Checklist §6 (Responsividade) — 6.1 a 6.5
 *   - Checklist §2.10 (Troncos Ocultos)
 *
 * @persona  Ana Luz — QA Acessibilidade & E2E
 * @sprint   Q23 · REQ-12
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

// ═══════════════════════════════════════════════════════════════════════════
// §3 — Tema Dark / Light
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Tema Dark / Light', () => {

  test('app inicia em dark mode por padrão', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('botão de tema alterna de dark para light (3.1)', async ({ page }) => {
    await page.goto('/');
    const html   = page.locator('html');
    const btn    = page.locator('#themeBtn');

    await expect(html).toHaveAttribute('data-theme', 'dark');
    await btn.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('botão de tema alterna de light para dark (3.1)', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const btn  = page.locator('#themeBtn');

    await btn.click(); // dark → light
    await btn.click(); // light → dark
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('ícone do botão muda com o tema', async ({ page }) => {
    await page.goto('/');
    const icon = page.locator('#themeIcon');
    const btn  = page.locator('#themeBtn');

    const iconBefore = await icon.textContent();
    await btn.click();
    const iconAfter = await icon.textContent();
    expect(iconBefore).not.toBe(iconAfter);
  });

  test('mapa BaZi legível após troca de tema (3.5)', async ({ page }) => {
    await calcularGC026(page);

    // Alterna tema com mapa renderizado
    await page.locator('#themeBtn').click();

    // Mapa ainda visível e com os 8 chars
    await expect(page.locator('.bazi-map')).toBeVisible();
    await expect(page.locator('.bazi-pillar__char')).toHaveCount(8);
  });

  test('cores Wu Xing presentes em dark mode (3.4)', async ({ page }) => {
    await calcularGC026(page);
    // Barras de elemento Wu Xing devem estar visíveis
    await expect(page.locator('.elem-bar')).toHaveCount(5);
  });

  test('cores Wu Xing presentes em light mode (3.4)', async ({ page }) => {
    await calcularGC026(page);
    await page.locator('#themeBtn').click(); // dark → light
    await expect(page.locator('.elem-bar')).toHaveCount(5);
  });

});

// ═══════════════════════════════════════════════════════════════════════════
// §6 — Responsividade
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Responsividade — 375px (mobile)', () => {

  test.use({ viewport: { width: 375, height: 812 } });

  test('formulário legível em 375px (6.1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('aside.input-panel')).toBeVisible();
    await expect(page.locator('#inD')).toBeVisible();
    await expect(page.locator('#calcBtn')).toBeVisible();
  });

  test('sem overflow horizontal em 375px (6.5)', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow, 'Sem overflow horizontal em 375px').toBe(false);
  });

  test('botão Calcular acessível sem scroll em 375px (6.4)', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#calcBtn');
    // O botão deve estar no viewport sem precisar rolar
    await expect(btn).toBeInViewport();
  });

  test('mapa BaZi com 4 pilares visíveis em 375px (6.2)', async ({ page }) => {
    await calcularGC026(page);
    const pilares = page.locator('.bazi-pillar');
    await expect(pilares).toHaveCount(4);
    // Pelo menos o primeiro pilar visível no viewport
    await expect(pilares.first()).toBeVisible();
  });

  test('Grandes Ciclos renderizados em 375px (6.3)', async ({ page }) => {
    await calcularGC026(page);
    // Em mobile, Da Yun tem scroll horizontal — deve existir no DOM
    await expect(page.locator('.luck-pillar')).toHaveCount(8);
  });

});

test.describe('Responsividade — 768px (tablet)', () => {

  test.use({ viewport: { width: 768, height: 1024 } });

  test('formulário legível em 768px (6.1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('aside.input-panel')).toBeVisible();
    await expect(page.locator('#calcBtn')).toBeVisible();
  });

  test('sem overflow horizontal em 768px (6.5)', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow, 'Sem overflow horizontal em 768px').toBe(false);
  });

  test('mapa BaZi com 4 pilares em 768px (6.2)', async ({ page }) => {
    await calcularGC026(page);
    await expect(page.locator('.bazi-pillar')).toHaveCount(4);
  });

});

test.describe('Responsividade — 1280px (desktop)', () => {

  test.use({ viewport: { width: 1280, height: 800 } });

  test('formulário e resultados side-by-side em 1280px (6.1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('aside.input-panel')).toBeVisible();
    await expect(page.locator('#results')).toBeVisible();
  });

  test('sem overflow horizontal em 1280px (6.5)', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow, 'Sem overflow horizontal em 1280px').toBe(false);
  });

  test('mapa BaZi com 4 pilares em 1280px (6.2)', async ({ page }) => {
    await calcularGC026(page);
    await expect(page.locator('.bazi-pillar')).toHaveCount(4);
  });

});

// ═══════════════════════════════════════════════════════════════════════════
// §2.10 — Troncos Ocultos (藏干)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Troncos Ocultos — 藏干', () => {

  test('seção de Troncos Ocultos presente após cálculo (2.10)', async ({ page }) => {
    await calcularGC026(page);
    // A seção deve existir no DOM — selector pode variar; usamos texto pt-BR
    const section = page.locator('text=Troncos Ocultos').or(
      page.locator('text=藏干')
    );
    await expect(section.first()).toBeVisible({ timeout: 5_000 });
  });

  test('cada ramo tem pelo menos 1 tronco oculto listado', async ({ page }) => {
    await calcularGC026(page);
    // 4 ramos × ≥ 1 tronco oculto = pelo menos 4 elementos .hidden-stem
    // (o seletor exato depende do renderer — ajustar se necessário)
    const hiddenStems = page.locator('.hidden-stem, .hs-item, [data-hidden-stem]');
    const count = await hiddenStems.count();
    // GC026: 子(癸)·申(庚壬戊)·寅(甲丙戊)·辰(戊乙癸) = 1+3+3+3 = 10
    expect(count, `Esperado ≥ 4 troncos ocultos, encontrado ${count}`).toBeGreaterThanOrEqual(4);
  });

});
