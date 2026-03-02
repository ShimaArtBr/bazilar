# BAZILAR — Engine v3.1

Calculadora astronômica de **Quatro Pilares do Destino** (八字 BaZi) com Tempo Solar Real.

## Estrutura

```
bazilar/
├── index.html              ← Home (engine principal)
├── css/
│   └── bazilar.css         ← Estilos (dark/light, responsive)
├── js/
│   ├── data.js             ← Troncos, Ramos, Ocultos, Estrelas, Interações
│   ├── engine.js           ← Motor astronômico (Meeus, JD, RST, EoT)
│   ├── pillars.js          ← Cálculo: 4 Pilares, Grandes Ciclos, Balanço
│   ├── i18n.js             ← Traduções (PT/EN/ES/ZH)
│   ├── geo.js              ← Geocodificação Nominatim
│   ├── render.js           ← Renderização HTML dos resultados
│   └── ui.js               ← Controle de UI, eventos, init
└── README.md
```

## Deploy

Push para GitHub e conecte ao Vercel. Zero config — é um site estático.

## Funcionalidades

- Quatro Pilares com precisão astronômica (Meeus ±0.01°)
- Tempo Solar Real (longitude + Equação do Tempo + DST)
- Troncos Ocultos (藏干) com pesos (主/中/余)
- Dez Deuses (十神)
- Grandes Ciclos de Sorte (大運) — 8 ciclos de 10 anos
- Estrelas Simbólicas: TianYi 天乙, TaoHua 桃花, YiMa 驛馬
- Interações: 6 Harmonias, 3 Harmonias, 6 Choques, 6 Danos, 3 Penalidades
- Balanço dos 5 Elementos
- Early Zǐ / Late Zǐ selecionável
- 4 idiomas (PT/EN/ES/ZH)
- Dark/Light mode
- Geocodificação com Nominatim (bairro, cidade, país)

## Referências

- Jean Meeus, *Astronomical Algorithms* (1991)
- Taylor Wu, *Calculating the BaZi* (2017)
- 三命通會 (San Ming Tong Hui)
