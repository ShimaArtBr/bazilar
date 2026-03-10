# PDF Export — Especificação Visual Completa
## BaZi PWA · DS v2.3 "Quiet Luxury Tupiniquim"

**Persona:** Isabela Mont — Designer UI/UX Sênior  
**Versão:** 1.0.0  
**Data:** Março 2026  
**Gate de saída:** PDF gerado sem erros em 3 browsers (Chrome, Firefox, Safari)

---

## 1. Princípio Editorial

> O PDF é o principal artefato de valor do produto Premium.
> Deve parecer um **relatório de consultoria de alto padrão** — não um print de tela.

Referência estética: laudos de numerologia de consultoria suíça, relatórios Hermès,
anuários do Museu do Ipiranga. Ouro fosco sobre papel de arroz. Silêncio tipográfico.

---

## 2. Parâmetros Físicos

| Parâmetro | Valor |
|-----------|-------|
| Formato | A4 · 210 × 297 mm · Portrait |
| Margens | **2 cm** todas as bordas (spec §layout) |
| Área útil | 170 × 257 mm |
| Resolução alvo | 300 dpi (impressão) · 96 dpi (tela) |
| Modo de cor | CMYK-safe (sem gradientes de tela — apenas tons sólidos) |
| Geração | `window.print()` com `@page` + `print-color-adjust: exact` |

---

## 3. Tipografia PDF

| Papel | Família | Tamanho | Peso | Cor |
|-------|---------|---------|------|-----|
| Títulos de seção | **Lora**, Georgia, serif | **18pt** | 400 (sem bold) | `#1A1A2E` |
| Corpo / parágrafos | Noto Sans, Arial, sans-serif | **10pt** | 400 | `#1A1A2E` |
| Caracteres CJK | Noto Serif SC, SimSun, serif | **14pt** | 400 | `#1A1A2E` |
| Legendas / metadados | Noto Sans, Arial | **8pt** | 400 · italic | `#718096` |
| Labels técnicos | JetBrains Mono, Courier New | **8pt** | 400 | `#5A5870` |
| Pinyin | JetBrains Mono | **8pt** | 400 | `#5A5870` |
| Marca (cabeçalho) | Lora | **11pt** | 400 | `#B8860B` (ouro) |

> **Regra cardinal:** zero `font-weight: bold`. Hierarquia via tamanho e cor.

---

## 4. Paleta PDF

O PDF usa **tons neutros** — sem Wu Xing saturados na página impressa.
As cores de elementos aparecem apenas como bordas sutis (não fundos de área).

| Token | Hex | Uso |
|-------|-----|-----|
| `--pdf-bg` | `#F7F4F0` | Fundo de página (bone DS v2.3) |
| `--pdf-surface` | `#FFFFFF` | Cards, células de pilar |
| `--pdf-ink` | `#1A1A2E` | Texto principal |
| `--pdf-muted` | `#718096` | Legendas, metadados |
| `--pdf-dim` | `#5A5870` | Labels, pinyin |
| `--pdf-gold` | `#B8860B` | Acento (bordas, marca, separadores) |
| `--pdf-rule` | `rgba(184,134,11,0.20)` | Linhas divisórias |
| `--pdf-wood` | `#4A7A3A` | Borda sutil pilar Madeira |
| `--pdf-fire` | `#B34030` | Borda sutil pilar Fogo |
| `--pdf-earth` | `#7A5C20` | Borda sutil pilar Terra |
| `--pdf-metal` | `#4E6070` | Borda sutil pilar Metal |
| `--pdf-water` | `#3A6E9E` | Borda sutil pilar Água |

> Wu Xing: aplica-se **apenas** como `border-left: 3px solid` nas células de pilar.
> Nenhum `background-color` de elemento nas páginas 2–4.

---

## 5. Estrutura — 4 Páginas

### Página 1 — Capa

