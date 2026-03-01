/**
 * drum.js — Drum Roll Date/Time Picker
 * Sem dependências externas. Exporta initDrumPicker(container).
 * Ao girar, dispara evento CustomEvent('drum-change') no container.
 */

const ITEM_H = 44;

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }

const COLS = [
  { id: 'day',   label: 'DIA',  items: range(1, 31),   fmt: pad,    width: 54 },
  { id: 'month', label: 'MÊS',  items: range(1, 12),   fmt: pad,    width: 50, sep: '·' },
  { id: 'year',  label: 'ANO',  items: range(1900, 2025).reverse(), fmt: String, width: 72, sep: '·' },
  { id: 'hour',  label: 'HORA', items: range(0, 23),   fmt: pad,    width: 50, sep: ' ' },
  { id: 'min',   label: 'MIN',  items: range(0, 59),   fmt: pad,    width: 50, sep: ':' },
];

// Valores iniciais
const state = { day: 23, month: 5, year: 1984, hour: 14, min: 30 };

export function getDrumValues() { return { ...state }; }

export function initDrumPicker(container) {
  container.innerHTML = '';

  COLS.forEach(col => {
    // Separador
    if (col.sep) {
      const sep = document.createElement('div');
      sep.className = 'drum-sep';
      sep.textContent = col.sep === ' ' ? '' : col.sep;
      container.appendChild(sep);
    }

    // Coluna
    const colEl = document.createElement('div');
    colEl.className = 'drum-col';
    colEl.style.width = col.width + 'px';

    const label = document.createElement('div');
    label.className = 'drum-label';
    label.textContent = col.label;
    colEl.appendChild(label);

    const scroll = document.createElement('div');
    scroll.className = 'drum-scroll';

    // Spacer topo
    const top = document.createElement('div');
    top.className = 'drum-spacer';
    scroll.appendChild(top);

    col.items.forEach(val => {
      const item = document.createElement('div');
      item.className = 'drum-item';
      item.dataset.val = val;
      item.textContent = col.fmt(val);
      scroll.appendChild(item);
    });

    // Spacer base
    const bot = document.createElement('div');
    bot.className = 'drum-spacer';
    scroll.appendChild(bot);

    colEl.appendChild(scroll);
    container.appendChild(colEl);

    // Scroll para valor inicial
    const initIdx = col.items.indexOf(state[col.id]);
    scroll.scrollTop = Math.max(0, initIdx) * ITEM_H;
    updateStyles(scroll, Math.max(0, initIdx));

    // Listener de scroll
    let raf = null;
    scroll.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(scroll.scrollTop / ITEM_H);
        const safe = Math.max(0, Math.min(idx, col.items.length - 1));
        const val  = col.items[safe];
        if (val !== undefined) {
          state[col.id] = val;
          container.dispatchEvent(new CustomEvent('drum-change', {
            bubbles: true, detail: { id: col.id, value: val }
          }));
        }
        updateStyles(scroll, safe);
      });
    }, { passive: true });
  });
}

function updateStyles(scroll, sel) {
  const items = scroll.querySelectorAll('.drum-item');
  items.forEach((el, i) => {
    const d   = i - sel;
    const abs = Math.abs(d);
    el.classList.toggle('drum-item--selected', abs === 0);
    el.style.opacity   = abs === 0 ? '1' : abs === 1 ? '0.5' : abs === 2 ? '0.25' : '0.08';
    el.style.transform = `perspective(260px) rotateX(${d * 20}deg) scale(${abs === 0 ? 1 : 0.85})`;
    el.style.filter    = abs > 1 ? `blur(${(abs - 1) * 0.5}px)` : '';
  });
}
