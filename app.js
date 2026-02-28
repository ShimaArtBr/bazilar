/**
 * BAZILAR — Application Logic
 * Sollun Ecosystem v1.0
 */

const App = (() => {

  let currentLang = 'pt';
  let currentResult = null;
  let citySearchTimeout = null;
  let selectedCity = null;

  // ─── HELPERS ──────────────────────────────────────────────────
  const t = (key) => (I18N[currentLang] || I18N.pt)[key] || key;
  const pad = n => String(n).padStart(2, '0');
  const el  = id => document.getElementById(id);

  function formatDate(d) {
    if (!d) return '—';
    return `${d.day}/${d.month}/${d.year}`;
  }

  function formatTime(d) {
    if (!d) return '—';
    return `${pad(d.hour)}:${pad(d.minute)}:${pad(d.second)}`;
  }

  function elementColor(elIdx) {
    return BaZiEngine.ELEMENT_COLORS[elIdx];
  }
  function elementLightColor(elIdx) {
    return BaZiEngine.ELEMENT_LIGHT[elIdx];
  }

  // ─── CITY SEARCH ──────────────────────────────────────────────
  function setupCitySearch() {
    const input  = el('cityInput');
    const dropdown = el('cityDropdown');

    input.addEventListener('input', () => {
      clearTimeout(citySearchTimeout);
      const q = input.value.trim();
      if (q.length < 3) { dropdown.style.display = 'none'; return; }
      citySearchTimeout = setTimeout(async () => {
        const results = await GeoModule.searchCity(q);
        renderCityDropdown(results);
      }, 400);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => { dropdown.style.display = 'none'; }, 200);
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.city-search')) dropdown.style.display = 'none';
    });
  }

  async function renderCityDropdown(cities) {
    const dropdown = el('cityDropdown');
    if (!cities.length) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = cities.map((c, i) =>
      `<div class="city-option" data-idx="${i}">${c.shortName ? `<strong>${c.shortName}</strong>, ` : ''}${c.country || ''}<span class="city-coords">${c.lat.toFixed(2)}°, ${c.lon.toFixed(2)}°</span></div>`
    ).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.city-option').forEach((opt, i) => {
      opt.addEventListener('click', async () => {
        const city = cities[i];
        selectedCity = city;
        el('cityInput').value = city.shortName ? `${city.shortName}, ${city.country}` : city.name;
        el('lonInput').value  = city.lon.toFixed(4);
        el('latInput').value  = city.lat.toFixed(4);
        dropdown.style.display = 'none';
        // Try to get proper timezone
        el('tzStatus').textContent = '⏳ Detectando fuso horário...';
        const tz = await GeoModule.getTimezoneForCoords(city.lat, city.lon);
        const tzSel = el('tzSelect');
        // Find matching option or set value directly
        let found = false;
        for (const opt of tzSel.options) {
          if (opt.value === tz) { opt.selected = true; found = true; break; }
        }
        if (!found) {
          // Add as custom option
          const newOpt = document.createElement('option');
          newOpt.value = tz;
          newOpt.textContent = tz;
          newOpt.selected = true;
          tzSel.prepend(newOpt);
        }
        el('tzStatus').textContent = `✓ ${tz}`;
      });
    });
  }

  function buildTimezoneSelector() {
    const sel = el('tzSelect');
    GeoModule.TIMEZONES.forEach(tz => {
      const opt = document.createElement('option');
      opt.value = tz.tz;
      opt.textContent = tz.label;
      if (tz.tz === 'America/Sao_Paulo') opt.selected = true;
      sel.appendChild(opt);
    });
  }

  // ─── CALCULATION ──────────────────────────────────────────────
  function doCalculate() {
    // Validate inputs
    const year   = parseInt(el('yearInput').value);
    const month  = parseInt(el('monthInput').value);
    const day    = parseInt(el('dayInput').value);
    const hour   = parseInt(el('hourInput').value);
    const minute = parseInt(el('minInput').value);
    const lon    = parseFloat(el('lonInput').value);
    const lat    = parseFloat(el('latInput').value);
    const tz     = el('tzSelect').value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value || 'M';
    const earlyZi = el('earlyZiCheck').checked;
    const useEoT  = el('eotCheck').checked;

    if (!year || !month || !day || isNaN(hour) || isNaN(minute)) {
      showError(t('errorDate')); return;
    }
    if (isNaN(lon) || !tz) {
      showError(t('errorCity')); return;
    }

    try {
      el('calcBtn').disabled = true;
      el('calcBtn').textContent = '⏳ Calculando...';

      setTimeout(() => {
        try {
          const result = BaZiEngine.calculate({
            year, month, day, hour, minute,
            timezone: tz, longitude: lon, latitude: lat,
            gender, earlyZi, useEoT
          });
          currentResult = result;
          renderResults(result);
          el('resultsSection').style.display = 'block';
          el('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
          showError('Erro no cálculo: ' + err.message);
          console.error(err);
        }
        el('calcBtn').disabled = false;
        el('calcBtn').textContent = t('btnCalculate');
      }, 50);
    } catch (err) {
      showError(err.message);
    }
  }

  function showError(msg) {
    const errEl = el('errorMsg');
    errEl.textContent = msg;
    errEl.style.display = 'block';
    setTimeout(() => errEl.style.display = 'none', 5000);
    el('calcBtn').disabled = false;
    el('calcBtn').textContent = t('btnCalculate');
  }

  // ─── RENDERING ────────────────────────────────────────────────
  function renderResults(result) {
    const { pillars, dayMaster, balance, strength, interactions, cycles, tst, input, baziYear, dualZi } = result;

    el('pillarSection').innerHTML        = renderPillars(pillars, dayMaster, tst, input, baziYear);
    el('balanceSection').innerHTML       = renderBalance(balance, strength, dayMaster);
    el('godsSection').innerHTML          = renderTenGods(pillars, dayMaster);
    el('interactionsSection').innerHTML  = renderInteractions(interactions, pillars);
    el('cyclesSection').innerHTML        = renderCycles(cycles);
    el('logSection').innerHTML           = renderLog(result);

    const warnEl = el('ziWarning');
    if (dualZi) {
      warnEl.textContent = t('warnZiHour');
      warnEl.style.display = 'block';
    } else {
      warnEl.style.display = 'none';
    }

    document.querySelectorAll('.result-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.08}s`;
      card.classList.add('fade-in');
    });
  }

  function renderPillars(pillars, dayMaster, tst, input, baziYear) {
    const lang = currentLang;
    const pillarLabels = [t('pillarHour'), t('pillarDay'), t('pillarMonth'), t('pillarYear')];
    const langAnimals  = (I18N[lang] || I18N.pt).animals || I18N.pt.animals;
    const langPhases   = (I18N[lang] || I18N.pt).lifePhases || I18N.pt.lifePhases;
    const langPhaseCN  = (I18N[lang] || I18N.pt).lifePhaseCN || I18N.pt.lifePhaseCN;

    const pillarCards = pillars.map((p, i) => {
      const stemEl   = BaZiEngine.STEM_ELEMENT[p.stem];
      const branchEl = BaZiEngine.BRANCH_ELEMENT[p.branch];
      const isDay    = p.label === 'day';

      const tenGodDisplay = isDay
        ? `<div class="pillar-dm-badge">日主</div>`
        : `<div class="ten-god-tag" style="background:${elementColor(stemEl)}18;color:${elementLightColor(stemEl)};border:1px solid ${elementColor(stemEl)}40">${BaZiEngine.tenGodName(p.tenGod, lang)}</div>`;

      // Hidden stems row
      const hiddenHTML = p.hiddenStems.map((hs, j) => {
        const hsEl  = BaZiEngine.STEM_ELEMENT[hs];
        const hsGod = p.hiddenStemGods[j];
        return `<span class="hidden-stem" style="color:${elementLightColor(hsEl)}" title="${BaZiEngine.stemPinyin(hs)} · ${BaZiEngine.elementName(hsEl, lang)} · ${BaZiEngine.tenGodName(hsGod, lang)}">${BaZiEngine.stemCN(hs)}</span>`;
      }).join('');

      // Life phase
      const phaseIdx = p.lifePhase;
      const phaseCN  = langPhaseCN[phaseIdx];
      const phasePT  = langPhases[phaseIdx];

      // Animal
      const animal = langAnimals[p.branch];

      return `
        <div class="pillar-card${isDay ? ' pillar-day-master' : ''}">
          <div class="pillar-label">${pillarLabels[i]}</div>
          ${tenGodDisplay}

          <div class="pillar-stem" style="color:${elementLightColor(stemEl)}">
            <span class="char-cn">${BaZiEngine.stemCN(p.stem)}</span>
            <span class="char-pin">${BaZiEngine.stemPinyin(p.stem)}</span>
            <span class="char-el">${BaZiEngine.elementName(stemEl, lang)} ${BaZiEngine.polarityName(BaZiEngine.STEM_YIN[p.stem], lang)}</span>
          </div>

          <div class="pillar-branch" style="color:${elementLightColor(branchEl)}">
            <span class="char-cn">${BaZiEngine.branchCN(p.branch)}</span>
            <span class="char-pin">${BaZiEngine.branchPinyin(p.branch)}</span>
            <span class="char-animal">${animal}</span>
            <span class="char-el">${BaZiEngine.elementName(branchEl, lang)} ${BaZiEngine.polarityName(BaZiEngine.BRANCH_YIN[p.branch], lang)}</span>
          </div>

          <div class="life-phase-row" title="${phasePT}">
            <span class="phase-cn" style="color:${elementLightColor(branchEl)}">${phaseCN}</span>
            <span class="phase-pt">${lang === 'zh' ? '' : phasePT}</span>
          </div>

          <div class="hidden-stems-row">
            <span class="hidden-label">藏干</span>
            ${hiddenHTML}
          </div>
        </div>`;
    }).join('');

    // TST info bar
    const tstInfo = `
      <div class="tst-bar">
        <div class="tst-item"><span class="tst-key">${t('tstLabel')}</span><span class="tst-val mono">${pad(tst.hour)}:${pad(tst.minute)}:${pad(tst.second)} · ${tst.year}/${pad(tst.month)}/${pad(tst.day)}</span></div>
        <div class="tst-item"><span class="tst-key">${t('lonCorrLabel')}</span><span class="tst-val mono">${tst.lonCorrMin}′</span></div>
        <div class="tst-item"><span class="tst-key">${t('eotCorrLabel')}</span><span class="tst-val mono">${tst.eotMin}′</span></div>
        <div class="tst-item"><span class="tst-key">八字年</span><span class="tst-val mono">${baziYear}</span></div>
      </div>`;

    return `<h2 class="section-title">${t('sectionPillars')}</h2>${tstInfo}<div class="pillars-grid">${pillarCards}</div>`;
  }

  function renderBalance(balance, strength, dayMaster) {
    const lang = currentLang;
    const { weighted } = balance;
    const total = weighted.reduce((a, b) => a + b, 0) || 1;
    const names = (I18N[lang] || I18N.pt).elements;
    const dmEl  = BaZiEngine.STEM_ELEMENT[dayMaster.stem];

    const bars = weighted.map((w, i) => {
      const pct = Math.round((w / total) * 100);
      const active = i === dmEl ? ' elem-row-active' : '';
      return `
        <div class="elem-row${active}">
          <div class="elem-name" style="color:${elementLightColor(i)}">${names[i]} ${BaZiEngine.elementCN(i)}</div>
          <div class="elem-bar-wrap">
            <div class="elem-bar" style="width:${pct}%;background:${elementColor(i)};box-shadow:0 0 6px ${elementColor(i)}60"></div>
          </div>
          <div class="elem-pct">${pct}%</div>
        </div>`;
    }).join('');

    // DM Strength bar
    const sup = strength ? strength.supporting : 0;
    const opp = strength ? strength.opposing   : 0;
    const strengthBar = `
      <div class="strength-section">
        <div class="strength-title">${t('sectionStrength') || 'Força do Mestre do Dia'}</div>
        <div class="strength-bar-wrap">
          <div class="strength-seg strength-support" style="width:${sup}%">${sup}%</div>
          <div class="strength-seg strength-oppose"  style="width:${opp}%">${opp}%</div>
        </div>
        <div class="strength-labels">
          <span class="strength-label-l">✦ ${t('strengthSupport') || 'Favorável'}</span>
          <span class="strength-label-r">${t('strengthOppose') || 'Desfavorável'} ✦</span>
        </div>
        <div class="strength-hint">${t('strengthHint') || ''}</div>
      </div>`;

    return `<h2 class="section-title">${t('sectionBalance')}</h2><div class="balance-grid">${bars}</div>${strengthBar}`;
  }

  function renderTenGods(pillars, dayMaster) {
    const lang = currentLang;
    const rows = pillars.filter(p => p.label !== 'day').map(p => {
      const god = p.tenGod;
      const stemEl = BaZiEngine.STEM_ELEMENT[p.stem];
      const labelMap = { hour: t('pillarHour'), month: t('pillarMonth'), year: t('pillarYear') };
      return `<div class="god-row">
        <span class="god-pillar-label">${labelMap[p.label]}</span>
        <span class="god-stem" style="color:${elementLightColor(stemEl)}">${BaZiEngine.stemCN(p.stem)}</span>
        <span class="god-name">${god}</span>
        <span class="god-name-tr">${BaZiEngine.tenGodName(god, lang)}</span>
      </div>`;
    }).join('');

    const dmEl = BaZiEngine.STEM_ELEMENT[dayMaster.stem];
    const dmInfo = `<div class="god-daymaster">日主 <strong style="color:${elementLightColor(dmEl)}">${BaZiEngine.stemCN(dayMaster.stem)}</strong> · ${BaZiEngine.elementName(dmEl, lang)} ${BaZiEngine.polarityName(dayMaster.yin, lang)}</div>`;

    return `<h2 class="section-title">${t('sectionGods')}</h2>${dmInfo}<div class="gods-grid">${rows}</div>`;
  }

  function renderInteractions(ints, pillars) {
    const lang = currentLang;
    const branchNames = pillars.map(p => BaZiEngine.branchCN(p.branch));
    let html = `<h2 class="section-title">${t('sectionInteractions')}</h2><div class="interactions-grid">`;

    const pillarLabels = [t('pillarHour'), t('pillarDay'), t('pillarMonth'), t('pillarYear')];

    function branchTag(b) {
      const el = BaZiEngine.BRANCH_ELEMENT[b];
      return `<span class="branch-tag" style="color:${elementLightColor(el)}">${BaZiEngine.branchCN(b)}</span>`;
    }

    function addSection(items, label, className) {
      if (!items.length) return '';
      return `<div class="int-section ${className}">
        <div class="int-label">${label}</div>
        ${items.map(it => `<div class="int-item">${it.branches.map(b => branchTag(b)).join(' ↔ ')}</div>`).join('')}
      </div>`;
    }

    html += addSection(ints.harmonies6, t('harmony6'), 'int-harmony');
    html += addSection(ints.harmonies3, t('harmony3'), 'int-harmony3');
    html += addSection(ints.clashes,    t('clash'),    'int-clash');
    html += addSection(ints.damages,    t('damage'),   'int-damage');
    html += addSection(ints.penalties,  t('penalty'),  'int-penalty');

    const hasAny = ints.harmonies6.length || ints.harmonies3.length || ints.clashes.length || ints.damages.length || ints.penalties.length;
    if (!hasAny) html += `<div class="int-none">${t('noneFound')}</div>`;

    html += '</div>';
    return html;
  }

  function renderCycles(cycleData) {
    if (!cycleData || !cycleData.cycles) return `<h2 class="section-title">${t('sectionCycles')}</h2><div class="no-cycles">Dados insuficientes</div>`;
    const { cycles, onset } = cycleData;
    const lang = currentLang;

    const onsetInfo = `
      <div class="onset-bar">
        <span class="onset-label">${t('cycleOnset')}:</span>
        <span class="onset-val">${onset.years}a ${onset.months}m ${onset.days}d</span>
        <span class="onset-dir">${onset.direction === 'forward' ? t('dirForward') : t('dirReverse')}</span>
        <span class="onset-year">${onset.startYear}/${pad(onset.startMonth)}/${pad(onset.startDay)}</span>
      </div>`;

    const rows = cycles.map(c => {
      const stemEl   = BaZiEngine.STEM_ELEMENT[c.stem];
      const branchEl = BaZiEngine.BRANCH_ELEMENT[c.branch];
      return `
        <div class="cycle-card">
          <div class="cycle-age">${c.ageStart}–${c.ageEnd}</div>
          <div class="cycle-years">${c.startYear}–${c.endYear}</div>
          <div class="cycle-gz">
            <span style="color:${elementLightColor(stemEl)}">${BaZiEngine.stemCN(c.stem)}</span>
            <span style="color:${elementLightColor(branchEl)}">${BaZiEngine.branchCN(c.branch)}</span>
          </div>
          <div class="cycle-el">
            <span style="color:${elementLightColor(stemEl)}">${BaZiEngine.elementCN(stemEl)}</span>
            <span style="color:${elementLightColor(branchEl)}">${BaZiEngine.elementCN(branchEl)}</span>
          </div>
        </div>`;
    }).join('');

    return `<h2 class="section-title">${t('sectionCycles')}</h2>${onsetInfo}<div class="cycles-grid">${rows}</div>`;
  }

  function renderLog(result) {
    const { tst, input, pillars, baziYear, liChun } = result;
    const p = pillars;
    const stem  = i => BaZiEngine.stemCN(i);
    const br    = i => BaZiEngine.branchCN(i);

    const lines = [
      `// BAZILAR — Log de Cálculo Técnico`,
      `// Data de nascimento: ${input.year}-${pad(input.month)}-${pad(input.day)} ${pad(input.hour)}:${pad(input.minute)}`,
      `// Fuso: ${input.timezone} · Longitude: ${input.longitude}°`,
      ``,
      `// CONVERSÃO DE TEMPO`,
      `// UTC: ${input.utcDate ? input.utcDate.toISOString() : '—'}`,
      `// Correção longitude: ${input.longitude}° × 4 min/° = ${(input.longitude*4).toFixed(1)} min`,
      `// Equação do Tempo: ${tst.eotMin} min`,
      `// TST: ${tst.year}-${pad(tst.month)}-${pad(tst.day)} ${pad(tst.hour)}:${pad(tst.minute)}:${pad(tst.second)}`,
      ``,
      `// PILAR DO ANO 年柱`,
      `// Li Chun 立春 ${liChun.year}: ${liChun.year}-${pad(liChun.month)}-${pad(liChun.day)} ${pad(liChun.hour)}:${pad(liChun.minute)} TST`,
      `// Ano BaZi: ${baziYear}`,
      `// troncoAno = (${baziYear} − 4) mod 10 = ${((baziYear-4)%10+10)%10} → ${stem(p[3].stem)}`,
      `// ramoAno   = (${baziYear} − 4) mod 12 = ${((baziYear-4)%12+12)%12} → ${br(p[3].branch)}`,
      `// Pilar do Ano: ${stem(p[3].stem)}${br(p[3].branch)} (${BaZiEngine.stemPinyin(p[3].stem)}${BaZiEngine.branchPinyin(p[3].branch)})`,
      ``,
      `// PILAR DO MÊS 月柱`,
      `// Jié ativo: lon ${p[2].jieQiLon || '—'}° → Ramo ${br(p[2].branch)}`,
      `// Pilar do Mês: ${stem(p[2].stem)}${br(p[2].branch)} (${BaZiEngine.stemPinyin(p[2].stem)}${BaZiEngine.branchPinyin(p[2].branch)})`,
      ``,
      `// PILAR DO DIA 日柱`,
      `// Ref: 戊午 = JD 2451545 (1 Jan 2000), índice 54 no ciclo 60`,
      `// JD TST ≈ ${result.tst.jd.toFixed(4)}`,
      `// Pilar do Dia: ${stem(p[1].stem)}${br(p[1].branch)} (${BaZiEngine.stemPinyin(p[1].stem)}${BaZiEngine.branchPinyin(p[1].branch)})`,
      ``,
      `// PILAR DA HORA 時柱`,
      `// TST: ${pad(tst.hour)}:${pad(tst.minute)} → Ramo ${br(p[0].branch)} (${BaZiEngine.branchPinyin(p[0].branch)})`,
      `// Pilar da Hora: ${stem(p[0].stem)}${br(p[0].branch)} (${BaZiEngine.stemPinyin(p[0].stem)}${BaZiEngine.branchPinyin(p[0].branch)})`,
      ``,
      `// REFERÊNCIA: Taylor Wu (2017) · Hong Kong Observatory · Meeus (1991) · IANA TZ`,
    ];

    return `<h2 class="section-title">${t('sectionLog')}</h2>
      <pre class="calc-log">${lines.join('\n')}</pre>`;
  }

  // ─── PRINT / PDF ──────────────────────────────────────────────
  function printChart() { window.print(); }

  // ─── THEME ────────────────────────────────────────────────────
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bazilar-theme', theme);
    const icon = el('themeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0A0A0F' : '#F5F0E8';
  }

  function detectTheme() {
    const saved = localStorage.getItem('bazilar-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ─── LANGUAGE AUTO-DETECT ─────────────────────────────────────
  function detectLanguage() {
    const saved = localStorage.getItem('bazilar-lang');
    if (saved && ['pt','en','zh'].includes(saved)) return saved;
    // Browser language
    const langs = navigator.languages || [navigator.language || 'en'];
    for (const l of langs) {
      const code = l.toLowerCase();
      if (code.startsWith('zh')) return 'zh';
      if (code.startsWith('pt')) return 'pt';
      if (code.startsWith('en')) return 'en';
    }
    return 'pt'; // default
  }

  // ─── LANGUAGE DROPDOWN ────────────────────────────────────────
  const LANG_META = {
    pt: { flag: '🇧🇷', code: 'PT' },
    en: { flag: '🇬🇧', code: 'EN' },
    zh: { flag: '🇨🇳', code: 'ZH' },
  };

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('bazilar-lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;

    // Update dropdown button label
    const meta = LANG_META[lang] || LANG_META.pt;
    const flagEl = el('langFlag'), codeEl = el('langCode');
    if (flagEl) flagEl.textContent = meta.flag;
    if (codeEl) codeEl.textContent = meta.code;

    // Update active state in menu
    document.querySelectorAll('.lang-option').forEach(opt => {
      const isActive = opt.getAttribute('data-lang') === lang;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-selected', String(isActive));
    });

    // Translate static elements
    document.querySelectorAll('[data-i18n]').forEach(elem => {
      const key = elem.getAttribute('data-i18n');
      if (elem.tagName === 'INPUT' && elem.type === 'text') {
        elem.placeholder = t(key);
      } else {
        elem.textContent = t(key);
      }
    });

    if (currentResult) renderResults(currentResult);
  }

  function setupLangDropdown() {
    const btn  = el('langDropdownBtn');
    const menu = el('langMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });

    menu.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', () => {
        setLanguage(opt.getAttribute('data-lang'));
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  // ─── INIT ─────────────────────────────────────────────────────
  function init() {
    // 1. Apply theme (auto-detect → user pref → OS pref)
    applyTheme(detectTheme());

    // 2. Theme toggle button
    el('themeToggle')?.addEventListener('click', toggleTheme);

    // Listen to OS theme changes at runtime
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only update if user hasn't manually overridden
      if (!localStorage.getItem('bazilar-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    // 3. Language (auto-detect)
    const detectedLang = detectLanguage();
    setupLangDropdown();
    setLanguage(detectedLang); // applies translations + sets dropdown label

    buildTimezoneSelector();
    setupCitySearch();

    // Calculate button
    el('calcBtn').addEventListener('click', doCalculate);
    el('resetBtn')?.addEventListener('click', () => {
      el('resultsSection').style.display = 'none';
      currentResult = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    el('printBtn')?.addEventListener('click', printChart);

    // Enter key
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.closest('.form-section')) doCalculate();
    });

    // Default values
    el('yearInput').value  = '1984';
    el('monthInput').value = '5';
    el('dayInput').value   = '23';
    el('hourInput').value  = '14';
    el('minInput').value   = '30';
    el('lonInput').value   = '-46.6333';
    el('latInput').value   = '-23.5505';
    el('cityInput').value  = 'São Paulo, Brasil';
    el('tzStatus').textContent = '✓ America/Sao_Paulo';

    // PWA install
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      el('installBtn')?.removeAttribute('hidden');
    });
    el('installBtn')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        el('installBtn').setAttribute('hidden', '');
      }
    });
  }

  return { init };

})();

// Bootstrap
document.addEventListener('DOMContentLoaded', App.init);