```
┌─────────────────────────────────────────────────┐  ← 2cm margem
│                                                 │
│                                                 │
│                    八字                         │  ← caractere decorativo
│                                                 │  ← Noto Serif SC · 72pt · gold
│                                                 │
│           ─────────────────────                 │  ← linha hr ouro
│                                                 │
│                MAPA BAZI                        │  ← Lora · 18pt · ink
│                                                 │
│           ─────────────────────                 │
│                                                 │
│              [Nome do consultado]               │  ← Lora · 24pt · ink
│                                                 │
│         Nascimento: DD/MM/AAAA · ♂/♀            │  ← Noto Sans · 10pt · muted
│         [Cidade · lat° lon° · GMT±X]            │  ← Noto Sans · 8pt · dim
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│           ─────────────────────                 │  ← linha hr ouro (inferior)
│                                                 │
│   Gerado em DD/MM/AAAA    BaZi PWA · bazi.app   │  ← 8pt · dim · flex space-between
│                                                 │
└─────────────────────────────────────────────────┘
```

**Elementos da capa:**
- Caractere `八` centralizado verticalmente no terço superior
- Nome em destaque máximo — maior elemento tipográfico da capa
- Data de nascimento e metadados de localização
- Data de geração e URL no rodapé — discretos
- **Sem tabelas, sem grades, sem elementos de interface**

---

### Página 2 — Mapa BaZi (4 Pilares)

```
┌─────────────────────────────────────────────────┐
│ 八  BaZi PWA           [Nome] · Pág 2/4         │  ← cabeçalho corrente
├─────────────────────────────────────────────────┤
│                                                 │
│  OS QUATRO PILARES — 四柱                       │  ← Lora 18pt · ink
│  ─────────────────────────────                  │  ← hr gold
│                                                 │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│  │ HORA  │ │  DIA  │ │  MÊS  │ │  ANO  │       │  ← JetBrains Mono 8pt caps
│  │  时   │ │  日 ★ │ │  月   │ │  年   │       │
│  ├───────┤ ├───────┤ ├───────┤ ├───────┤       │  ← borda-topo: cor elemento
│  │  甲   │ │  丙   │ │  壬   │ │  庚   │       │  ← Noto Serif SC 14pt
│  │ jiǎ  │ │ bǐng  │ │  rén  │ │ gēng  │       │  ← JetBrains Mono 8pt
│  │Madeira│ │ Fogo  │ │ Água  │ │ Metal │       │  ← badge 8pt · borda elemento
│  │ Yang  │ │ Yang  │ │ Yang  │ │ Yang  │       │  ← Noto Sans 8pt · dim
│  │ 七殺  │ │  —    │ │ 正財  │ │ 正官  │       │  ← Ten God · JetBrains 8pt
│  ├───────┤ ├───────┤ ├───────┤ ├───────┤       │  ← divisor dashed
│  │  子   │ │  午   │ │  戌   │ │  辰   │       │  ← Noto Serif SC 14pt
│  │  zǐ   │ │  wǔ   │ │  xū   │ │ chén  │       │  ← JetBrains Mono 8pt
│  │ Água  │ │ Fogo  │ │ Terra │ │ Terra │       │  ← badge 8pt
│  │ Rato  │ │Cavalo │ │  Cão  │ │ Drag. │       │  ← Noto Sans 8pt · dim italic
│  ├───────┤ ├───────┤ ├───────┤ ├───────┤       │  ← divisor dashed gold
│  │Troncos│ │Troncos│ │Troncos│ │Troncos│       │  ← label 7pt · dim
│  │Ocultos│ │Ocultos│ │Ocultos│ │Ocultos│       │
│  │壬 主  │ │丙己丁 │ │辛丁戊 │ │乙癸戊 │       │  ← Noto Serif SC 8pt
│  └───────┘ └───────┘ └───────┘ └───────┘       │
│                                                 │
│  ★ = Mestre do Dia (日主)                       │  ← legenda 8pt · dim italic
│                                                 │
├─────────────────────────────────────────────────┤
│ Gerado por BaZi PWA · bazi.app ·                │  ← rodapé corrente
│ este relatório não é diagnóstico médico         │
└─────────────────────────────────────────────────┘
```

