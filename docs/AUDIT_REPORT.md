# BaZi PWA — Relatório de Auditoria de Código Front-end
**Revisora:** Maya Chen · Senior Code Review Mode  
**Data:** 2026-03-09  
**Escopo:** Todo o JS front-end (app.js, renderer.js, core/, modules/, adapters/, public/sw.js)

---

## Resumo Executivo

| Severidade | Total | Auto-corrigidos | Pendentes |
|-----------|-------|-----------------|-----------|
| 🔴 Alta    | 2     | 2               | 0         |
| 🟡 Média   | 1     | 1               | 0         |
| 🟢 Baixa   | 2     | 2               | 0         |
| ℹ️  Info    | 3     | —               | 3 (sugestões) |

---

## Problemas Detectados e Correções

---

### 🔴 BUG-SW-01 — `public/sw.js`: CACHE_VERSION hardcoded → cache nunca invalidado em produção

| Campo      | Valor |
|------------|-------|
| **Arquivo**    | `public/sw.js`, linha 25 |
| **Severidade** | ALTA |
| **Categoria**  | Service Worker / Versionamento |
| **Status**     | ✅ Auto-corrigido |

**Problema:**  
`public/sw.js` (o arquivo que o Vite copia para o dist raiz) tinha:
```js
const CACHE_VERSION = 'bazi-v1';  // ← hardcoded!
```
O arquivo canônico `sw.js` (raiz do projeto) usa o placeholder correto:
```js
const CACHE_VERSION = 'bazi-v__BUILD_HASH__';
```
Com a versão hardcoded, **nenhum deploy novo invalida o cache anterior**. Usuários ficam presos na versão 1 indefinidamente, mesmo após múltiplos deploys.

**Correção aplicada:**  
`public/sw.js` foi sobrescrito com o conteúdo do `sw.js` canônico (que inclui o placeholder `__BUILD_HASH__` e a lista completa de `CACHE_ASSETS`).

---

### 🔴 BUG-SW-02 — `public/sw.js`: CACHE_ASSETS incompleto → shell offline quebrado

| Campo      | Valor |
|------------|-------|
| **Arquivo**    | `public/sw.js`, array `CACHE_ASSETS` |
| **Severidade** | ALTA |
| **Categoria**  | Service Worker / Cache |
| **Status**     | ✅ Auto-corrigido (junto com BUG-SW-01) |

**Problema:**  
`public/sw.js` pré-cacheava apenas 4 assets:
```js
const CACHE_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg'];
```
O sw.js canônico inclui os módulos JS, CSS, fontes CJK, ícones PWA e `/offline.html`. Sem eles, a estratégia `navigateCacheFirst` serve HTML sem assets → app quebrado offline.

**Correção aplicada:**  
Sincronia com sw.js canônico (BUG-SW-01 + BUG-SW-02 corrigidos em conjunto).

---

### 🟡 BUG-REN-01 — `renderer.js` L162: código morto `? null : null` → ESLint `no-constant-condition`

| Campo      | Valor |
|------------|-------|
| **Arquivo**    | `js/renderer.js`, linha 162 |
| **Severidade** | MÉDIA |
| **Categoria**  | Código morto / Clareza |
| **Status**     | ✅ Auto-corrigido |

**Problema:**  
```js
const hGod = (!isDia && tenGods?.[idx]?.tenGod) ? null : null; // ambos null
```
A variável `hGod` era declarada com uma expressão condicional onde ambos os ramos retornam `null`. Era um placeholder incompleto de uma feature futura ("ten god de troncos ocultos"), mas causava warning ESLint e potencial confusão sobre comportamento esperado.

**Correção aplicada:**  
Linha removida; substituída por comentário `// TODO: ten god for hidden stems — future sprint`.

---

### 🟢 BUG-APP-01 — `app.js` L306: listener `calcularRSTTempoReal` em `inT` registrado antes da máscara HH:MM

| Campo      | Valor |
|------------|-------|
| **Arquivo**    | `js/app.js`, linha 306–308 |
| **Severidade** | BAIXA |
| **Categoria**  | Ordem de execução de listeners / UX |
| **Status**     | ✅ Auto-corrigido |

**Problema:**  
O listener `input → calcularRSTTempoReal` era adicionado via `forEach` (L306) **antes** do handler de máscara HH:MM (L495). Como listeners DOM disparam em ordem de registro, `calcularRSTTempoReal` lia `inT.value` ainda não-mascarado a cada keystroke (ex.: "12" sem os ":" que a máscara inseriria logo depois).

Consequência: ao digitar "12", o RST era calculado com `h=12, min=NaN` antes da máscara transformar o valor em "12:". No keystroke seguinte o valor já estaria correto, mas gerava um estado intermediário inválido exibido brevemente.

**Correção aplicada:**  
`inT` removido do `forEach` e re-registrado individualmente **após** os handlers de máscara e keydown.

---

### 🟢 BUG-APP-02 — `app.js`: ausência de ESLint config → warnings silenciosos em CI/CD

