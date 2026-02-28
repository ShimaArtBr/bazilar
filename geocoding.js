/**
 * geocoding.js — Geocodificação via Nominatim (OpenStreetMap)
 * Roda no browser. Sem chave de API — respeita política de uso (1 req/s).
 */

// ─────────────────────────────────────────────
// TABELA DE FUSOS POR COUNTRY_CODE
// Casos complexos (US, CA, AU, RU) usam longitude
// ─────────────────────────────────────────────
const TZ_CC = {
  br: -3, pt: 0,  es: 1,  fr: 1,  de: 1,  it: 1,  nl: 1,  be: 1,  ch: 1,  at: 1,
  pl: 1,  cz: 1,  sk: 1,  hu: 1,  ro: 2,  bg: 2,  gr: 2,  fi: 2,  ee: 2,  lv: 2,
  lt: 2,  dk: 1,  no: 1,  se: 1,  ie: 0,  gb: 0,  is: 0,
  ua: 2,  md: 2,  by: 3,  tr: 3,
  ma: 1,  dz: 1,  tn: 1,  ly: 2,  eg: 2,  ng: 1,  gh: 0,  sn: 0,  ci: 0,
  ke: 3,  za: 2,  tz: 3,
  sa: 3,  ye: 3,  kw: 3,  iq: 3,  jo: 2,  lb: 2,  il: 2,  sy: 2,  cy: 2,
  ir: 3.5, pk: 5, in: 5.5, np: 5.75, lk: 5.5, bd: 6, mm: 6.5,
  th: 7,  vn: 7,  kh: 7,  la: 7,  id: 7,  cn: 8,  hk: 8,  tw: 8,
  ph: 8,  my: 8,  sg: 8,  kr: 9,  jp: 9,  nz: 12,
  co: -5, ve: -4, pe: -5, cl: -4, ar: -3, bo: -4, py: -4, uy: -3, ec: -5,
  mx: -6, gt: -6, cr: -6, pa: -5, cu: -5, do: -4, jm: -5,
  // Melhorias em relação ao original:
  ac: -5,   // Acre (Brasil) — GMT-5
  'br-ac': -5,
};

/**
 * Inferência de fuso a partir de coordenadas + country_code.
 * Trata casos de múltiplos fusos internos (US, CA, AU, RU).
 */
export function tzFromCoords(lat, lon, cc) {
  cc = (cc || '').toLowerCase();

  if (cc === 'us' || cc === 'ca') {
    if (lon < -150) return -10;   // Hawaii / Yukon
    if (lon < -115) return -8;    // Pacific (Arizona = -7 sem DST, mas usamos -8 como base)
    if (lon < -101) return -7;    // Mountain
    if (lon <  -85) return -6;    // Central
    if (lon <  -67) return -5;    // Eastern
    return -4;                    // Atlantic
  }

  if (cc === 'au') {
    if (lon < 129) return 8;      // Western Australia
    if (lon < 138) return 9.5;    // Central (SA, NT)
    return 10;                    // Eastern
  }

  if (cc === 'ru') {
    if (lon <  40) return 3;
    if (lon <  55) return 5;
    if (lon <  73) return 6;
    if (lon <  85) return 7;
    if (lon <  97) return 8;
    if (lon < 115) return 9;
    if (lon < 135) return 10;
    if (lon < 150) return 11;
    return 12;
  }

  if (TZ_CC[cc] !== undefined) return TZ_CC[cc];

  // Fallback geométrico (±15° por fuso)
  return Math.round(lon / 15);
}

/**
 * Define o <select> de fuso para o offset calculado.
 * Tenta match exato; se não achar, escolhe o mais próximo.
 */
export function setTZSelect(offset) {
  const sel = document.getElementById('inTZ');
  if (!sel) return;

  for (let i = 0; i < sel.options.length; i++) {
    if (parseFloat(sel.options[i].value) === offset) {
      sel.value = String(offset);
      return;
    }
  }

  let best = 0, bestD = 999;
  for (let j = 0; j < sel.options.length; j++) {
    const d = Math.abs(parseFloat(sel.options[j].value) - offset);
    if (d < bestD) { bestD = d; best = j; }
  }
  sel.selectedIndex = best;
}

// ─────────────────────────────────────────────
// GEOCODIFICAÇÃO — Nominatim
// ─────────────────────────────────────────────