**Regras da Pág. 2:**
- 4 pilares em grid `repeat(4, 1fr)` — cada célula: `page-break-inside: avoid`
- Borda superior colorida por elemento (`border-top: 3px solid --pdf-{element}`)
- Ten God ausente no Mestre do Dia (célula Dia): mostrar `—`
- Troncos ocultos em fonte menor — não omitir mesmo se espaço apertado
- Legenda abaixo dos pilares explicando `★`

---

### Página 3 — Dez Deuses + Força do DM + Grandes Ciclos

```
┌─────────────────────────────────────────────────┐
│ 八  BaZi PWA           [Nome] · Pág 3/4         │
├─────────────────────────────────────────────────┤
│                                                 │
│  DEZ DEUSES — 十神                              │  ← Lora 18pt
│  ─────────────────────────────                  │
│                                                 │
│  ┌──────────────────┬──────────────────┐        │
│  │ Pilar · Posição  │ Ten God (zh · py)│        │  ← grid 2 col
│  ├──────────────────┼──────────────────┤        │
│  │ Hora · Tronco    │ 七殺 qī shā      │        │  ← 10pt body
│  │ Hora · Oculto    │ 正財 zhèng cái   │        │
│  │ Mês · Tronco     │ 正財 zhèng cái   │        │
│  │ Mês · Oculto     │ …               │        │
│  │ Ano · Tronco     │ 正官 zhèng guān  │        │
│  │ Ano · Oculto     │ …               │        │
│  └──────────────────┴──────────────────┘        │
│                                                 │
│  FORÇA DO MESTRE DO DIA — 日主强弱              │  ← Lora 18pt
│  ─────────────────────────────                  │
│                                                 │
│  Mestre do Dia: 丙 Bǐng · Fogo Yang            │  ← 10pt body
│  Força: ████████░░  Forte  (75%)               │  ← barra texto ASCII
│  Favoráveis: Madeira · Fogo                     │  ← badges elemento borda-only
│  Desfavoráveis: Água · Metal                    │
│                                                 │
│  GRANDES CICLOS — 大運                          │  ← Lora 18pt
│  ─────────────────────────────                  │
│  Direção: Crescente · Início: 7 anos            │
│                                                 │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┐     │
│  │7-16│17-2│27-3│37-4│47-5│57-6│67-7│77-8│     │  ← faixa etária
│  │ 辛 │ 壬 │ 癸 │ 甲 │ 乙 │ 丙 │ 丁 │ 戊 │     │  ← Noto Serif SC 14pt
│  │ 亥 │ 子 │ 丑 │ 寅 │ 卯 │ 辰 │ 巳 │ 午 │     │
│  │2025│2035│    │    │    │    │    │    │     │  ← ano início 8pt
│  │ ★  │    │    │    │    │    │    │    │     │  ← atual
│  └────┴────┴────┴────┴────┴────┴────┴────┘     │
│  ★ = Ciclo atual                                │
│                                                 │
├─────────────────────────────────────────────────┤
│ Gerado por BaZi PWA · bazi.app · …              │
└─────────────────────────────────────────────────┘
```

---

### Página 4 — Estrelas Especiais + Interações + Notas

