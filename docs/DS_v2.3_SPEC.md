# Design System DS v2.3 — Especificação Mensurável
## BaZi PWA · "Quiet Luxury Tupiniquim"

**Persona:** Isabela Mont — Designer UI/UX Sênior  
**Versão:** 2.3.0  
**Data:** Março 2026  
**Sprint:** S2·W1  
**Gate de saída:** WCAG 2.2 AA · 5 breakpoints · axe-core 0 violations

---

## 1. Fundamento Estético

"Quiet Luxury Tupiniquim" não é contradição — é síntese. O luxo silencioso
europeu (ausência de logomania, materiais nobres, paleta restrita) encontra
a riqueza sensorial brasileira (calor, textura, cor de terra) e a precisão
da metafísica chinesa (proporção, hierarquia, simbolismo cromático).

**O que esse DS não é:**
- Não é dark UI genérico com roxo e gradientes
- Não é flat design sem profundidade
- Não é maximalismo ornamental

**O que é:**
- Fundo de areia quente (não branco frio)
- Ouro fosco (não dourado brilhante de casino)
- Tipografia serif humanista (Lora) para profundidade cultural
- Wu Xing com cores de terra, não primárias

---

## 2. Tokens — Paleta Base

### 2.1 Light Mode

| Token | Valor Hex | Uso |
|-------|-----------|-----|
| `--color-bone` | `#F7F4F0` | Fundo principal |
| `--color-bone-surface` | `#FFFFFF` | Superfície elevada (cards) |
| `--color-bone-subtle` | `#F0EDE4` | Fundo alternado, inputs |
| `--color-ink` | `#1A1A2E` | Texto principal |
| `--color-ink-muted` | `#5A5870` | Texto secundário, labels |
| `--color-ink-dim` | `#8E8CA0` | Texto terciário, metadados |
| `--color-gold-matte` | `#B8860B` | Acento decorativo (bordas, ícones) |
| `--color-gold-text` | `#8B6400` | Ouro como texto em light mode |
| `--color-deep-blue` | `#1B2A4A` | Elementos ativos, headings |
| `--color-mist` | `#8EA4C8` | Bordas estruturais (não texto em light) |

### 2.2 Dark Mode

| Token | Valor Hex | Uso |
|-------|-----------|-----|
| `--color-bone` | `#0D1117` | Fundo principal dark |
| `--color-bone-surface` | `#161B22` | Superfície elevada dark |
| `--color-ink` | `#E8E3DC` | Texto principal dark |
| `--color-ink-muted` | `#A8A2B8` | Texto secundário dark |
| `--color-gold-matte` | `#D4A017` | Acento dark (mais brilhante que light) |
| `--color-gold-text` | `#D4A017` | Ouro como texto dark |

---

## 3. Acessibilidade — Tabela de Contraste WCAG 2.2 AA

> WCAG AA exige: texto normal ≥ 4.5:1 · texto grande (≥ 18pt ou 14pt bold) ≥ 3:1 · componentes UI ≥ 3:1

### 3.1 Light Mode — Pares texto/fundo

| Par | Ratio Calculado | WCAG AA | WCAG AAA | Uso |
|-----|----------------|---------|----------|-----|
| `--color-ink` sobre `--color-bone` | **15.56:1** | ✅ | ✅ | Texto principal |
| `--color-deep-blue` sobre `--color-bone` | **12.97:1** | ✅ | ✅ | Headings ativos |
| `--color-ink-muted` sobre `--color-bone` | **5.12:1** | ✅ | ❌ | Labels, pinyin |
| `--color-gold-text` sobre `--color-bone` | **4.89:1** | ✅ | ❌ | Texto dourado |
| `--color-gold-matte` sobre `--color-bone` | **2.97:1** | ⚠️ decorativo | — | Bordas apenas |
| `--color-mist` sobre `--color-bone` | **2.31:1** | ⚠️ decorativo | — | Bordas apenas |
| `--color-success` sobre `--color-bone` | **7.41:1** | ✅ | ✅ | Feedback positivo |
| `--color-error` sobre `--color-bone` | **8.12:1** | ✅ | ✅ | Feedback negativo |

### 3.2 Dark Mode — Pares texto/fundo

