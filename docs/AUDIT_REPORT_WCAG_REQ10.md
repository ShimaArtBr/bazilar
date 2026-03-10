# Auditoria WCAG 2.2 AA — REQ-10
**BaZi PWA · Sprint Q23 · 09/03/2026**
Persona: Ana Luz — QA Acessibilidade

---

## Resultado: PASS com ressalvas manuais

Todas as violações identificadas foram corrigidas nesta sessão.
Itens marcados ⚠️ requerem verificação manual no browser.

---

## Correções Aplicadas

### 1. Labels programáticos nos campos de Data (`index.html`)
**SC:** 1.3.1 Info and Relationships · 2.4.6 Headings and Labels

- `<label>Data</label>` não tinha `for` — os inputs `#inD`, `#inM`, `#inY` não eram associados a nenhum label.
- **Fix:** Label renomeado para "Data de Nascimento" com `id="dateLabel"`. Group `role="group" aria-labelledby="dateLabel"`. Cada input recebeu `<label class="sr-only" for="...">` (Dia / Mês / Ano).

### 2. `aria-label` no `<select id="inTZ">` (`index.html`)
**SC:** 1.3.1 · 4.1.2 Name, Role, Value

- Select tinha `<label for="inTZ">` correto, mas `aria-label` ausente — leitores de tela em alguns contextos não associam o label ao select corretamente sem reforço.
- **Fix:** `aria-label="Selecionar fuso horário GMT"` adicionado ao select.

### 3. `aria-label` nos links do footer (`index.html`)
**SC:** 2.4.6 · 4.1.2

- Links "SOLLUN", "64HEX", "UM23" são crípticos fora de contexto para leitores de tela.
- **Fix:** `aria-label` descritivo em cada link. `<footer>` recebeu `aria-label="Rodapé — outros apps SOLLUN"`.

### 4. Navegação Arrow keys nos radiogroups customizados (`app.js`)
**SC:** 2.1.1 Keyboard

- `role="radio"` dentro de `role="radiogroup"` deve responder a ArrowUp/ArrowDown/ArrowLeft/ArrowRight (WAI-ARIA radiogroup pattern).
- Apenas click handlers existiam — Tab funcionava mas Arrow keys não mudavam seleção.
- **Fix:** handlers `keydown` adicionados em `ziEarly`, `ziLate`, `hemiN`, `hemiS` com navegação circular.

### 5. Escopo documentado no runner axe (`tests/a11y.axe.js`)
- Adicionada nota explícita: jsdom cobre HTML estático; estados dinâmicos cobertos pelo Playwright (`accessibility.test.js`).

---

## Itens Já Conformes (pré-Q23)

| Elemento | SC | Status |
|---|---|---|
| `<a class="skip-link">` com href="#results" | 2.4.1 Bypass Blocks | ✅ |
| `lang="pt"` no `<html>` | 3.1.1 Language of Page | ✅ |
| `lang="zh-Hans"` nos spans CJK (renderer) | 3.1.2 Language of Parts | ✅ (coberto E17) |
| `aria-live="polite"` nos resultados | 4.1.3 Status Messages | ✅ |
| `role="group" aria-labelledby` no grupo gênero | 1.3.1 | ✅ |
| `aria-pressed` nos botões de gênero | 4.1.2 | ✅ |
| `aria-expanded` + keydown no ziToggle | 4.1.2 · 2.1.1 | ✅ |
| `aria-hidden` em ícones decorativos | 1.1.1 | ✅ |
| `aria-label` em `#inLo`, `#inLa` | 1.3.1 | ✅ |
| `tabindex="0"` nos pilares e luck-pillars | 2.1.1 | ✅ |
| Contraste text/bg dark mode ≥ 4.5:1 (tokens.css) | 1.4.3 | ✅ documentado |
| `--color-ink-dim` marcado "decorativo apenas" | 1.4.3 | ✅ (não usar em texto funcional) |

---

## Verificações Manuais Recomendadas

| Item | SC | Prioridade |
|---|---|---|
| ⚠️ Foco visível em todos os elementos interativos (outline dourado) — testar no Chrome/Firefox | 2.4.7 Focus Visible | Alta |
| ⚠️ Leitor de tela (NVDA/VoiceOver) — navegar formulário e verificar anúncio dos labels | 1.3.1 | Alta |
| ⚠️ `aria-live="polite"` anuncia resultados após cálculo — testar com leitor de tela ativo | 4.1.3 | Média |
| ⚠️ Contraste dos tokens Wu Xing em fundos escuros — verificar `--fd` (vermelho) sobre `--surface` | 1.4.3 | Média |
| ⚠️ Zoom 200% — layout não quebra, texto não trunca | 1.4.4 Resize Text | Média |
| ⚠️ `prefers-reduced-motion` — verificar se animations.css respeita a media query | 2.3.3 Animation | Baixa |

---

## Cobertura Automatizada

| Runner | Escopo | Comando |
|---|---|---|
| `tests/a11y.axe.js` | HTML estático (jsdom) — estrutura, labels, ARIA | `npm run test:a11y` |
| `tests/e2e/accessibility.test.js` | Browser real (Playwright) — teclado, foco, estados dinâmicos | `npm run test:e2e:a11y` |

---

*AUDIT_REPORT_WCAG_REQ10.md · Q23 · Gerado com assistência de IA · Revisão humana obrigatória*
