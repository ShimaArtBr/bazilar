/**
 * geo.js — Geocodificação Nominatim. Sem imports externos.
 * Usa IDs: city, lat, lng, tz, sugBox, geoSpin, locPrev
 */

const TZ = {
  br:-3,pt:0,es:1,fr:1,de:1,it:1,nl:1,be:1,ch:1,at:1,pl:1,cz:1,sk:1,hu:1,
  ro:2,bg:2,gr:2,fi:2,ee:2,lv:2,lt:2,dk:1,no:1,se:1,ie:0,gb:0,is:0,
  ua:2,md:2,by:3,tr:3,
  eg:2,ng:1,gh:0,ke:3,za:2,sa:3,ir:3.5,pk:5,in:5.5,np:5.75,
  th:7,vn:7,cn:8,hk:8,tw:8,ph:8,my:8,sg:8,kr:9,jp:9,nz:12,
  co:-5,ve:-4,pe:-5,cl:-4,ar:-3,bo:-4,py:-4,uy:-3,ec:-5,
  mx:-6,gt:-6,cr:-6,pa:-5,cu:-5,do:-4,jm:-5,
};

function tzGuess(lat, lon, cc) {
  cc = (cc||'').toLowerCase();
  if (cc==='us'||cc==='ca') {
    if (lon<-150) return -10; if (lon<-115) return -8;
    if (lon<-101) return -7;  if (lon< -85) return -6;
    if (lon< -67) return -5;  return -4;
  }
  if (cc==='au') { if (lon<129) return 8; if (lon<138) return 9.5; return 10; }
  if (cc==='ru') {
    if (lon<40) return 3; if (lon<55) return 5; if (lon<73) return 6;
    if (lon<85) return 7; if (lon<97) return 8; if (lon<115) return 9;
    if (lon<135) return 10; if (lon<150) return 11; return 12;
  }
  if (TZ[cc] !== undefined) return TZ[cc];
  return Math.round(lon / 15);
}

function setTZ(offset) {
  const sel = document.getElementById('tz');
  if (!sel) return;
  for (let i = 0; i < sel.options.length; i++) {
    if (parseFloat(sel.options[i].value) === offset) { sel.selectedIndex = i; return; }
  }
  let best = 0, bestD = 999;
  for (let j = 0; j < sel.options.length; j++) {
    const d = Math.abs(parseFloat(sel.options[j].value) - offset);
    if (d < bestD) { bestD = d; best = j; }
  }
  sel.selectedIndex = best;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function spin(on) { const s=document.getElementById('geoSpin'); if(s) s.style.opacity=on?'1':'0'; }
function hideSug() { const b=document.getElementById('sugBox'); if(b){b.style.display='none';b.innerHTML='';} }

let _timer = null;

export function initGeo() {
  const inp = document.getElementById('city');
  if (!inp) return;

  inp.addEventListener('input', () => {
    clearTimeout(_timer);
    const q = inp.value.trim();
    if (q.length < 2) { hideSug(); spin(false); return; }
    spin(true);
    _timer = setTimeout(() => doFetch(q), 600);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.geo-wrap')) hideSug();
  });
}

async function doFetch(q) {
  const lang = document.documentElement.lang || 'pt';
  const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=${lang}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Bazilar/1.0' } });
    const data = await r.json();
    spin(false);
    showSug(data);
  } catch {
    spin(false);
    showSug([]);
  }
}

function showSug(results) {
  const box = document.getElementById('sugBox');
  if (!box) return;

  if (!results.length) {
    box.innerHTML = '<div class="sug-none">Sem resultados</div>';
    box.style.display = 'block';
    return;
  }

  box.innerHTML = results.map((r, i) => {
    const short = r.display_name.split(', ').slice(0, 4).join(', ');
    const lat   = parseFloat(r.lat).toFixed(4);
    const lon   = parseFloat(r.lon).toFixed(4);
    return `<button class="sug-item" data-i="${i}" type="button">
      <span class="sug-name">${esc(short)}</span>
      <span class="sug-coords">${lat}°, ${lon}°</span>
    </button>`;
  }).join('') + '<div class="sug-attr">© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a></div>';

  box.style.display = 'block';

  results.forEach((r, i) => {
    box.querySelector(`[data-i="${i}"]`)?.addEventListener('click', () => pick(r));
  });
}

function pick(r) {
  const lat  = parseFloat(r.lat);
  const lon  = parseFloat(r.lon);
  const addr = r.address || {};
  const cc   = addr.country_code || '';

  const neighbourhood = addr.neighbourhood || addr.suburb || addr.city_district || '';
  const city          = addr.city || addr.town || addr.village || addr.county || '';
  const country       = addr.country || '';

  const display = [neighbourhood, city, country].filter(Boolean).join(', ');

  const cityEl = document.getElementById('city');
  const latEl  = document.getElementById('lat');
  const lngEl  = document.getElementById('lng');
  const prevEl = document.getElementById('locPrev');

  if (cityEl) cityEl.value = display;
  if (latEl)  latEl.value  = lat.toFixed(4);
  if (lngEl)  lngEl.value  = lon.toFixed(4);
  if (prevEl) prevEl.textContent = '✓ ' + display;

  setTZ(tzGuess(lat, lon, cc));
  hideSug();
}