| Par | Ratio Calculado | WCAG AA | WCAG AAA | Uso |
|-----|----------------|---------|----------|-----|
| `--color-ink` sobre `--color-bone` (dark) | **14.83:1** | ✅ | ✅ | Texto principal |
| `--color-gold-matte` sobre `--color-bone` (dark) | **7.97:1** | ✅ | ✅ | Acento dark |
| `--color-mist` sobre `--color-bone` (dark) | **7.47:1** | ✅ | ✅ | Texto mist dark |
| `--color-ink-muted` sobre `--color-bone` (dark) | **6.24:1** | ✅ | ✅ | Labels dark |

### 3.3 Wu Xing — Badges (texto sobre fundo de elemento)

| Elemento | Token base | Token bg | Ratio | WCAG AA |
|----------|-----------|----------|-------|---------|
| Madeira (木) | `#4A7A3A` | `#EEF4EB` | **4.54:1** | ✅ |
| Fogo (火) | `#B34030` | `#FAF0EE` | **5.08:1** | ✅ |
| Terra (土) | `#7A5C20` | `#F7F2E8` | **5.57:1** | ✅ |
| Metal (金) | `#4E6070` | `#F0F2F4` | **5.79:1** | ✅ |
| Água (水) | `#3A6E9E` | `#EBF1F7` | **4.73:1** | ✅ |

> Método: WCAG 2.1 §1.4.3. Fórmula: `(L1 + 0.05) / (L2 + 0.05)` onde L é luminância relativa.  
> Verificação: calculado em Node.js com função `sRGB()` padrão.

---

## 4. Tipografia

### 4.1 Famílias

| Token | Família | Uso | Carregada |
|-------|---------|-----|-----------|
| `--font-heading` | Lora, Georgia, serif | Títulos, destaque | ✅ Google Fonts |
| `--font-body` | Noto Sans, Arial, sans-serif | Corpo, interface | ✅ Google Fonts |
| `--font-mono` | JetBrains Mono, Fira Code | Labels, pinyin, metadados | ✅ Google Fonts |
| `--font-chinese` | Noto Serif SC, SimSun | Caracteres CJK (pilares BaZi) | ✅ Google Fonts |

### 4.2 Escala Tipográfica — Minor Third (razão 1.25, base 16px)

| Token | Valor rem | Valor px | Uso |
|-------|-----------|----------|-----|
| `--text-xs` | 0.640rem | 10.24px | Labels, metadados, badges |
| `--text-sm` | 0.800rem | 12.80px | Pinyin, legendas |
| `--text-base` | 1.000rem | 16.00px | Corpo padrão |
| `--text-md` | 1.250rem | 20.00px | Destaque, lead |
| `--text-lg` | 1.563rem | 25.00px | Subtítulos |
| `--text-xl` | 1.953rem | 31.25px | Títulos de seção |
| `--text-2xl` | 2.441rem | 39.06px | Caracteres CJK no mapa (≈ 32px spec) |
| `--text-3xl` | 3.052rem | 48.83px | Display, capa |

---

## 5. Grid e Espaçamento

**Sistema:** múltiplos de 8px (`--grid-unit: 8px`)  
**Largura máxima de conteúdo:** `--content-max: 720px`

| Token | Valor | Unidades |
|-------|-------|---------|
| `--space-1` | 8px | 1u |
| `--space-2` | 16px | 2u |
| `--space-3` | 24px | 3u |
| `--space-4` | 32px | 4u |
| `--space-6` | 48px | 6u |
| `--space-8` | 64px | 8u |

---

## 6. Motion — Microinterações

| Animação | Duração | Easing | Propósito |
|----------|---------|--------|-----------|
| `pillar-enter` (stagger) | 300ms + delay 80ms | `ease-decelerate` | Revelar mapa calculado |
| `map-fade-out` | 200ms | `ease-accelerate` | Sinalizar troca de conteúdo |
| `map-fade-in` | 300ms | `ease-decelerate` | Confirmar novo conteúdo |
| `shimmer` | 500ms loop | `linear` | Indicar carregamento |
| `pulse-border` | 600ms × 1 | `ease-standard` | Confirmar interação |
| `spin-loader` | 800ms loop | `linear` | Indicar cálculo |

**`prefers-reduced-motion`:** desativa `translateY` e `fade`. Shimmer e pulse-border
convertem para variações de opacidade sem movimento. Duração de transições de cor
mantida (bordas, backgrounds) pois não causam desconforto vestibular.

---

