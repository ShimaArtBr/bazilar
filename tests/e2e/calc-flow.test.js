/**
 * @file tests/e2e/calc-flow.test.js
 * @description Testes E2E do fluxo completo de cálculo BaZi.
 *              Preenche o formulário, clica em Calcular e verifica os
 *              Quatro Pilares contra resultado esperado do golden dataset.
 *
 * Carta de referência: GC026 — 2008-08-08 08:08 Beijing (Abertura Olimpíadas)
 *   Resultado esperado: 戊子 · 庚申 · 戊寅 · 己辰
 *
 * Critérios cobertos: E04 (paridade 50/50 via UI), E06 (BAZILAR funcional)
 *
 * @persona  Ana Luz — QA Acessibilidade & E2E
 * @sprint   S3·W1 · REQ-12
 */

import { test, expect } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Preenche o formulário de nascimento com os dados fornecidos.
 * @param {import('@playwright/test').Page} page
 * @param {{ day:string, month:string, year:string, time:string, tz:string, gender:'M'|'F' }} dados
 */
async function preencherFormulario(page, { day, month, year, time, tz, gender }) {
  await page.fill('#inD', day);
  await page.fill('#inM', month);
  await page.fill('#inY', year);
  await page.fill('#inT', time);
  await page.selectOption('#inTZ', tz);
  await page.click(`#g${gender}`);
}

/**
 * Aguarda o mapa BaZi aparecer após o cálculo.
 */
async function aguardarMapa(page) {
  await expect(page.locator('.bazi-map')).toBeVisible({ timeout: 8_000 });
}

// ── Testes ─────────────────────────────────────────────────────────────────

test.describe('Fluxo de Cálculo — GC026 Abertura Olimpíadas 2008', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('preenche formulário e clica calcular', async ({ page }) => {
    await preencherFormulario(page, {
      day: '8', month: '8', year: '2008',
      time: '08:08', tz: '8', gender: 'M',
    });
    await page.click('#calcBtn');
    await aguardarMapa(page);
    // Estado vazio deve ter desaparecido
    await expect(page.locator('#emptyState')).not.toBeVisible();
  });

  test('Quatro Pilares corretos: 戊子 · 庚申 · 戊寅 · 己辰', async ({ page }) => {
    await preencherFormulario(page, {
      day: '8', month: '8', year: '2008',
      time: '08:08', tz: '8', gender: 'M',
    });
    await page.click('#calcBtn');
    await aguardarMapa(page);

    // Coleta todos os chars dos pilares (tronco + ramo, 4 pilares × 2 = 8 chars)
    const chars = page.locator('.bazi-pillar__char');
    await expect(chars).toHaveCount(8);

    const textos = await chars.allTextContents();

    // Pilar Ano (índices 0 e 1): 戊子
    expect(textos[0]).toBe('戊');
    expect(textos[1]).toBe('子');

    // Pilar Mês (índices 2 e 3): 庚申
    expect(textos[2]).toBe('庚');
    expect(textos[3]).toBe('申');

    // Pilar Dia (índices 4 e 5): 戊寅
    expect(textos[4]).toBe('戊');
    expect(textos[5]).toBe('寅');

    // Pilar Hora (índices 6 e 7): 己辰
    expect(textos[6]).toBe('己');
    expect(textos[7]).toBe('辰');
  });

  test('Pilar do Dia é o Mestre do Destino (marcado com ✦)', async ({ page }) => {
    await preencherFormulario(page, {
      day: '8', month: '8', year: '2008',
      time: '08:08', tz: '8', gender: 'M',
    });
    await page.click('#calcBtn');
    await aguardarMapa(page);

    // O header do pilar do dia deve conter ✦
    const headers = page.locator('.bazi-pillar__header');
    const textos = await headers.allTextContents();
    const diaHeader = textos[2]; // índice 2 = pilar Dia (Ano, Mês, Dia, Hora)
    expect(diaHeader).toContain('✦');
  });

  test('seção de Grandes Ciclos (Da Yun) renderizada', async ({ page }) => {
    await preencherFormulario(page, {
      day: '8', month: '8', year: '2008',
      time: '08:08', tz: '8', gender: 'M',
    });
    await page.click('#calcBtn');
    await aguardarMapa(page);

    // Grandes Ciclos devem aparecer (8 ciclos)
    const luckPillars = page.locator('.luck-pillar');
    await expect(luckPillars).toHaveCount(8, { timeout: 5_000 });
  });

  test('seção de Elementos (Wu Xing) renderizada', async ({ page }) => {
    await preencherFormulario(page, {
      day: '8', month: '8', year: '2008',
      time: '08:08', tz: '8', gender: 'M',
    });
    await page.click('#calcBtn');
    await aguardarMapa(page);

    await expect(page.locator('.elem-bar')).toHaveCount(5, { timeout: 5_000 });
  });

  test('Tempo Solar Real exibido após cálculo', async ({ page }) => {
    await preencherFormulario(page, {
      day: '8', month: '8', year: '2008',
      time: '08:08', tz: '8', gender: 'M',
    });
    // RST box deve aparecer quando longitude + timezone são preenchidos
    // (preenche longitude manualmente pois cidade não foi buscada)
    await page.fill('#inLo', '116.4');
    await page.click('#calcBtn');
    await aguardarMapa(page);

    const rstBox = page.locator('#rstBox');
    await expect(rstBox).toBeVisible({ timeout: 3_000 });
  });

  test('novo cálculo substitui o mapa anterior', async ({ page }) => {
    // Primeiro cálculo
    await preencherFormulario(page, {
      day: '8', month: '8', year: '2008',
      time: '08:08', tz: '8', gender: 'M',
    });
    await page.click('#calcBtn');
    await aguardarMapa(page);

    // Segundo cálculo com data diferente
    await page.fill('#inY', '1990');
    await page.click('#calcBtn');
    await aguardarMapa(page);

    // Deve haver apenas 1 mapa no DOM
    await expect(page.locator('.bazi-map')).toHaveCount(1);
  });

});

test.describe('Fluxo de Cálculo — Validações de entrada', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('calcular sem data não quebra o app', async ({ page }) => {
    await page.click('#calcBtn');
    // App deve permanecer funcional — sem crash, sem mapa incorreto
    await expect(page.locator('#calcBtn')).toBeVisible();
    await expect(page.locator('#calcBtn')).toBeEnabled();
  });

  test('data inválida não quebra o app', async ({ page }) => {
    await page.fill('#inD', '32');
    await page.fill('#inM', '13');
    await page.fill('#inY', '1800');
    await page.fill('#inT', '99:99');
    await page.click('#calcBtn');
    await expect(page.locator('#calcBtn')).toBeEnabled();
  });

  test('seletor de gênero — toggle correto', async ({ page }) => {
    const gF = page.locator('#gF');
    const gM = page.locator('#gM');

    await gF.click();
    await expect(gF).toHaveAttribute('aria-pressed', 'true');
    await expect(gM).toHaveAttribute('aria-pressed', 'false');

    await gM.click();
    await expect(gM).toHaveAttribute('aria-pressed', 'true');
    await expect(gF).toHaveAttribute('aria-pressed', 'false');
  });

  test('painel de opções avançadas abre e fecha', async ({ page }) => {
    const toggle = page.locator('#ziToggle');
    const opts   = page.locator('#ziOpts');

    // Fechado por padrão
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Abre
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(opts).toHaveAttribute('aria-hidden', 'false');

    // Fecha
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(opts).toHaveAttribute('aria-hidden', 'true');
  });

});
