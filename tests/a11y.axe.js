/**
 * @file tests/a11y.axe.js
 * @description Auditoria de acessibilidade automatizada com axe-core (E21 REQ-11).
 *              Carrega o index.html via jsdom e executa axe contra WCAG 2.2 AA.
 *              Build falha se violations > 0.
 *
 * ESCOPO: jsdom executa o HTML estático (sem JS do app). Cobre estrutura semântica,
 *         atributos ARIA, labels e contraste declarativo. Violations dinâmicas
 *         (resultados após cálculo, estados interativos) são cobertas pelos testes
 *         Playwright em tests/e2e/accessibility.test.js.
 *
 * Execução: npm run test:a11y
 *
 * @persona  Ana Luz — QA Acessibilidade
 * @sprint   S3·W1 · REQ-11
 */

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'outside-only',
  resources: 'usable',
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

// Injeta axe-core no contexto do jsdom
const axeSource = readFileSync(
  new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
  'utf8'
);
const scriptEl = document.createElement('script');
scriptEl.textContent = axeSource;
document.head.appendChild(scriptEl);

// Aguarda DOM estar pronto e executa axe
window.addEventListener('load', async () => {
  try {
    const results = await window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
    });

    const { violations, incomplete, passes } = results;

    console.log(`\n✅ Axe-core — WCAG 2.2 AA`);
    console.log(`   Passes:     ${passes.length}`);
    console.log(`   Incomplete: ${incomplete.length} (verificação manual necessária)`);
    console.log(`   Violations: ${violations.length}`);

    if (violations.length > 0) {
      console.log('\n❌ VIOLATIONS:\n');
      for (const v of violations) {
        console.log(`  [${v.impact.toUpperCase()}] ${v.id} — ${v.description}`);
        console.log(`  Help: ${v.helpUrl}`);
        for (const node of v.nodes) {
          console.log(`    → ${node.html.slice(0, 120)}`);
        }
        console.log('');
      }
      process.exit(1);
    }

    if (incomplete.length > 0) {
      console.log('\n⚠️  INCOMPLETE (verificação manual):');
      for (const i of incomplete) {
        console.log(`  [${i.impact ?? 'unknown'}] ${i.id} — ${i.description}`);
      }
    }

    console.log('\n✅ Zero violations — WCAG 2.2 AA PASS\n');
    process.exit(0);

  } catch (err) {
    console.error('Axe runtime error:', err);
    process.exit(1);
  }
});