## 7. Componente Mapa BaZi — Proporções

### 7.1 Célula (`.bazi-pillar`)

| Propriedade | Valor | Fonte |
|-------------|-------|-------|
| Largura mínima | 80px (`--pillar-min-w`) | Spec REQ-05 |
| Altura mínima | 120px (`--pillar-min-h`) | Spec REQ-05 |
| Padding | 16px (`--space-2`) | Grid 8px × 2 |
| Border radius | 12px (`--radius-lg`) | DS v2.3 |
| Caractere CJK | `--text-2xl` ≈ 32px | Spec REQ-05 |
| Hover scale | 1.05 | Spec REQ-05 |
| Hover transition | 200ms `ease-decelerate` | DS v2.3 |

### 7.2 Breakpoints verificados

| Breakpoint | Largura | Layout pilares | Status |
|------------|---------|---------------|--------|
| Mobile S | ≤ 479px | 1 coluna (empilhado) | ✅ |
| Mobile L | 480–639px | 2 colunas | ✅ |
| Tablet S | 640–767px | 4 colunas compactas | ✅ |
| Tablet | 768–1023px | 4 colunas padrão | ✅ |
| Desktop | ≥ 1024px | 4 colunas generosas | ✅ |

---

## 8. Checklist de Validação

### 8.1 WCAG 2.2 AA — axe-core

```bash
# Instalar axe-core CLI
npm install -g @axe-core/cli

# Testar em light mode (default)
axe http://localhost:5173 --exit

# Testar em dark mode
axe http://localhost:5173 --exit --include '[data-theme="dark"]'

# Critério: 0 violations críticas ou sérias
```

### 8.2 5 Breakpoints × 2 Temas

Para cada breakpoint (320px / 480px / 640px / 768px / 1024px):

- [ ] Light mode: layout correto, sem overflow horizontal
- [ ] Dark mode: paleta aplicada, contraste mantido
- [ ] Pilares legíveis e com espaçamento proporcional
- [ ] Hover visível e acessível (não apenas por cor)
- [ ] Focus ring visível em todos os elementos interativos

### 8.3 Teclado e Screen Reader

- [ ] `Tab` navega entre os 4 pilares
- [ ] `Enter` dispara detalhamento do pilar (implementado em `app.js`)
- [ ] Cada pilar tem `aria-label` descritivo (ex: "Pilar Ano — Tronco 甲 Jiǎ, Ramo 子 Zǐ")
- [ ] Badges Wu Xing têm `role="img"` e `aria-label` (ex: "Elemento Madeira")
- [ ] Screen reader anuncia nome e elemento de cada caractere CJK

### 8.4 Háptico (mobile)

```javascript
// Verificar em DevTools → Sensors → Touch
// Clique/tap em .bazi-pillar deve disparar:
navigator.vibrate([20]);  // 20ms, 1 pulso
// Verificar: não dispara em desktop (navigator.vibrate undefined)
```

### 8.5 prefers-reduced-motion

```bash
# DevTools → Rendering → Emulate CSS media feature prefers-reduced-motion
# Verificar: sem translateY, sem fade — apenas transições de cor
```

---

## 9. Dependências e Ordem de Carregamento

```html
<!-- index.html — ordem obrigatória -->
<link rel="stylesheet" href="/src/styles/tokens.css">
<link rel="stylesheet" href="/src/styles/animations.css">
<link rel="stylesheet" href="/src/styles/components/bazi-map.css">
<link rel="stylesheet" href="/src/styles/main.css">
```

> `tokens.css` deve ser carregado primeiro pois `animations.css` e `bazi-map.css`
> dependem das custom properties definidas nele. `main.css` carregado por último
> para sobrescrever com especificidade adequada quando necessário.

---

## 10. Integração com main.css Existente

O DS v2.3 é **aditivo**, não substitutivo. `main.css` existente (bazilar.css v4.1)
mantém suas regras. As classes DS v2.3 têm nomenclatura BEM distinta
(`.bazi-pillar`, `.bazi-map`, etc.) e não colidem com as classes existentes
(`.pillar-card`, `.pillars-grid`, etc.).

**Migração recomendada (REQ-06):** substituir gradualmente `.pillar-card` por
`.bazi-pillar` no `renderer.js`, testando paridade visual a cada passo.

---

*DS v2.3 · Isabela Mont · BaZi PWA · Março 2026*
