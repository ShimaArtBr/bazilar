# Checklist de Smoke Test Manual — BaZi PWA
**REQ-12 · Sprint S3·W1 · Persona: Ana Luz**  
Versão: `bazi-pwa-k` | Data: _____________ | Testador: _____________

---

## Como usar
Execute este checklist antes de qualquer deploy para produção.  
Cada item deve ser marcado ✅ PASS ou ❌ FAIL com observação.  
**1 item FAIL = deploy bloqueado.**

---

## 1. Carregamento Inicial

| # | Verificação | Chrome | Firefox | Safari | Edge | iOS Safari |
|---|-------------|--------|---------|--------|------|------------|
| 1.1 | Página carrega sem erros no console | | | | | |
| 1.2 | Título da aba: "BAZILAR — Quatro Pilares do Destino" | | | | | |
| 1.3 | Topbar visível com nome BAZILAR e botão de tema | | | | | |
| 1.4 | Formulário de nascimento visível com todos os campos | | | | | |
| 1.5 | Estado vazio exibe "八字" e mensagem de instrução | | | | | |
| 1.6 | Sem layout shift visível durante carregamento | | | | | |
| 1.7 | Fontes carregadas (Lora, Noto Sans, caracteres CJK visíveis) | | | | | |

---

## 2. Cálculo BaZi — Carta de Referência GC026

**Entrada:** 08/08/2008 · 08:08 · GMT+8 · Masculino  
**Esperado:** Ano 戊子 · Mês 庚申 · Dia 戊寅 · Hora 己辰

| # | Verificação | Chrome | Firefox | Safari | Edge | iOS Safari |
|---|-------------|--------|---------|--------|------|------------|
| 2.1 | Preencher todos os campos sem erro | | | | | |
| 2.2 | Botão "Calcular" funciona ao clique | | | | | |
| 2.3 | Mapa BaZi aparece com 4 pilares | | | | | |
| 2.4 | Pilar Ano: **戊子** | | | | | |
| 2.5 | Pilar Mês: **庚申** | | | | | |
| 2.6 | Pilar Dia: **戊寅** (marcado com ✦) | | | | | |
| 2.7 | Pilar Hora: **己辰** | | | | | |
| 2.8 | 8 Grandes Ciclos (Da Yun) renderizados | | | | | |
| 2.9 | Seção Wu Xing com 5 barras de elemento | | | | | |
| 2.10 | Seção de Troncos Ocultos presente | | | | | |

---

## 3. Tema Dark / Light

| # | Verificação | Chrome | Firefox | Safari | Edge | iOS Safari |
|---|-------------|--------|---------|--------|------|------------|
| 3.1 | Botão ☀️/🌙 alterna o tema | | | | | |
| 3.2 | Dark mode: fundo escuro, texto legível | | | | | |
| 3.3 | Light mode: fundo bone (#F7F4F0), texto legível | | | | | |
| 3.4 | Cores Wu Xing corretas em ambos os temas | | | | | |
| 3.5 | Mapa BaZi legível após troca de tema | | | | | |

---

## 4. Acessibilidade

| # | Verificação | Resultado |
|---|-------------|-----------|
| 4.1 | Skip link "Ir para resultados" aparece ao pressionar Tab | |
| 4.2 | Tab navega por todos os campos em ordem lógica | |
| 4.3 | Botão Calcular acionado por Enter/Space | |
| 4.4 | Opções avançadas abre/fecha com Enter e Space | |
| 4.5 | Pilares do mapa focáveis por Tab (outline dourado visível) | |
| 4.6 | Grandes Ciclos focáveis por Tab | |
| 4.7 | Lupa de tela (NVDA/VoiceOver) lê labels dos pilares | |
| 4.8 | Contraste de texto satisfatório em dark e light | |

---

## 5. PWA / Service Worker

| # | Verificação | Resultado |
|---|-------------|-----------|
| 5.1 | DevTools → Application → Service Workers: SW ativo | |
| 5.2 | Manifest válido (ícone 192, 512, start_url "/") | |
| 5.3 | App instalável (ícone de instalação na barra de endereço) | |
| 5.4 | Após instalação: abre em modo standalone sem barra do browser | |
| 5.5 | Offline (DevTools → Network → Offline): app carrega do cache | |
| 5.6 | Atualização SW: banner de "nova versão disponível" aparece | |

---

## 6. Responsividade

| # | Verificação | 375px | 768px | 1280px |
|---|-------------|-------|-------|--------|
| 6.1 | Formulário legível e usável | | | |
| 6.2 | Mapa BaZi com 4 pilares visíveis | | | |
| 6.3 | Grandes Ciclos com scroll horizontal em mobile | | | |
| 6.4 | Botão Calcular acessível sem scroll | | | |
| 6.5 | Sem overflow horizontal | | | |

---

## 7. Performance (DevTools Lighthouse)

| Métrica | Meta | Resultado | Status |
|---------|------|-----------|--------|
| Performance | ≥ 90 | | |
| Accessibility | ≥ 90 | | |
| Best Practices | ≥ 90 | | |
| SEO | ≥ 90 | | |
| PWA | Pass | | |
| LCP | ≤ 2.5s | | |
| CLS | ≤ 0.05 | | |
| INP | ≤ 100ms | | |

---

## Resultado Final

- [ ] **APROVADO** — todos os itens ✅ PASS → deploy liberado
- [ ] **REPROVADO** — 1 ou mais itens ❌ FAIL → deploy bloqueado

**Observações:**

```
(espaço para notas do testador)
```

**Assinatura:** _____________ **Data:** _____________