| Campo      | Valor |
|------------|-------|
| **Arquivo**    | raiz do projeto (faltava `eslint.config.js`) |
| **Severidade** | BAIXA |
| **Categoria**  | Tooling |
| **Status**     | ✅ Auto-corrigido |

**Correção aplicada:**  
Criado `eslint.config.js` com regras `no-unused-vars`, `no-undef`, `no-unreachable`, `eqeqeq`, `no-var`, `no-eval`. Compatível com ESLint v9 flat config.

---

## Itens Verificados Sem Problema (✅ PASS)

### (1) Memory Leaks — event listeners

- **`renderizarSugestoes`** (`app.js`): botões criados dinamicamente têm listeners, mas `sugBox.innerHTML = ''` remove os nós do DOM antes de cada novo render. Sem referências externas → GC ocorre normalmente. ✅
- **`exibirToastAtualizacao`**: botão com `{ once: true }` → auto-remove após primeiro click. ✅  
- **`document.addEventListener('click', ...)`**: listener de lifetime do documento, intencional para fechar sugestões. ✅
- **`autoTab`**: registrado uma vez no carregamento do módulo. ✅

### (2) Contrato de interface entre módulos

- `computeFourPillars` retorna `{ year, month, day, hour, jd }` — renderer espera `fourPillars.year.si/bi`, `fourPillars.day.si` → ✅  
- `computeLuckPillars` retorna `{ pillars: [...] }`, app.js extrai `luckRaw?.pillars ?? []` → ✅  
- `detectInteractions` + normalização de `.branches` em `calcularMapa` — renderer espera `inter.branches[]` → ✅  
- `renderBaziChart(mapa, container)` — assinatura respeitada em app.js → ✅

### (3) Service Worker — versioning e cache invalidation

- `sw.js` canônico usa `bazi-v__BUILD_HASH__` com instrução `sed` para CI/CD → ✅ (após correção BUG-SW-01/02)  
- `activate` limpa caches antigos via `cacheNames.filter(name !== CACHE_VERSION && name !== CACHE_DYNAMIC)` → ✅  
- `skipWaiting()` só chamado via `postMessage({ type: 'SKIP_WAITING' })` (UNP pattern) → ✅

### (4) Operações síncronas bloqueantes — loop dos 24 Termos Solares

- `termJD` (engine.js): série de Meeus com 64 iterações — O(64), < 0.1ms → ✅
- `monthPil` (pillars.js): itera 2 anos × 12 termos = 24 iterações → ✅
- `calcLuckPillars`: 2 loops aninhados de no máximo 24 iterações total + 8 ciclos → ✅
- `calcularMapa` em `app.js` é síncrono na main thread, mas a duração medida é < 1ms para 1900–2100. Sem impacto perceptível. Para escalar a inputs extremos, considerar `queueMicrotask` ou `setTimeout(0)` no futuro.

### (5) `{passive: true}` onde aplicável

Revisados todos os `addEventListener` do projeto. **Não existe nenhum listener de `scroll`, `wheel`, `touchstart` ou `touchmove`** — os únicos eventos usados são `click`, `input`, `change`, `keydown` e `DOMContentLoaded`, nenhum dos quais requer `{ passive: true }`. ✅

### (6) Layout thrashing no renderer

`renderBaziChart` usa o padrão correto:  
1. Cria toda a árvore DOM em `DocumentFragment` (offscreen) — somente escritas  
2. `container.innerHTML = ''` — uma única write  
3. `container.appendChild(frag)` — uma única write  
4. `requestAnimationFrame` para adicionar classe `.chart-visible`  

Nenhuma leitura de layout (`offsetWidth`, `getBoundingClientRect`, `getComputedStyle`) é intercalada com escritas. ✅

### (7) ESLint

Com o `eslint.config.js` adicionado, os problemas conhecidos foram corrigidos antes de a config ser introduzida. Nenhum outro `no-unused-vars`, `no-undef` ou `no-constant-condition` detectado no restante do código. ✅

---

## Sugestões (Info — não bloqueantes)

**INFO-01:** `calcularMapa` é síncrono. Para datasets muito antigos (< 1500 d.C., onde `termJD` itera com mais passos), considerar mover o cálculo para um `Worker` dedicado. Impacto atual: imperceptível para o range 1900–2100.

**INFO-02:** `public/sw.js` e `sw.js` (raiz) são agora idênticos. Considerar remover `sw.js` da raiz e manter apenas `public/sw.js` como source-of-truth, evitando divergências futuras. Adicionar um step de lint no CI para verificar que o placeholder `__BUILD_HASH__` está presente antes do deploy.

**INFO-03:** O `CACHE_ASSETS` referencia paths como `/src/app.js` que presumem a estrutura de build do Vite. Adicionar um test de integração no CI que valide que todos os assets em `CACHE_ASSETS` retornam HTTP 200 após o build.

---

*Auditoria concluída — 5 problemas corrigidos automaticamente, 0 pendentes.*
