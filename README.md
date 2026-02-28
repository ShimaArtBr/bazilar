# BAZILAR · 命理堂

**Calculadora Astronômica BaZi de Precisão** · Sollun Ecosystem v1.0

> *"Não é um app de horóscopo. É uma ferramenta de precisão astronômica que revela a ordem matemática por baixo do aparente caos da existência."*

---

## ✦ Visão Geral

BAZILAR é uma PWA (Progressive Web App) de cálculo BaZi (八字 — Quatro Pilares) com motor astronômico de precisão. Projetada para ser referência global — inclusive para praticantes chineses que exigem máxima exatidão.

**Não contém interpretações automáticas.** Apenas dados técnicos de altíssima precisão, apresentados com design editorial.

---

## ✦ Precisão Técnica

| Componente | Implementação | Precisão |
|-----------|--------------|---------|
| Longitude Solar | Fórmula de Meeus (1991), Cap. 25 | ±0,01° (~15 segundos) |
| Termos Solares (節氣) | Bissecção sobre sunLon() | ±1 segundo |
| Pilar do Dia | JD − 2451545 + 54 mod 60 | Verificado: 戊午 = 1 Jan 2000 |
| Horário de Verão Histórico | Intl API (IANA TZ Database) | Todos os fusos históricos |
| Correção de Longitude (LMT) | 4 min/grau × longitude | ±1 segundo |
| Equação do Tempo (TST) | Fórmula Spencer/Meeus | ±0,5 minuto |

### Referências Verificadas

- **Taylor Wu, K.** (2017). *Calculating the BaZi*. Singing Dragon. — Fonte primária
- **Hong Kong Observatory** — Verificação cruzada de pilares
- **JPL Horizons (NASA)** — Posições solares para Li Chun
- **IANA Time Zone Database** — DST histórico (Brasil: 8 regras 1931–2019)
- **Wan Nian Li 萬年曆** — Verificação calendário chinês

---

## ✦ Funcionalidades v1.0

### Cálculo
- ✅ Conversão Civil → UTC → LMT → TST (cadeia completa)
- ✅ Li Chun astronômico exato como fronteira do ano BaZi
- ✅ 12 Termos Solares (節) calculados astronomicamente para cada ano
- ✅ Quatro Pilares completos (Ano, Mês, Dia, Hora)
- ✅ Troncos Ocultos 藏干 (tabela verificada contra 3 fontes)
- ✅ Dez Deuses 十神 para todos os troncos
- ✅ Early Zǐ vs Zǐ Completo (exibe ambos quando aplicável)
- ✅ 8 Grandes Ciclos de Sorte 大運 com data de início individual
- ✅ 5 Tipos de interações entre Ramos (六合 三合 六沖 六害 三刑)
- ✅ Equilíbrio ponderado dos Cinco Elementos

### Interface
- ✅ PWA instalável (manifest + service worker)
- ✅ Offline-first (cache de app shell)
- ✅ Trilíngue: 🇧🇷 Português · 🇬🇧 English · 🇨🇳 中文
- ✅ Geocodificação via OpenStreetMap Nominatim (sem API key)
- ✅ Detecção automática de fuso horário via timeapi.io
- ✅ Modo escuro editorial (paleta Sollun)
- ✅ Impressão/PDF otimizado (print CSS)
- ✅ Log técnico de cálculo auditável
- ✅ Acessível (ARIA, focus-visible, WCAG 2.2)

---

## ✦ Estrutura do Projeto

```
bazilar/
├── index.html          # PWA entry point
├── manifest.json       # PWA manifest (ícones, shortcuts)
├── sw.js               # Service Worker (offline, cache)
├── engine.js           # Motor astronômico BaZi
├── i18n.js             # Traduções PT/EN/ZH
├── geo.js              # Geocodificação & fusos horários
├── app.js              # Lógica de UI
├── style.css           # Design system
├── icons/
│   ├── icon.svg        # Ícone mestre (SVG vetorial)
│   ├── icon-72.png     # ... ícones PNG em todos os tamanhos
│   └── icon-512.png
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actions → GitHub Pages
```

---

## ✦ Deploy no GitHub Pages

### 1. Criar repositório no GitHub

```bash
git init
git add .
git commit -m "feat: BAZILAR v1.0 — BaZi astronomical calculator"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/bazilar.git
git push -u origin main
```

### 2. Ativar GitHub Pages

No repositório GitHub:
- Settings → Pages
- Source: **GitHub Actions**
- O workflow `.github/workflows/deploy.yml` fará o deploy automaticamente

### 3. Acessar

```
https://SEU_USUARIO.github.io/bazilar/
```

Para usar domínio personalizado (`bazilar.app`):
- Settings → Pages → Custom domain
- DNS: CNAME `bazilar.app` → `SEU_USUARIO.github.io`

---

## ✦ Desenvolvimento Local

```bash
# Qualquer servidor HTTP estático funciona
npx serve .
# ou
python3 -m http.server 8080
# ou
npx live-server .
```

Acesse: `http://localhost:8080`

> **Nota:** O Service Worker requer HTTPS em produção. Em localhost, funciona normalmente.

---

## ✦ Roadmap (Ecossistema Sollun)

### v1.1
- [ ] ShenSha (星煞) — Estrelas Simbólicas principais
- [ ] TaiYuan 胎元 e MinGong 命宮
- [ ] Anos Anuais 流年 (ano atual sobre o mapa natal)
- [ ] Força do Mestre do Dia

### v1.2
- [ ] Exportação PDF do mapa (html2canvas + jsPDF)
- [ ] Histórico de mapas (localStorage)
- [ ] QR Code do mapa
- [ ] Compartilhamento nativo (Web Share API)

### v2.0
- [ ] Modo terapeuta (múltiplos clientes, banco de dados)
- [ ] Comparação de mapas (compatibilidade)
- [ ] I Ching integrado (segundo produto Sollun)
- [ ] API backend para validação cruzada

---

## ✦ Verificação de Resultados

Para verificar os resultados do BAZILAR, consulte:

1. **Hong Kong Observatory** — https://www.hko.gov.hk/tc/gts/time/calendar/
2. **bazi-calculator.com** — referência de implementação RST e ShenSha
3. **Joey Yap online calculator** — verificação popular
4. **Wan Nian Li** (impresso ou digital) — referência clássica chinesa

---

## ✦ Identidade de Marca

| Elemento | Especificação |
|---------|--------------|
| **Nome produto** | BAZILAR |
| **Nome portal** | SOLLUN |
| **Tagline** | Portal de Oráculos de Precisão |
| **Background** | #0A0A0F |
| **Accent** | #C4A35A (ouro acinzentado) |
| **Madeira** | #5A8A5A · **Fogo** #8A3A2A · **Terra** #8A7040 · **Metal** #707888 · **Água** #2A5070 |
| **Tipografia** | DM Serif Display · Noto Sans · JetBrains Mono |

> *Cores dos elementos deliberadamente dessaturadas — diferente de todos os concorrentes*

---

## ✦ Licença

Código proprietário — Sollun Ecosystem.  
Motor astronômico baseado em algoritmos de domínio público (Meeus 1991).  
Não redistribuir sem autorização.

---

*BAZILAR v1.0 · 命理堂 · Sollun Ecosystem*  
*Compilado em 2025 · Verificado contra Taylor Wu (2017), Hong Kong Observatory, JPL Horizons*
