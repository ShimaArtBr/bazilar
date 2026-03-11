# AUDIT CHANGES v1.0 — Aplicação Automática
## BaZi PWA · DS v2.3 "Quiet Luxury Tupiniquim"

**Data:** Março 2026  
**Auditora:** Isabela Mont  
**Versão base:** Q23.21 · **Versão pós-auditoria:** Q23.21-audit1

---

## Correções Aplicadas

### CRÍTICAS ✅

| ID | Arquivo | Mudança | Resultado |
|----|---------|---------|-----------|
| P-C01 | tokens.css | `--color-ink-dim: #8E8CA0 → #6E6C80` | 3.18:1 → 4.65:1 ✅ WCAG AA |
| P-C01 | main.css | `--dim light: #9a9488 → #6E6C80` | 2.69:1 → 4.56:1 ✅ WCAG AA |
| P-C02 | main.css | Removida redefinição `--gold: #c9a84c` do bloco bridge | Elimina sobreposição de valor |
| P-C02 | main.css | `.topbar-name/.topbar-brand` light: `var(--gold) → var(--color-gold-text)` | 2.15:1 → 5.04:1 ✅ WCAG AA |
| P-C03 | main.css | `.calc-btn font-size: .60rem → 0.75rem` | 9.6px → 12px ✅ |
| P-C04 | main.css | `.interact-branch-card__pilar: .55rem → 0.70rem` | 8.8px → 11.2px ✅ |
| P-C04 | main.css | `.footer-inner: .52rem → 0.70rem` | 8.3px → 11.2px ✅ |
| P-C05 | main.css | `.luck-card:focus-visible { outline: 2px solid ... }` adicionado | CA08 ✅ ≥ 2px |

### MÉDIAS ✅

| ID | Arquivo | Mudança |
|----|---------|---------|
| P-M01 | main.css | `.calc-btn color: #1a1814 → var(--color-ink)` |
| P-M01 | main.css | `.term-dot.cur color: #1a1814 → var(--color-ink)` |
| P-M01 | main.css | `.err color: #e07a3a → var(--color-warning)` |
| P-M01 | main.css | `.deus-card__expr-block--pos/neg: #2E7D52/#8C3030 → tokens` |
| P-M03 | main.css | 15 classes estáticas migradas de JetBrains → Noto Sans |
| P-M04 | main.css | `.term-section/.luck-section/.interact-section margin: → var(--space-10) = 80px` |
| P-M05 | index.html | `lang="zh"` adicionado em 7 spans/divs CJK |
| P-M06 | tokens.json | Gerado: 136 tokens em 7 categorias (CA12 ✅) |

### LEVES ✅

| ID | Arquivo | Mudança |
|----|---------|---------|
| P-L02 | main.css | `.field-label: .62rem → 0.70rem` |
| P-L04 | main.css | Bloco de redefinição gold removido (causa raiz do P-C02) |
| CA03 | DS_v2.3_SPEC.md | Decisão de escala 1.25 documentada formalmente |
| CA13 | main.css | `.skip-link, .pdf-export-btn` migrados para Noto Sans |
| CA13 | main.css | `.field-label, .gender-btn, .pillar-hd, .ic-title, .elem-title, .elem-name, .elem-count, .term-ttl, .interact-type, .p-elem, .p-god, .star-name, .zi-name-en, .loc-prev, .sug-item, .footer-links a, .sec-label, .dez-deuses-title, .deus-card__pilar` → Noto Sans |

### JetBrains Mono — Usos Legítimos Mantidos (runtime)

- `input[type=number/text], select` — entrada de dados numéricos
- `input::placeholder` — placeholder de entrada
- `.rst-val, .rst-lbl, .rst-det` — resultado calculado pelo engine
- `.ic-val--mono` — valor monetário/dado calculado
- `.luck-age, .luck-years, .luck-tg` — dados runtime Da Yun
- `.log-card` — output de log de cálculo
- `.str-score` — score calculado de força

---

## Arquivos Modificados

1. `src/styles/tokens.css` — 1 valor corrigido
2. `src/styles/main.css` — ~35 mudanças pontuais
3. `src/styles/tokens.json` — criado (136 tokens, CA12)
4. `index.html` — 7 atributos `lang="zh"` adicionados
5. `docs/DS_v2.3_SPEC.md` — decisão CA03 documentada
6. `docs/AUDIT_CHANGES_v1.md` — este arquivo

