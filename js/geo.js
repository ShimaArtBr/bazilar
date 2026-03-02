/* ══════════════════════════════════════════════════
   BAZILAR — geo.js — Nominatim geocoding with neighborhood support
══════════════════════════════════════════════════ */
'use strict';

function tzFromCoords(lat, lon, cc) {
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
  var sel = document.getElementById('inTZ');
  for (var i=0; i<sel.options.length; i++) {
    if (parseFloat(sel.options[i].value)===offset) { sel.value=String(offset); return; }
  }
  var best=0, bestD=999;
  for (var j=0; j<sel.options.length; j++) {
    var d=Math.abs(parseFloat(sel.options[j].value)-offset);
    if (d<bestD) { bestD=d; best=j; }
  }
  sel.selectedIndex = best;
}

function escH(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

var _geoTimer = null;
function geoDebounce(q) {
  clearTimeout(_geoTimer);
  if (!q || q.length<2) { hideSug(); showSpin(false); return; }
  showSpin(true);
  _geoTimer = setTimeout(function(){ geoFetch(q); }, 600);
}

function geoFetch(q) {
  var url = 'https://nominatim.openstreetmap.org/search'
    + '?q=' + encodeURIComponent(q)
    + '&format=json&limit=6&addressdetails=1'
    + '&accept-language=' + LANG;
  fetch(url, {headers:{'User-Agent':'BAZILAR/3.1 (educational)','Accept-Language':LANG}})
    .then(function(r){ return r.json(); })
    .then(function(data){ showSpin(false); renderSug(data); })
    .catch(function(){ showSpin(false); renderSug([]); });
}

var NO_RES = {en:'No results',zh:'无结果',es:'Sin resultados',pt:'Sem resultados'};

function renderSug(results) {
  var box = document.getElementById('sugBox');
  if (!box) return;
  if (!results || results.length===0) {
    box.innerHTML = '<div class="sug-none">'+(NO_RES[LANG]||NO_RES.en)+'</div>';
    box.style.display = 'block'; return;
  }
  var html = results.map(function(r,idx) {
    var parts = r.display_name.split(', ');
    var short = parts.slice(0,4).join(', ');
    var lat4 = parseFloat(r.lat).toFixed(4);
    var lon4 = parseFloat(r.lon).toFixed(4);
    return '<button class="sug-item" data-idx="'+idx+'" type="button" role="option">'
      + '<span class="sug-name">' + escH(short) + '</span>'
      + '<span class="sug-coords">' + lat4 + '°, ' + lon4 + '°</span>'
      + '</button>';
  }).join('');
  html += '<div class="sug-attr">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div>';
  box.innerHTML = html;
  box.style.display = 'block';
  results.forEach(function(r,idx) {
    var btn = box.querySelector('[data-idx="'+idx+'"]');
    if (btn) btn.addEventListener('click', function(){ selectSug(r); });
  });
}

function selectSug(r) {
  var lat=parseFloat(r.lat), lon=parseFloat(r.lon);
  var addr=r.address||{}, cc=addr.country_code||'';
  document.getElementById('inLo').value = lon.toFixed(4);
  document.getElementById('inLa').value = lat.toFixed(4);
  var neigh = addr.suburb || addr.neighbourhood || addr.quarter || '';
  var city  = addr.city || addr.town || addr.village || addr.county || addr.state || '';
  var country = addr.country || '';
  var parts = [neigh, city, country].filter(function(p){return !!p;});
  var display = parts.join(', ') || r.display_name.split(', ').slice(0,3).join(', ');
  document.getElementById('inCity').value = display;
  setTZSelect(tzFromCoords(lat, lon, cc));
  hideSug(); updateLocPrev(); updateRST();
}

function hideSug() {
  var box = document.getElementById('sugBox');
  if (box) { box.style.display='none'; box.innerHTML=''; }
}

function showSpin(on) {
  var sp = document.getElementById('geoSpin');
  if (sp) sp.style.opacity = on ? '1' : '0';
}
