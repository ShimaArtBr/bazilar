# Legacy Registry — BaZi PWA

> Arquivo de rastreabilidade histórica dos módulos deprecados.
> **NÃO editar os arquivos em `legacy/`.** Preservados como snapshot de referência.

---

## Arquivos Arquivados

### `legacy/render.js` — v3.1

| Campo | Valor |
|---|---|
| **Nome original** | `render.js` |
| **Versão** | v3.1 |
| **Data de deprecação** | Março 2026 (Auditoria v4) |
| **Substituto em `src/`** | `src/renderer.js` |
| **Motivo da migração** | Refatoração para arquitetura modular ESM com separação de responsabilidades; renderer.js introduz Design System DS v2.x, suporte a dark mode, acessibilidade WCAG AA e renderização de Grandes Ciclos. |
| **Responsável pela migração** | Maya Chen (Arquitetura PWA) |

**Funções exportadas (snapshot) e substitutos verificados:**

| Função legacy (`render.js`) | Substituto em `src/` |
|---|---|
| `pilCard(hdr, si, bi, dm, isDay)` | `renderQuatroPilares()` — `src/renderer.js:135` |
| `renderElemBalance()` | `renderBalance()` — `src/renderer.js:334` |
| `renderLuckPillars()` | `renderGrandesCiclos()` — `src/renderer.js:468` |
| `renderStars()` | `renderEstrelasSimbolicas()` — `src/renderer.js:540` |
| `renderInteractions()` | `renderInteracoes()` — `src/renderer.js:595` |
| `renderDayMasterStrength()` | `renderForca()` — `src/renderer.js:374` |
| `buildLog(p)` | **Não migrado** — função de debug de cálculo; strings i18n preservadas em `src/modules/i18n.js`; UI de log não reimplementada em `src/` |

---

### `legacy/ui.js` — v3.2

| Campo | Valor |
|---|---|
| **Nome original** | `ui.js` |
| **Versão** | v3.2 |
| **Data de deprecação** | Março 2026 (Auditoria v4) |
| **Substituto em `src/`** | `src/app.js` + `src/renderer.js` |
| **Motivo da migração** | Separação entre lógica de controle (app.js) e renderização (renderer.js); eliminação de acoplamento direto entre UI e engine; preparação para auth Supabase (REQ-17) e entitlement (REQ-18). |
| **Responsável pela migração** | Maya Chen (Arquitetura PWA) |

**Responsabilidades migradas:**
- Estado global (`GENDER`, dados do mapa) → `src/app.js`
- Lógica de cálculo e orquestração → `src/app.js`
- Renderização de resultados → `src/renderer.js`
- Export PDF → `src/modules/pdf.js`

---

## Verificação de Imports

Script de verificação conforme protocolo (node --input-type=module com fs.readFileSync):

```bash
node --input-type=module << 'EOF'
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = '.';
const DIRS = ['src', 'tests'];
const FILES_EXTRA = ['index.html'];

function walk(dir) {
  const results = [];
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) results.push(...walk(full));
    else results.push(full);
  }
  return results;
}

const files = [
  ...DIRS.flatMap(d => walk(join(ROOT, d))),
  ...FILES_EXTRA.map(f => join(ROOT, f)),
];

let found = 0;
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  content.split('\n').forEach((line, i) => {
    if (/from\s+['"].*legacy|require\s*\(\s*['"].*legacy|import\s+.*legacy/.test(line)) {
      console.log(`IMPORT ENCONTRADO: ${file}:${i+1} → ${line.trim()}`);
      found++;
    }
  });
}

console.log(found === 0
  ? '✅ Zero imports de legacy/ em src/, tests/ e index.html'
  : `❌ ${found} import(s) encontrado(s) — BUG CRÍTICO`
);
EOF
```

**Output da última execução (09/03/2026):**
```
✅ Zero imports de legacy/ em src/, tests/ e index.html
```

---

## Notas

- Os arquivos em `legacy/` são marcados como `linguist-vendored` via `.gitattributes` (excluídos de diffs e estatísticas de linguagem do GitHub).
- ESLint aplica apenas `no-undef` em `legacy/` — regras modernas (`no-var`, `prefer-const`) não são exigidas nesses arquivos.
- Remoção definitiva dos arquivos: prevista para após S4, mediante aprovação do PM.
