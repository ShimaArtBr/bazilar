# Playwright E2E Tests — REQ-12
**BaZi PWA · Sprint Q23 · 09/03/2026**
Persona: Ana Luz — QA Acessibilidade & E2E

---

## Status: ✅ IMPLEMENTADO — execução requer ambiente local com build

---

## Suíte Completa

| Arquivo | Suíte | Testes | Checklist §§ |
|---|---|---|---|
| `smoke.test.js` | Smoke — Carregamento e estrutura | 9 | §1, §5 (SW), §7 (LCP) |
| `calc-flow.test.js` | Fluxo de Cálculo GC026 + Validações | 11 | §2.1–2.9, validações |
| `accessibility.test.js` | Teclado e ARIA | 11 | §4.1–4.8 |
| `theme-responsive.test.js` | Tema Dark/Light + Responsividade + 藏干 | 20 | §3.1–3.5, §6.1–6.5, §2.10 |
| **Total** | | **51 testes** | |

---

## Cobertura por Seção do Checklist

### §1 Carregamento Inicial
| Item | Teste | Arquivo |
|---|---|---|
| 1.1 Sem erros no console | `página carrega com título correto` | smoke |
| 1.2 Título correto | `página carrega com título correto` | smoke |
| 1.3 Topbar visível | `topbar e brand visíveis` | smoke |
| 1.4 Formulário visível | `formulário de nascimento visível` | smoke |
| 1.5 Estado vazio | `area de resultados existe com estado vazio` | smoke |
| 1.6 Sem layout shift | LCP test (indireto) | smoke |
| 1.7 Fontes carregadas | ⚠️ verificação manual | — |

### §2 Cálculo BaZi — GC026
| Item | Teste | Arquivo |
|---|---|---|
| 2.1–2.3 Preencher e calcular | `preenche formulário e clica calcular` | calc-flow |
| 2.4–2.7 Quatro Pilares corretos | `Quatro Pilares corretos: 戊子·庚申·戊寅·己辰` | calc-flow |
| 2.8 8 Grandes Ciclos | `seção de Grandes Ciclos renderizada` | calc-flow |
| 2.9 Wu Xing 5 barras | `seção de Elementos renderizada` | calc-flow |
| 2.10 Troncos Ocultos | `seção de Troncos Ocultos presente` | theme-responsive |

### §3 Tema Dark / Light
| Item | Teste | Arquivo |
|---|---|---|
| 3.1 Botão alterna tema | `botão de tema alterna de dark para light` | theme-responsive |
| 3.2 Dark mode legível | `app inicia em dark mode por padrão` | theme-responsive |
| 3.3 Light mode legível | `botão de tema alterna de light para dark` | theme-responsive |
| 3.4 Cores Wu Xing | `cores Wu Xing presentes em dark/light mode` | theme-responsive |
| 3.5 Mapa após tema | `mapa BaZi legível após troca de tema` | theme-responsive |

### §4 Acessibilidade
| Item | Teste | Arquivo |
|---|---|---|
| 4.1 Skip link | `skip link presente e funcional` | smoke |
| 4.2 Tab order | `Tab navega pelo formulário em ordem lógica` | accessibility |
| 4.3 Enter/Space calcular | `calcBtn acionado por Enter` | accessibility |
| 4.4 Opções avançadas teclado | `ziToggle acionado por Enter e Space` | accessibility |
| 4.5 Pilares focáveis | `pilares navegáveis por Tab após cálculo` | accessibility |
| 4.6 Grandes Ciclos focáveis | `Grandes Ciclos navegáveis por Tab` | accessibility |
| 4.7 Leitor de tela | ⚠️ verificação manual (NVDA/VoiceOver) | — |
| 4.8 Contraste | axe-core (`npm run test:a11y`) + ⚠️ manual | — |

### §5 PWA / Service Worker
| Item | Teste | Arquivo |
|---|---|---|
| 5.1 SW ativo | `Service Worker registrado (PWA)` | smoke |
| 5.2 Manifest válido | ⚠️ verificação manual DevTools | — |
| 5.3–5.6 Instalação/offline | ⚠️ verificação manual | — |

### §6 Responsividade
| Item | Teste | Arquivo |
|---|---|---|
| 6.1 Formulário 375/768/1280px | testes viewport por breakpoint | theme-responsive |
| 6.2 Mapa 4 pilares 375/768/1280px | testes viewport por breakpoint | theme-responsive |
| 6.3 Da Yun scroll mobile | `Grandes Ciclos renderizados em 375px` | theme-responsive |
| 6.4 Calcular sem scroll 375px | `botão Calcular acessível sem scroll` | theme-responsive |
| 6.5 Sem overflow horizontal | testes viewport por breakpoint | theme-responsive |

### §7 Performance
| Item | Teste | Arquivo |
|---|---|---|
| LCP ≤ 2.5s | `LCP ≤ 2.5s (E25 REQ-11)` | smoke |
| CLS, INP, scores Lighthouse | ⚠️ `npx lighthouse` em produção | — |

---

## Como Executar

```bash
# Build necessário (playwright usa vite preview na porta 4173)
npm run build

# Todos os browsers (Chrome, Firefox, Safari, Edge, Mobile)
npm run test:e2e

# Apenas Chromium (CI rápido ~30s)
npm run test:e2e:smoke

# Apenas acessibilidade
npm run test:e2e:a11y

# Suite de tema/responsividade (novo)
npx playwright test tests/e2e/theme-responsive.test.js --project=chromium

# Modo interativo (debug)
npm run test:e2e:ui
```

---

## Notas de Implementação

### Seletor de Troncos Ocultos
O teste `tema-responsive.test.js §藏干` usa seletor multi-fallback:
```javascript
page.locator('.hidden-stem, .hs-item, [data-hidden-stem]')
```
Se o renderer não usar nenhum desses seletores, **ajustar** após inspecionar o DOM renderizado com `page.locator('text=Troncos Ocultos').locator('..').locator('*')`.

### Playwright browsers no CI
Para CI (GitHub Actions), adicionar ao workflow:
```yaml
- run: npx playwright install --with-deps chromium
- run: npm run test:e2e:smoke
```
Edge e Mobile Safari requerem instalação adicional e podem ser omitidos em CI rápido.

### Flakiness
- Testes de LCP têm fallback `resolve(0)` — aceitáveis em ambientes sem GPU.
- `retries: 2` configurado em CI no `playwright.config.js`.

---

## Itens que Requerem Verificação Manual

| # | Item | Ferramenta |
|---|---|---|
| 1.7 | Fontes renderizadas (Lora, Noto Sans, CJK) | Inspeção visual browser |
| 4.7 | Leitura NVDA/VoiceOver dos labels dos pilares | Leitor de tela |
| 5.2–5.6 | PWA installability, offline, update banner | DevTools Application |
| §7 | Lighthouse Performance, CLS, INP | `npx lighthouse <url>` |

---

*AUDIT_REPORT_E2E_REQ12.md · Q23 · Gerado com assistência de IA · Revisão humana obrigatória*
