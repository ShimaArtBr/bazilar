# TENGOD_CONTRACT — Contrato Formal `tenGod()` ↔ `dez_deuses_bazi_app.json`

**Versão:** 2.0.0  
**Data:** 2026-03-09  
**Sprint:** Q16 (C06) + Q19 (C09)  
**Owner:** JS Engineer S2  
**Status:** ✅ DOCUMENTADO — fonte de verdade para binding

---

## 1. Visão Geral

Contrato de binding entre `tenGod()` de `data.js` e `dez_deuses_bazi_app.json`.
Fonte de verdade para qualquer módulo que relacione cálculo BaZi com conteúdo interpretativo.

---

## 2. Tabela Canônica pt-BR dos 10 Deuses (C09 — 2026-03-09)

| `zh` | `id` JSON | `nome_pt` canônico | `nome_pt_alt` | Tipo |
|------|-----------|-------------------|---------------|------|
| 比肩 | `bi_jian` | **Irmão** | Amigo, Par | Self |
| 劫財 | `jie_cai` | **Rival** | Roubar Riqueza | Self |
| 食神 | `shi_shen` | **Deus da Expressão** | Deus da Comida | Output |
| 傷官 | `shang_guan` | **Oficial Ferido** | Oficial de Ferimentos | Output |
| 正財 | `zheng_cai` | **Riqueza Direta** | Riqueza Estável | Wealth |
| 偏財 | `pian_cai` | **Riqueza Indireta** | Riqueza de Oportunidade | Wealth |
| 正官 | `zheng_guan` | **Oficial Direto** | Autoridade Legítima | Officer |
| 七殺 | `qi_sha` | **Sete Mortes** | General¹, Guerreiro | Officer |
| 正印 | `zheng_yin` | **Recurso Direto** | Selo Direto | Resource |
| 偏印 | `pian_yin` | **Recurso Indireto** | Deus Coruja², 梟神 | Resource |

> ¹ "General" = arquétipo de 七殺 quando domado — não é nome do deus.  
> ² Nome clássico: 梟神 (Xiāo Shén).

---

## 3. Regras de Binding

### Padrão canônico (única forma permitida)

```js
const entry = dezDeuses.find(d => d.caractere === tenGodResult.zh);
```

### Invariantes

1. `tenGod()` retorna `null` para inputs inválidos — checar antes do `find()`
2. `zh` é sempre **caractere tradicional** (繁體字) — nunca simplificado (C06)
3. `d.caractere` no JSON é único — `find()` nunca retorna duplicatas
4. `find()` → `undefined` = dado corrompido → logar como erro crítico
5. **Nunca usar `py` como chave** — pinyin não é único entre escolas

### Campos disponíveis após lookup

```js
entry.caractere                            // zh — chave
entry.nome_pt                              // nome canônico (C09)
entry.nome_pt_alt                          // alternativos aceitos
entry.nome_classico_zh                     // nome clássico (quando existir)
entry.pinyin                               // py com tons
entry.tipo_par                             // Self|Output|Wealth|Officer|Resource
entry.definicao.psicologica                // arquétipo
entry.expressao.positiva / .negativa
entry.desenvolvimento_pessoal.pergunta_central
entry.referencia_classica.obra / .ideia_central
entry.disclaimer                           // obrigatório em todas as telas
```

---

## 4. Mapeamento `TG{}` key → `zh` → `id`

| `TG` key | `zh` | `id` JSON | Fix C06 |
|----------|------|-----------|---------|
| `ss` | 比肩 | `bi_jian` | — |
| `sd` | 劫財 | `jie_cai` | era 劫财 |
| `os` | 食神 | `shi_shen` | — |
| `od` | 傷官 | `shang_guan` | era 伤官 |
| `cd` | 正財 | `zheng_cai` | era 正财 |
| `cs` | 偏財 | `pian_cai` | era 偏财 |
| `kd` | 正官 | `zheng_guan` | — |
| `ks` | 七殺 | `qi_sha` | era 七杀 |
| `id` | 正印 | `zheng_yin` | — |
| `is` | 偏印 | `pian_yin` | — |

---

## 5. Produtores e Consumidores

**Produtores:** `tenGod()` em `data.js` · `computeTenGods()` em `ten-gods.js`

**Consumidores:**
- `renderDezDeuses()` — `renderer.js` L956 — usa `nome_pt`, `definicao`, `expressao`
- `pdf.js` — L130, L142, L266 — usa `god.zh`, `god.py`
- `computeTenGodLabel()` — `renderer.js` — retorna `zh` para display

---

## 6. Histórico

| Data | Sprint | Alteração |
|------|--------|-----------|
| 2026-03-09 | C06/Q16 | Contrato criado. Fix 5 simplificados→tradicionais em `TG{}`. |
| 2026-03-09 | C09/Q19 | Tabela canônica pt-BR. Campos `nome_pt_alt`, `nome_classico_zh`, `tipo_par`. v2.0.0. |

---

*八字 · BaZi · Uso Interno Restrito*
