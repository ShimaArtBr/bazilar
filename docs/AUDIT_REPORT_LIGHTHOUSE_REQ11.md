# Auditoria Lighthouse ≥ 90 — REQ-11
**BaZi PWA · Sprint Q23 · 09/03/2026**
Persona: Ana Luz — QA Acessibilidade & Performance

---

## Meta

| Categoria | Meta | Baseline estimado | Pós-fix estimado |
|---|---|---|---|
| Performance | ≥ 90 | ~78 | ~92 |
| Accessibility | ≥ 90 | ~82 | ~97 |
| Best Practices | ≥ 90 | ~85 | ~95 |
| SEO | ≥ 90 | ~88 | ~95 |
| PWA | Passável | parcial | ✅ |

> Baseline estimado por análise estática. Score real só após `npm run build && lighthouse` em produção.

---

## Correções Aplicadas

### 1. `crossorigin` no preconnect fonts.gstatic.com (`index.html`)
**Lighthouse audit:** "Preconnect to required origins"

- `fonts.gstatic.com` entrega os arquivos de fonte (CORS). Preconnect sem `crossorigin` não estabelece a conexão TLS corretamente para requests CORS — o hint é ignorado pelo browser.
- **Fix:** `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` adicionado.

### 2. `crossorigin` nos `<link rel="stylesheet">` do Google Fonts (`index.html`)
**Lighthouse audit:** "Efficiently encode images / font loading"

- Font stylesheets do Google Fonts são cross-origin. O atributo `crossorigin` nos links de stylesheet melhora o matching do preconnect e evita double-fetch em alguns browsers.
- **Fix:** `crossorigin` adicionado em ambos os `<link>` de font stylesheet.

### 3. `<link rel="icon">` adicionado (`index.html`)
**Lighthouse audit:** "Document does not have a favicon" (Best Practices)

- `public/favicon.svg` existe mas não havia `<link rel="icon">` no `<head>`.
- **Fix:** `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` adicionado.

### 4. `<link rel="manifest">` adicionado (`index.html`)
**Lighthouse audit:** PWA — "Web app manifest or service worker do not meet the installability requirements"

- O manifest existe em `public/manifest.json` mas não havia `<link rel="manifest">` no HTML. Sem o link, o browser não descobre o manifest e a PWA não é instalável.
- **Fix:** `<link rel="manifest" href="/manifest.json">` adicionado.

### 5. Manifest enriquecido (`public/manifest.json`)
**Lighthouse audit:** PWA — "Manifest does not have a maskable icon" + "Manifest missing lang/scope"

- Adicionados: `"lang": "pt-BR"`, `"scope": "/"`, ícone com `"purpose": "maskable"` (reusa icon-512.png — produção deve gerar ícone maskable dedicado com safe zone).
- **Fix:** manifest.json atualizado.

---

## Itens Já Conformes (pré-Q23)

| Item | Lighthouse Audit | Status |
|---|---|---|
| `<meta name="description">` | SEO — meta description | ✅ |
| `<meta name="viewport">` | Best Practices | ✅ |
| `lang="pt"` no `<html>` | Accessibility — lang attribute | ✅ |
| `og:*` meta tags | SEO/Social | ✅ |
| `display=swap` nas font URLs | Performance — font-display | ✅ |
| Noto Serif SC subsetado (~18KB) | Performance — font size | ✅ |
| `prefers-reduced-motion` em main.css | Best Practices — animation | ✅ |
| `prefers-reduced-motion` em animations.css | Best Practices — animation | ✅ |
| Service Worker com `injectManifest` | PWA — SW registered | ✅ |
| HTTPS em produção (Vercel) | Best Practices | ✅ |
| `<meta name="theme-color">` | PWA — theme color | ✅ |
| `aria-live="polite"` nos resultados | Accessibility | ✅ |
| 117 `console.log` em src/ | Best Practices — console | ⚠️ ver abaixo |

---

## Pendências para Score Máximo

### ⚠️ console.log em produção (Best Practices −3 a −5 pts)
Existem ~117 chamadas `console.log/warn/debug` em `src/`. Lighthouse penaliza logs em produção.

**Ação recomendada (sprint seguinte):**
```javascript
// vite.config.js — adicionar em build:
build: {
  minify: 'terser',
  terserOptions: {
    compress: { drop_console: true, drop_debugger: true }
  }
}
```
Ou condicionar logs via `FLAGS.debug`:
```javascript
if (FLAGS.debug) console.log(…);
```

### ⚠️ Ícone maskable dedicado (PWA)
O icon-512.png atual provavelmente não tem safe zone para maskable (conteúdo deve estar dentro de 80% do centro). Recomendado gerar `icon-512-maskable.png` com padding adequado e atualizar o manifest.

### ⚠️ Vercel Deployment Protection — manifest.webmanifest 401
Documentado no handoff Q22. Enquanto o Deployment Protection estiver ativo, o Lighthouse PWA auditará offline-first e PWA installability como FAIL.
**Ação:** Vercel Dashboard → Settings → Deployment Protection → criar exceção para `/manifest.json` e `/sw.js`.

### ⚠️ Score real só em produção
Lighthouse de performance (LCP, CLS, TBT, FCP) depende de rede e servidor reais. Rodar `npm run build && npx serve dist` localmente ou auditar URL Vercel com Lighthouse CLI:
```bash
npx lighthouse https://bazilar.vercel.app --output html --output-path lh-report.html
```

---

## Cobertura de Testes Relacionados

| Teste | Arquivo | O que cobre |
|---|---|---|
| `lang="zh-Hans"` nos spans CJK | `e2e/accessibility.test.js` E17 | Lighthouse Accessibility — lang |
| `aria-label` dos pilares | `e2e/accessibility.test.js` | Lighthouse Accessibility |
| axe-core WCAG 2.2 AA | `tests/a11y.axe.js` | Lighthouse Accessibility |

---

*AUDIT_REPORT_LIGHTHOUSE_REQ11.md · Q23 · Gerado com assistência de IA · Revisão humana obrigatória*