```
┌─────────────────────────────────────────────────┐
│ 八  BaZi PWA           [Nome] · Pág 4/4         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ESTRELAS ESPECIAIS — 神煞                      │  ← Lora 18pt
│  ─────────────────────────────                  │
│                                                 │
│  ┌──────────────────┬──────────────────┐        │
│  │ Estrela (zh · py)│ Pilar            │        │
│  ├──────────────────┼──────────────────┤        │
│  │ 天乙貴人 Tiān Yǐ  │ Hora · Ramo      │        │  ← 10pt body
│  │ 文昌星  Wén Chāng │ Dia · Tronco     │        │
│  │ …               │ …               │        │
│  └──────────────────┴──────────────────┘        │
│                                                 │
│  INTERAÇÕES — 合冲刑破害                        │  ← Lora 18pt
│  ─────────────────────────────                  │
│                                                 │
│  ┌──────────────────┬───────┬──────────┐        │
│  │ Elemento A · B   │ Tipo  │ Resultado│        │
│  ├──────────────────┼───────┼──────────┤        │
│  │ 子 · 午          │ 冲    │ Choque   │        │
│  │ 寅 · 亥          │ 合    │ Combinação│       │
│  └──────────────────┴───────┴──────────┘        │
│                                                 │
│                                                 │
│  NOTAS DO CONSULTOR                             │  ← Lora 18pt
│  ─────────────────────────────                  │
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │                                     │        │  ← área pautada
│  │                                     │        │  ← 8 linhas · line-height 1.6
│  │                                     │        │
│  │                                     │        │
│  │                                     │        │
│  │                                     │        │
│  │                                     │        │
│  │                                     │        │
│  └─────────────────────────────────────┘        │
│                                                 │
├─────────────────────────────────────────────────┤
│ Gerado por BaZi PWA · bazi.app ·                │
│ este relatório não é diagnóstico médico         │
└─────────────────────────────────────────────────┘
```

---

## 6. Cabeçalho e Rodapé Correntes (Pág. 2–4)

**Cabeçalho** (height: 12mm, `border-bottom: 1px solid --pdf-gold`):
```
八  BaZi PWA                        [Nome completo] · Pág N/4
```
- Esquerda: `八` em Noto Serif SC 14pt gold + `BaZi PWA` em Lora 11pt gold
- Direita: nome em Noto Sans 10pt ink + número de página em JetBrains Mono 8pt muted

**Rodapé** (height: 10mm, `border-top: 1px solid --pdf-rule`):
```
Gerado por BaZi PWA · bazi.app · este relatório não é diagnóstico médico
```
- Centralizado · Noto Sans 8pt · `--pdf-muted` · `font-style: italic`

---

## 7. Regras de Impressão `@media print`

| Regra | Seletor / Propriedade | Motivo |
|-------|----------------------|--------|
| Ocultar navegação | `nav, .topbar, #calcForm, .pdf-export-btn` → `display: none` | Remove UI de app |
| Ocultar SW banner | `.sw-update-bar, #_errBanner` → `display: none` | Artefatos de PWA |
| Imprimir apenas conteúdo | `.pdf-printable` → `display: block` | Isolamento de conteúdo |
| Evitar quebra em pilares | `.pdf-pillar-card` → `page-break-inside: avoid` | Pilares não cortados |
| Evitar quebra em tabelas | `.pdf-table` → `page-break-inside: avoid` | Tabelas inteiras |
| Quebra antes de seção | `.pdf-page-break` → `page-break-before: always` | Forçar nova página |
| Fundo exato | `body` → `print-color-adjust: exact; -webkit-print-color-adjust: exact` | Preservar cores |
| Fontes corretas | `@font-face` inline ou Google Fonts com `display=block` | Evitar FOUT |

---

## 8. Lista de Alterações Necessárias em `src/modules/pdf.js`

> **Escopo:** apenas especificação — sem implementação neste REQ.
> As alterações abaixo guiam a refatoração visual do módulo existente.

### 8.1 Estrutura de páginas (breaking change)

| # | Alteração | Impacto |
|---|-----------|---------|
| P01 | Substituir layout único `page-wrap` (1 página) por 4 elementos `<section class="pdf-page">` com `@page` e `page-break-after: always` | Alta — refatoração de `buildPrintHTML()` |
| P02 | Criar página 1 (capa) sem grades — apenas tipografia centrada | Alta — nova função `buildCoverPage()` |
| P03 | Mover Pilares para página 2 exclusiva com grid `repeat(4, 1fr)` em `170mm` de largura | Alta — refatoração de `buildPage2()` |
| P04 | Mover Ten Gods + Força DM + Grandes Ciclos para página 3 | Alta — nova função `buildPage3()` |
| P05 | Mover Estrelas + Interações + Notas do Consultor para página 4 | Alta — nova função `buildPage4()` |