function escH(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let _geoTimer = null;

/**
 * Debounce: espera 600 ms após o usuário parar de digitar.
 */
export function geoDebounce(q, lang, onSelect) {
  clearTimeout(_geoTimer);
  if (!q || q.length < 2) { hideSug(); showSpin(false); return; }
  showSpin(true);
  _geoTimer = setTimeout(() => geoFetch(q, lang, onSelect), 600);
}

async function geoFetch(q, lang, onSelect) {
  const url = 'https://nominatim.openstreetmap.org/search'
    + `?q=${encodeURIComponent(q)}`
    + `&format=json&limit=6&addressdetails=1&accept-language=${lang}`;

  try {
    const r    = await fetch(url, {
      headers: { 'User-Agent': 'Bazilar/1.0 (educational)', 'Accept-Language': lang },
    });
    const data = await r.json();
    showSpin(false);
    renderSug(data, onSelect);
  } catch {
    showSpin(false);
    renderSug([], onSelect);
  }
}

const NO_RES = { en: 'No results', zh: '无结果', es: 'Sin resultados', pt: 'Sem resultados' };

export function renderSug(results, onSelect) {
  const box = document.getElementById('sugBox');
  if (!box) return;

  if (!results || results.length === 0) {
    const lang = document.documentElement.lang || 'pt';
    box.innerHTML = `<div class="sug-none">${NO_RES[lang] || NO_RES.en}</div>`;
    box.style.display = 'block';
    return;
  }

  box.innerHTML = results.map((r, idx) => {
    const parts = r.display_name.split(', ');
    const short = parts.slice(0, 4).join(', ');
    const lat4  = parseFloat(r.lat).toFixed(4);
    const lon4  = parseFloat(r.lon).toFixed(4);
    return `<button class="sug-item" data-idx="${idx}" type="button" role="option">
      <span class="sug-name">${escH(short)}</span>
      <span class="sug-coords">${lat4}°,  ${lon4}°</span>
    </button>`;
  }).join('')
  + `<div class="sug-attr">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div>`;

  box.style.display = 'block';

  // Eventos de seleção
  results.forEach((r, idx) => {
    const btn = box.querySelector(`[data-idx="${idx}"]`);
    if (!btn) return;
    btn.addEventListener('click', () => selectSug(r, onSelect));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSug(r, onSelect); }
      if (e.key === 'ArrowDown') { e.preventDefault(); btn.nextElementSibling?.classList.contains('sug-item') && btn.nextElementSibling.focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); btn.previousElementSibling?.classList.contains('sug-item') ? btn.previousElementSibling.focus() : document.getElementById('inCity')?.focus(); }
      if (e.key === 'Escape')    { hideSug(); document.getElementById('inCity')?.focus(); }
    });
  });

  // ArrowDown no campo de cidade
  const cityInput = document.getElementById('inCity');
  if (cityInput) {
    cityInput.onkeydown = e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); box.querySelector('.sug-item')?.focus(); }
      if (e.key === 'Escape')    hideSug();
    };
  }
}

function selectSug(r, onSelect) {
  const lat = parseFloat(r.lat);
  const lon = parseFloat(r.lon);
  const addr = r.address || {};
  const cc   = addr.country_code || '';

  const city    = addr.city || addr.town || addr.village || addr.county || addr.state || '';
  const country = addr.country || '';
  const display = (city && country)
    ? `${city}, ${country}`
    : r.display_name.split(', ').slice(0, 2).join(', ');

  // Preenche os campos de coordenadas e cidade
  const inLo   = document.getElementById('inLo');
  const inLa   = document.getElementById('inLa');
  const inCity = document.getElementById('inCity');
  if (inLo)   inLo.value   = lon.toFixed(4);
  if (inLa)   inLa.value   = lat.toFixed(4);
  if (inCity) inCity.value = display;

  // Fuso automático
  setTZSelect(tzFromCoords(lat, lon, cc));

  hideSug();

  // Callback para o app.js atualizar preview e RST
  onSelect?.({ lat, lon, display, cc });
}

export function hideSug() {
  const box = document.getElementById('sugBox');
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

export function showSpin(on) {
  const sp = document.getElementById('geoSpin');
  if (sp) sp.style.opacity = on ? '1' : '0';
}

// Fecha sugestões ao clicar fora
document.addEventListener('click', e => {
  if (!e.target.closest('.geo-wrap')) hideSug();
});
