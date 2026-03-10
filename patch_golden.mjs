// patch_golden.mjs — rodar: node patch_golden.mjs
// Sobrescreve os blocos expected em tests/golden.dataset.js
import { readFileSync, writeFileSync } from 'fs';

const file = './tests/golden.dataset.js';
let c = readFileSync(file, 'utf8');

function patch(id, ySi,yBi, mSi,mBi, dSi,dBi, hSi,hBi) {
  const idPat = new RegExp(`id: '${id}'`);
  const pos = c.search(idPat);
  if (pos < 0) { console.error('NOT FOUND:', id); return; }
  const expStart = c.indexOf('expected:', pos);
  let close1 = c.indexOf('},', expStart);
  let close2 = c.indexOf('},', close1 + 1);
  let block = c.slice(expStart, close2 + 2);
  const replace = (p, si, bi) => {
    return block.replace(new RegExp(`(${p}:\\s*\\{)\\s*si:\\s*\\d+,\\s*bi:\\s*\\d+\\s*\\}`), `$1 si: ${si}, bi: ${bi} }`);
  };
  block = replace('year',  ySi, yBi);
  block = replace('month', mSi, mBi);
  block = replace('day',   dSi, dBi);
  block = replace('hour',  hSi, hBi);
  c = c.slice(0, expStart) + block + c.slice(close2 + 2);
  console.log('Patched', id);
}

patch('GC001', 6,10, 5,3, 1,1, 8,6);
patch('GC002', 1,11, 9,7, 9,7, 2,4);
patch('GC003', 5,11, 1,11, 8,6, 6,10);
patch('GC004', 5,7, 3,1, 3,1, 9,3);
patch('GC005', 2,0, 6,2, 8,10, 3,7);
patch('GC006', 6,0, 4,2, 4,2, 3,5);
patch('GC007', 1,3, 5,3, 6,8, 7,5);
patch('GC008', 8,10, 0,4, 4,4, 2,4);
patch('GC009', 4,8, 3,5, 1,9, 8,6);
patch('GC010', 9,9, 4,6, 3,3, 3,7);
patch('GC011', 3,3, 3,7, 6,6, 0,8);
patch('GC012', 7,5, 2,8, 1,5, 1,9);
patch('GC013', 6,2, 1,9, 4,4, 8,10);
patch('GC014', 7,11, 4,10, 4,2, 1,3);
patch('GC015', 1,9, 3,11, 9,3, 2,4);
patch('GC016', 0,0, 2,0, 9,7, 3,5);
patch('GC017', 1,11, 5,1, 7,11, 9,5);
patch('GC018', 6,4, 4,2, 8,4, 6,10);
patch('GC019', 6,4, 4,2, 8,4, 6,0);
patch('GC020', 1,1, 6,4, 0,10, 3,3);
patch('GC021', 6,6, 8,6, 2,4, 4,0);
patch('GC022', 1,7, 1,9, 5,1, 0,0);
patch('GC023', 4,6, 1,1, 4,2, 3,5);
patch('GC024', 8,6, 3,7, 9,5, 5,7);
patch('GC025', 6,4, 4,2, 3,5, 2,6);
patch('GC026', 4,0, 6,8, 6,4, 6,4);
patch('GC027', 9,3, 2,4, 4,8, 8,0);
patch('GC028', 5,11, 2,0, 9,5, 1,3);
patch('GC029', 8,2, 2,6, 1,5, 8,6);
patch('GC030', 0,4, 3,1, 1,11, 7,5);
patch('GC031', 9,7, 9,11, 7,3, 1,7);
patch('GC032', 1,7, 5,3, 7,5, 2,8);
patch('GC033', 9,3, 6,8, 3,7, 0,4);
patch('GC034', 3,5, 6,10, 6,0, 3,11);
patch('GC035', 4,4, 2,4, 6,8, 5,3);
patch('GC036', 6,2, 5,1, 1,11, 8,6);
patch('GC037', 8,2, 4,8, 4,2, 0,2);
patch('GC038', 0,2, 7,7, 1,3, 7,5);
patch('GC039', 1,9, 0,8, 0,10, 5,5);
patch('GC040', 5,9, 7,7, 3,9, 7,1);
patch('GC041', 7,3, 7,1, 6,4, 6,4);
patch('GC042', 2,6, 7,3, 6,2, 0,8);
patch('GC043', 0,10, 8,8, 9,7, 1,3);
patch('GC044', 0,8, 0,10, 3,3, 5,9);
patch('GC045', 2,8, 5,11, 2,6, 6,2);
patch('GC046', 4,10, 4,6, 4,6, 8,10);
patch('GC047', 6,0, 5,3, 8,10, 4,8);
patch('GC048', 2,10, 1,7, 3,9, 0,4);
patch('GC049', 4,10, 0,2, 5,3, 5,5);
patch('GC050', 6,8, 4,0, 4,2, 8,0);

writeFileSync(file, c, 'utf8');
console.log('DONE — golden.dataset.js atualizado');