### 8.2 Tipografia (non-breaking)

| # | Alteração | Impacto |
|---|-----------|---------|
| T01 | Substituir `PT Serif` por `Lora` nos títulos de seção (alinhamento DS v2.3) | Baixa — trocar `font-family` em `buildCSS()` |
| T02 | Ajustar tamanho de corpo para `10pt` (atual: `11.8pt`) | Baixa — 1 linha em `buildCSS()` |
| T03 | Ajustar caracteres CJK para `14pt` (atual: variado) | Baixa — verificar `pillarCard()` |
| T04 | Adicionar estilo `8pt italic #718096` para legendas (classe `.pdf-legend`) | Baixa — adicionar ao `buildCSS()` |

### 8.3 Tokens de cor (non-breaking)

| # | Alteração | Impacto |
|---|-----------|---------|
| C01 | Atualizar `--bg` para `#F7F4F0` (DS v2.3 bone) | Baixa — 1 linha |
| C02 | Atualizar `--gold` para `#B8860B` (DS v2.3 gold-matte) | Baixa — 1 linha |
| C03 | Remover fundos Wu Xing dos badges — usar apenas `border-left: 3px solid` | Média — refatorar `elBadge()` em pdf.js |
| C04 | Adicionar `--pdf-muted: #718096` para legendas | Baixa — 1 linha |

### 8.4 Layout (médio impacto)

| # | Alteração | Impacto |
|---|-----------|---------|
| L01 | Atualizar margens de `17.5mm` para `20mm` (2cm) em `@page` | Baixa — 1 linha |
| L02 | Remover coluna de anotações `notes-col` lateral (substituída por área pautada na pág 4) | Média — remover `aside.notes-col` de `buildPrintHTML()` |
| L03 | Adicionar cabeçalho corrente (pág 2–4) com número de página via CSS `counter` | Média — adicionar `@page :left/:right` ou classe `.pdf-header` |
| L04 | Adicionar rodapé corrente com texto legal em todas as páginas | Média — adicionar `.pdf-footer` a cada `pdf-page` |
| L05 | Adicionar área pautada "Notas do Consultor" na página 4 (8 linhas visíveis) | Baixa — HTML + CSS `border-bottom` repetido |

### 8.5 Impressão `@media print` (crítico para gate de saída)

| # | Alteração | Impacto |
|---|-----------|---------|
| M01 | Adicionar `print.css` (entregue neste REQ) ao `<head>` do HTML gerado pelo `buildCSS()` via `<style>` inline | Alta — import em `buildCSS()` |
| M02 | Verificar que `window.print()` é chamado após `document.fonts.ready` (evitar FOUT em Safari) | Alta — verificar `exportBaziPDF()` |
| M03 | Adicionar `<meta name="format-detection" content="telephone=no">` para prevenir links automáticos em iOS | Baixa |

---

## 9. Checklist de Gate de Saída

```
Critério: PDF gerado sem erros em 3 browsers
```

| Browser | Teste | Resultado |
|---------|-------|-----------|
| Chrome 120+ | Imprimir → Salvar como PDF · A4 · Portrait · Margens nenhuma · ✓ Gráficos background | ☐ PASS |
| Firefox 121+ | Imprimir → PDF | ☐ PASS |
| Safari 17+ (macOS) | Imprimir → PDF (verificar FOUT de fontes) | ☐ PASS |

**Critérios por browser:**
- 4 páginas geradas (não 1, não 3)
- Capa sem tabelas de pilares
- Pilares não cortados entre páginas
- Caracteres CJK visíveis (Noto Serif SC carregado)
- Cabeçalho e rodapé em cada página 2–4
- Sem UI de app visível (nav, botões, formulário)

---

*PDF_SPEC.md v1.0 · Isabela Mont · BaZi PWA · Março 2026*
