/* ══════════════════════════════════════════════════
   BAZILAR — geo.js — Geocodificação Nominatim
   PT-only · v3.2
══════════════════════════════════════════════════ */

import { TZ_CC } from './data.js';

/* Callback configurado por ui.js via initGeo() —
   chamado após selecionar uma localização.
   Evita importação circular (geo → ui → geo). */
let _onLocUpdate = function(){};
export function initGeo(cb) { _onLocUpdate = cb; }

export function tzFromCoords(lat, lon, cc) {
  cc = (cc||'').toLowerCase();
  if (cc==='us'||cc==='ca') {
    if(lon<-150)return-10;if(lon<-115)return-8;if(lon<-101)return-7;
    if(lon<-85)return-6;if(lon<-67)return-5;return-4;
  }
  if (cc==='au') { if(lon<129)return 8;if(lon<138)return 9.5;return 10; }
  if (cc==='ru') {
    if(lon<40)return 3;if(lon<55)return 5;if(lon<73)return 6;if(lon<85)return 7;
    if(lon<97)return 8;if(lon<115)return 9;if(lon<135)return 10;if(lon<150)return 11;return 12;
  }
  if (TZ_CC[cc]!==undefined) return TZ_CC[cc];
  return Math.round(lon/15);
}

function setTZSelect(offset) {
  const sel = document.getElementById('inTZ');
  for (let i=0; i<sel.options.length; i++) {
    if (parseFloat(sel.options[i].value)===offset) { sel.value=String(offset); break; }
  }
  if (!sel.value || parseFloat(sel.value) !== offset) {
    let best=0, bestD=999;
    for (let j=0; j<sel.options.length; j++) {
      const d=Math.abs(parseFloat(sel.options[j].value)-offset);
      if (d<bestD) { bestD=d; best=j; }
    }
    sel.selectedIndex = best;
  }
  const hint = document.getElementById('tzHint');
  const hintTxt = document.getElementById('tzHintTxt');
  if (hint && hintTxt) {
    const sign = offset >= 0 ? '+' : '';
    hintTxt.textContent = 'GMT ' + sign + offset + ' · detectado automaticamente';
    hint.classList.add('tz-hint--set');
  }
}

export function escH(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

let _geoTimer = null;
export function geoDebounce(q) {
  clearTimeout(_geoTimer);
  if (!q || q.length<2) { hideSug(); showSpin(false); return; }
  showSpin(true);
  _geoTimer = setTimeout(function(){ geoFetch(q); }, 600);
}

function geoFetch(q) {
  const url = 'https://nominatim.openstreetmap.org/search'
    + '?q=' + encodeURIComponent(q)
    + '&format=json&limit=10&addressdetails=1&dedupe=1'
    + '&accept-language=pt';
  fetch(url, {headers:{'User-Agent':'BAZILAR/3.2 (educational)','Accept-Language':'pt'}})
    .then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data){ showSpin(false); renderSug(dedupe(data)); })
    .catch(function(){ showSpin(false); renderSug([]); });
}

/* Remove resultados quase-duplicados que representam o mesmo lugar físico.
   1. Prioriza class 'place' ou 'boundary'.
   2. Agrupa por proximidade (15 km ~ 0.135°): mantém o de maior importância.
   3. Retorna no máximo 5 resultados. */
function dedupe(results) {
  if (!results || !results.length) return results;
  const GEO_CLASSES = {place:1, boundary:1, natural:1, waterway:1, landuse:1};
  const geo = results.filter(function(r){ return !!GEO_CLASSES[r['class']]; });
  const pool = geo.length >= 1 ? geo : results;
  const THRESHOLD = 0.135;
  const kept = [];
  pool.forEach(function(r) {
    const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    const imp = parseFloat(r.importance) || 0;
    const near = kept.filter(function(k) {
      return Math.abs(parseFloat(k.lat)-lat) < THRESHOLD
          && Math.abs(parseFloat(k.lon)-lon) < THRESHOLD;
    });
    if (near.length === 0) {
      kept.push(r);
    } else {
      near.forEach(function(k) {
        if (imp > (parseFloat(k.importance)||0)) {
          kept.splice(kept.indexOf(k), 1, r);
        }
      });
    }
  });
  return kept.slice(0, 5);
}

function renderSug(results) {
  const box = document.getElementById('sugBox');
  if (!box) return;
  if (!results || results.length===0) {
    box.innerHTML = '<div class="sug-none">Sem resultados</div>';
    box.style.display = 'block'; return;
  }
  let html = results.map(function(r,idx) {
    const parts = r.display_name.split(', ');
    const short = parts.slice(0,4).join(', ');
    const lat4 = parseFloat(r.lat).toFixed(4);
    const lon4 = parseFloat(r.lon).toFixed(4);
    return '<button class="sug-item" data-idx="'+idx+'" type="button" role="option">'
      + '<span class="sug-name">' + escH(short) + '</span>'
      + '<span class="sug-coords">' + lat4 + '°, ' + lon4 + '°</span>'
      + '</button>';
  }).join('');
  html += '<div class="sug-attr">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div>';
  box.innerHTML = html;
  box.style.display = 'block';
  results.forEach(function(r,idx) {
    const btn = box.querySelector('[data-idx="'+idx+'"]');
    if (btn) btn.addEventListener('click', function(){ selectSug(r); });
  });
}

function selectSug(r) {
  const lat=parseFloat(r.lat), lon=parseFloat(r.lon);
  const addr=r.address||{}, cc=addr.country_code||'';
  document.getElementById('inLo').value = lon.toFixed(4);
  document.getElementById('inLa').value = lat.toFixed(4);
  const neigh = addr.suburb || addr.neighbourhood || addr.quarter || '';
  const city  = addr.city || addr.town || addr.village || addr.county || addr.state || '';
  const country = addr.country || '';
  const parts = [neigh, city, country].filter(function(p){return !!p;});
  const display = parts.join(', ') || r.display_name.split(', ').slice(0,3).join(', ');
  document.getElementById('inCity').value = display;
  setTZSelect(tzFromCoords(lat, lon, cc));
  hideSug();
  _onLocUpdate();
}

export function hideSug() {
  const box = document.getElementById('sugBox');
  if (box) { box.style.display='none'; box.innerHTML=''; }
}

export function showSpin(on) {
  const sp = document.getElementById('geoSpin');
  if (sp) sp.style.opacity = on ? '1' : '0';
}
