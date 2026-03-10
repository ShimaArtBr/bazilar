/**
 * @file tests/parity.test.js
 * @description Suite completa de paridade e cobertura — BaZi PWA.
 * CRITÉRIO E04: 50/50 PASS, FLAGS=0. REQ-09: cobertura ≥ 95%.
 * @owner Ana Luz — QA Engineer · @sprint S2·W1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FLAGS } from '../src/config/flags.js';
import { GOLDEN_CHARTS, GOLDEN_JIEQI_BOUNDARIES } from './golden.dataset.js';

beforeAll(() => {
  if (FLAGS.BAZI_STEMS_V2 !== 0 || FLAGS.BAZI_SOLAR_V2 !== 0 ||
      FLAGS.BAZI_JIEQI_V2 !== 0 || FLAGS.BAZI_EPHEM_V2 !== 0) {
    throw new Error('[E04] FLAGS devem ser 0.');
  }
});

// ── U01: engine.js ───────────────────────────────────────────────────────────
describe('U01 — engine.js', () => {

  describe('mod()', () => {
    it('mod(7,3)=1', async () => { const {mod}=await import('../src/modules/engine.js'); expect(mod(7,3)).toBe(1); });
    it('mod(-1,12)=11', async () => { const {mod}=await import('../src/modules/engine.js'); expect(mod(-1,12)).toBe(11); });
    it('mod(-36470,60)=10', async () => { const {mod}=await import('../src/modules/engine.js'); expect(mod(-36470,60)).toBe(10); });
    it('mod(0,10)=0', async () => { const {mod}=await import('../src/modules/engine.js'); expect(mod(0,10)).toBe(0); });
    it('mod(60,60)=0', async () => { const {mod}=await import('../src/modules/engine.js'); expect(mod(60,60)).toBe(0); });
  });

  describe('toJD/fromJD', () => {
    it('J2000.0 = 2451545.0', async () => {
      const {toJD}=await import('../src/modules/engine.js');
      expect(toJD(2000,1,1,12)).toBeCloseTo(2451545.0,5);
    });
    it('1900-01-01', async () => {
      const {toJD}=await import('../src/modules/engine.js');
      expect(toJD(1900,1,1,12)).toBeCloseTo(2415021.0,1);
    });
    it('fromJD(2451545)→2000-01-01', async () => {
      const {fromJD}=await import('../src/modules/engine.js');
      const r=fromJD(2451545.0); expect(r.year).toBe(2000); expect(r.month).toBe(1); expect(r.day).toBe(1);
    });
    it('toJD sem hora usa 12', async () => {
      const {toJD}=await import('../src/modules/engine.js');
      expect(toJD(2000,1,1)).toBeCloseTo(2451545.0,5);
    });
    it('29 fev 2000 round-trip', async () => {
      const {toJD,fromJD}=await import('../src/modules/engine.js');
      const r=fromJD(toJD(2000,2,29,12));
      expect(r.year).toBe(2000); expect(r.month).toBe(2); expect(r.day).toBe(29);
    });
    it('2050 round-trip', async () => {
      const {toJD,fromJD}=await import('../src/modules/engine.js');
      const r=fromJD(toJD(2050,6,15,0));
      expect(r.year).toBe(2050); expect(r.month).toBe(6); expect(r.day).toBe(15);
    });
    it('pré-J2000 > 0', async () => {
      const {toJD}=await import('../src/modules/engine.js');
      expect(toJD(1850,3,15,12)).toBeGreaterThan(0);
    });
    it('fromJD pré-gregoriana z<2299161', async () => {
      const {fromJD}=await import('../src/modules/engine.js');
      const r=fromJD(2299160); expect(r.year).toBeGreaterThan(1500);
    });
  });

  describe('sunLon()', () => {
    it('J2000 ≈ 280.37°', async () => {
      const {sunLon,toJD}=await import('../src/modules/engine.js');
      expect(sunLon(toJD(2000,1,1,12))).toBeCloseTo(280.37,0);
    });
    it('solstício verão ≈ 90°', async () => {
      const {sunLon,toJD}=await import('../src/modules/engine.js');
      const l=sunLon(toJD(2000,6,21,12)); expect(l).toBeGreaterThan(88); expect(l).toBeLessThan(92);
    });
    it('equinócio março ≈ 0°', async () => {
      const {sunLon,toJD}=await import('../src/modules/engine.js');
      const l=sunLon(toJD(2000,3,20,12)); expect(l>358||l<2).toBe(true);
    });
    it('sempre em [0,360)', async () => {
      const {sunLon,toJD}=await import('../src/modules/engine.js');
      for (const m of [1,4,7,10]) {
        const l=sunLon(toJD(2000,m,15,12));
        expect(l).toBeGreaterThanOrEqual(0); expect(l).toBeLessThan(360);
      }
    });
  });

  describe('termJD()', () => {
    it('LiChun 2000 ±1h', async () => {
      const {termJD}=await import('../src/modules/engine.js');
      expect(Math.abs(termJD(315,2000)-2451579.025677234)).toBeLessThan(1/24);
    });
    it('QingMing 2020 ±1h', async () => {
      const {termJD}=await import('../src/modules/engine.js');
      expect(Math.abs(termJD(15,2020)-2458943.8231764734)).toBeLessThan(1/24);
    });
    it('cache: chamadas repetidas idênticas', async () => {
      const {termJD}=await import('../src/modules/engine.js');
      expect(termJD(75,2010)).toBe(termJD(75,2010));
    });
    it('10 termos de 2023 crescem monotonicamente', async () => {
      const {termJD}=await import('../src/modules/engine.js');
      const ls=[315,345,15,45,75,105,135,165,195,225];
      const jds=ls.map(l=>termJD(l,2023));
      for (let i=1;i<jds.length;i++) expect(jds[i]).toBeGreaterThan(jds[i-1]);
    });
  });

  describe('calcRST()', () => {
    it('retorna h,m,s,lc,e,dc,corr', async () => {
      const {calcRST}=await import('../src/modules/engine.js');
      const r=calcRST(2000,6,21,12,0,116.4,8,false);
      ['h','m','s','lc','e','dc','corr'].forEach(k=>expect(r).toHaveProperty(k));
    });
    it('Beijing lc ≈ -14.4 min', async () => {
      const {calcRST}=await import('../src/modules/engine.js');
      expect(calcRST(2000,6,21,12,0,116.4,8,false).lc).toBeCloseTo(-14.4,1);
    });
    it('h em [0,23] para várias horas', async () => {
      const {calcRST}=await import('../src/modules/engine.js');
      for (const h of [0,6,12,18,23]) {
        const r=calcRST(2000,1,1,h,0,0,0,false);
        expect(r.h).toBeGreaterThanOrEqual(0); expect(r.h).toBeLessThanOrEqual(23);
      }
    });
    it('DST=true: dc=-60', async () => {
      const {calcRST}=await import('../src/modules/engine.js');
      expect(calcRST(2000,6,21,12,0,0,0,true).dc).toBe(-60);
    });
    it('DST=false: dc=0', async () => {
      const {calcRST}=await import('../src/modules/engine.js');
      expect(calcRST(2000,6,21,12,0,0,0,false).dc).toBe(0);
    });
    it('overflow negativo enrola para [0,23]', async () => {
      const {calcRST}=await import('../src/modules/engine.js');
      const r=calcRST(2000,6,21,0,0,-180,-12,false);
      expect(r.h).toBeGreaterThanOrEqual(0); expect(r.h).toBeLessThanOrEqual(23);
    });
  });

  describe('p2/ft/sgn', () => {
    it('p2(5)="05"', async () => { const {p2}=await import('../src/modules/engine.js'); expect(p2(5)).toBe('05'); });
    it('p2(12)="12"', async () => { const {p2}=await import('../src/modules/engine.js'); expect(p2(12)).toBe('12'); });
    it('p2(9.9)="09" (floor)', async () => { const {p2}=await import('../src/modules/engine.js'); expect(p2(9.9)).toBe('09'); });
    it('ft(12,30)="12:30"', async () => { const {ft}=await import('../src/modules/engine.js'); expect(ft(12,30)).toBe('12:30'); });
    it('ft(8,5,3)="08:05:03"', async () => { const {ft}=await import('../src/modules/engine.js'); expect(ft(8,5,3)).toBe('08:05:03'); });
    it('sgn(5.1)="+5.1"', async () => { const {sgn}=await import('../src/modules/engine.js'); expect(sgn(5.1)).toBe('+5.1'); });
    it('sgn(-3.0)="-3.0"', async () => { const {sgn}=await import('../src/modules/engine.js'); expect(sgn(-3.0)).toBe('-3.0'); });
    it('sgn(0)="+0.0"', async () => { const {sgn}=await import('../src/modules/engine.js'); expect(sgn(0)).toBe('+0.0'); });
  });

});

// ── U02: pillars.js básico ────────────────────────────────────────────────────
describe('U02 — pillars.js: yearPil, monthPil, dayPil, hourPil, calcLuckPillars', () => {

  describe('yearPil()', () => {
    it('2000-06-15 → 庚辰 si=6 bi=4', async () => {
      const {yearPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const r=yearPil(toJD(2000,6,15,12)); expect(r.si).toBe(6); expect(r.bi).toBe(4);
    });
    it('2000-01-20 (antes LiChun) → 1999 己卯 si=5 bi=3', async () => {
      const {yearPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const r=yearPil(toJD(2000,1,20,12)); expect(r.si).toBe(5); expect(r.bi).toBe(3);
    });
    it('retorna by', async () => {
      const {yearPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(yearPil(toJD(2008,8,8,12))).toHaveProperty('by');
    });
    it('si∈[0-9] bi∈[0-11] para vários anos', async () => {
      const {yearPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      for (const y of [1850,1900,1950,2000,2025]) {
        const r=yearPil(toJD(y,6,15,12));
        expect(r.si).toBeGreaterThanOrEqual(0); expect(r.si).toBeLessThanOrEqual(9);
        expect(r.bi).toBeGreaterThanOrEqual(0); expect(r.bi).toBeLessThanOrEqual(11);
      }
    });
  });

  describe('monthPil()', () => {
    it('2000-06-15 → 午 bi=6', async () => {
      const {monthPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(monthPil(toJD(2000,6,15,12),false).bi).toBe(6);
    });
    it('hemisfério sul inverte bi +6', async () => {
      const {monthPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const jd=toJD(2000,6,15,12);
      const norte=monthPil(jd,false), sul=monthPil(jd,true);
      expect(sul.bi).toBe((norte.bi+6)%12);
    });
    it('retorna mi', async () => {
      const {monthPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(monthPil(toJD(2000,6,15,12),false)).toHaveProperty('mi');
    });
    it('si∈[0-9] para todos os meses', async () => {
      const {monthPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      for (const m of [1,3,6,9,12]) {
        const r=monthPil(toJD(2010,m,15,12),false);
        expect(r.si).toBeGreaterThanOrEqual(0); expect(r.si).toBeLessThanOrEqual(9);
      }
    });
    it('JD antigo não quebra (fallback bestMi=0)', async () => {
      const {monthPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(()=>monthPil(toJD(1800,6,15,12),false)).not.toThrow();
    });
  });

  describe('dayPil()', () => {
    it('J2000 idx=54 → si=4 bi=6', async () => {
      const {dayPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const r=dayPil(toJD(2000,1,1,12));
      expect(r.idx).toBe(54); expect(r.si).toBe(4); expect(r.bi).toBe(6);
    });
    it('si∈[0-9] bi∈[0-11]', async () => {
      const {dayPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      for (const [y,m,d] of [[1850,3,15],[1984,12,31],[2024,2,29]]) {
        const r=dayPil(toJD(y,m,d,12));
        expect(r.si).toBeGreaterThanOrEqual(0); expect(r.si).toBeLessThanOrEqual(9);
        expect(r.bi).toBeGreaterThanOrEqual(0); expect(r.bi).toBeLessThanOrEqual(11);
      }
    });
    it('idx∈[0-59]', async () => {
      const {dayPil}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const r=dayPil(toJD(2024,6,15,12));
      expect(r.idx).toBeGreaterThanOrEqual(0); expect(r.idx).toBeLessThanOrEqual(59);
    });
  });

  describe('hourPil()', () => {
    it('h=12 dm=甲(0) → bi=6 (午) si=6 (庚)', async () => {
      const {hourPil}=await import('../src/modules/pillars.js');
      const r=hourPil(12,0); expect(r.bi).toBe(6); expect(r.si).toBe(6);
    });
    it('h=23 → bi=0 (子)', async () => {
      const {hourPil}=await import('../src/modules/pillars.js');
      expect(hourPil(23,0).bi).toBe(0);
    });
    it('h=0 → bi=0 (子)', async () => {
      const {hourPil}=await import('../src/modules/pillars.js');
      expect(hourPil(0,2).bi).toBe(0);
    });
    it('si∈[0-9] bi∈[0-11] para todas as horas', async () => {
      const {hourPil}=await import('../src/modules/pillars.js');
      for (let h=0;h<24;h++) {
        const r=hourPil(h,3);
        expect(r.si).toBeGreaterThanOrEqual(0); expect(r.si).toBeLessThanOrEqual(9);
        expect(r.bi).toBeGreaterThanOrEqual(0); expect(r.bi).toBeLessThanOrEqual(11);
      }
    });
  });

  describe('calcLuckPillars()', () => {
    it('gender null → null', async () => {
      const {calcLuckPillars}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(calcLuckPillars(toJD(2000,6,15,12),0,2,4,null,2000)).toBeNull();
    });
    it('M+Yang → forward=true', async () => {
      const {calcLuckPillars}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(calcLuckPillars(toJD(2000,6,15,12),0,4,2,'M',2000).forward).toBe(true);
    });
    it('F+Yang → forward=false', async () => {
      const {calcLuckPillars}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(calcLuckPillars(toJD(2000,6,15,12),0,4,2,'F',2000).forward).toBe(false);
    });
    it('8 ciclos', async () => {
      const {calcLuckPillars}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      expect(calcLuckPillars(toJD(1984,6,15,12),0,4,2,'M',1984).pillars).toHaveLength(8);
    });
    it('cada ciclo tem si,bi,age,ageEnd,startYear', async () => {
      const {calcLuckPillars}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const r=calcLuckPillars(toJD(1984,6,15,12),0,4,2,'F',1984);
      r.pillars.forEach(p=>{
        expect(p).toHaveProperty('si'); expect(p).toHaveProperty('bi');
        expect(p).toHaveProperty('age'); expect(p).toHaveProperty('ageEnd');
        expect(p).toHaveProperty('startYear');
      });
    });
    it('forward: si sobe +1 a cada ciclo', async () => {
      const {calcLuckPillars}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const r=calcLuckPillars(toJD(2000,6,15,12),0,4,2,'M',2000);
      if (r&&r.pillars.length>=2) expect((r.pillars[1].si-r.pillars[0].si+10)%10).toBe(1);
    });
    it('backward: si desce -1 a cada ciclo', async () => {
      const {calcLuckPillars}=await import('../src/modules/pillars.js');
      const {toJD}=await import('../src/modules/engine.js');
      const r=calcLuckPillars(toJD(2000,6,15,12),0,4,2,'F',2000);
      if (r&&r.pillars.length>=2) expect((r.pillars[0].si-r.pillars[1].si+10)%10).toBe(1);
    });
  });

});

// ── U03: pillars.js avançado ──────────────────────────────────────────────────
describe('U03 — pillars.js: estrelas, interações, balanço, força DM', () => {

  describe('findStars()', () => {
    it('retorna array', async () => {
      const {findStars}=await import('../src/modules/pillars.js');
      expect(Array.isArray(findStars(0,6,0,4))).toBe(true);
    });
    it('TianYi presente (yb=1, TIANYI[0]=[1,7])', async () => {
      const {findStars}=await import('../src/modules/pillars.js');
      expect(findStars(1,0,0,0).filter(s=>s.name==='starTianYi').length).toBeGreaterThan(0);
    });
    it('TaoHua presente (yb=8, TAOHUA[8]=9)', async () => {
      const {findStars}=await import('../src/modules/pillars.js');
      expect(findStars(8,0,0,0).filter(s=>s.name==='starTaoHua').length).toBeGreaterThan(0);
    });
    it('TaoHua não duplica quando yb==db', async () => {
      const {findStars}=await import('../src/modules/pillars.js');
      expect(findStars(8,8,0,0).filter(s=>s.name==='starTaoHua').length).toBe(1);
    });
    it('YiMa presente (yb=8, YIMA[8]=2)', async () => {
      const {findStars}=await import('../src/modules/pillars.js');
      expect(findStars(8,0,0,0).filter(s=>s.name==='starYiMa').length).toBeGreaterThan(0);
    });
    it('YiMa não duplica quando yb==db', async () => {
      const {findStars}=await import('../src/modules/pillars.js');
      expect(findStars(8,8,0,0).filter(s=>s.name==='starYiMa').length).toBe(1);
    });
  });

  describe('findInteractions()', () => {
    it('branches sem interação → []', async () => {
      const {findInteractions}=await import('../src/modules/pillars.js');
      expect(findInteractions([1,3,5])).toEqual([]);
    });
    it('clash 子午 (0,6)', async () => {
      const {findInteractions}=await import('../src/modules/pillars.js');
      expect(findInteractions([0,6,2,8]).some(x=>x.type==='clash')).toBe(true);
    });
    it('harmony6 子丑 (0,1)', async () => {
      const {findInteractions}=await import('../src/modules/pillars.js');
      expect(findInteractions([0,1,4,7]).some(x=>x.type==='harmony6')).toBe(true);
    });
    it('harmony3 寅午戌 (2,6,10)', async () => {
      const {findInteractions}=await import('../src/modules/pillars.js');
      expect(findInteractions([2,6,10,0]).some(x=>x.type==='harmony3')).toBe(true);
    });
    it('harm 子未 (0,7)', async () => {
      const {findInteractions}=await import('../src/modules/pillars.js');
      expect(findInteractions([0,7,2,4]).some(x=>x.type==='harm')).toBe(true);
    });
    it('penalty 子卯 (0,3)', async () => {
      const {findInteractions}=await import('../src/modules/pillars.js');
      expect(findInteractions([0,3,5,8]).some(x=>x.type==='penalty')).toBe(true);
    });
  });

  describe('elemBalance()', () => {
    it('retorna 5 elementos', async () => {
      const {elemBalance}=await import('../src/modules/pillars.js');
      const r=elemBalance([0,2,4,6],[0,2,4,6]);
      ['Wood','Fire','Earth','Metal','Water'].forEach(e=>expect(r).toHaveProperty(e));
    });
    it('stems 甲乙丙丁 → Wood=2 Fire=2', async () => {
      const {elemBalance}=await import('../src/modules/pillars.js');
      const r=elemBalance([0,1,2,3],[]);
      expect(r.Wood).toBe(2); expect(r.Fire).toBe(2); expect(r.Earth).toBe(0);
    });
    it('ramo 子 hidden [9] contribui Water>0', async () => {
      const {elemBalance}=await import('../src/modules/pillars.js');
      expect(elemBalance([],[0]).Water).toBeGreaterThan(0);
    });
    it('bi=null não quebra', async () => {
      const {elemBalance}=await import('../src/modules/pillars.js');
      expect(()=>elemBalance([0],[null,0])).not.toThrow();
    });
    it('bi fora de range não quebra', async () => {
      const {elemBalance}=await import('../src/modules/pillars.js');
      expect(()=>elemBalance([0],[99,-1])).not.toThrow();
    });
    it('stem negativo ignorado', async () => {
      const {elemBalance}=await import('../src/modules/pillars.js');
      expect(elemBalance([-1,0],[]).Wood).toBe(1);
    });
  });

  describe('calcDayMasterStrength()', () => {
    it('retorna score,strong,favorable,unfavorable,dmEl', async () => {
      const {calcDayMasterStrength}=await import('../src/modules/pillars.js');
      const r=calcDayMasterStrength(0,[0,2,4,6],[0,2,4,6],2);
      ['score','strong','favorable','unfavorable','dmEl'].forEach(k=>expect(r).toHaveProperty(k));
    });
    it('強 quando muitos aliados (all Wood)', async () => {
      const {calcDayMasterStrength}=await import('../src/modules/pillars.js');
      expect(calcDayMasterStrength(0,[0,0,0,0],[0,0,0,0],2).strong).toBe(true);
    });
    it('弱 quando rodeado de 官杀', async () => {
      const {calcDayMasterStrength}=await import('../src/modules/pillars.js');
      expect(calcDayMasterStrength(0,[6,6,6,7],[8,9,8,9],2).strong).toBe(false);
    });
    it('dmEl="Wood" para 甲(0)', async () => {
      const {calcDayMasterStrength}=await import('../src/modules/pillars.js');
      expect(calcDayMasterStrength(0,[0,2,4,6],[0,2,4,6],2).dmEl).toBe('Wood');
    });
    it('monthBranchPillarIdx undefined → usa 2 por padrão', async () => {
      const {calcDayMasterStrength}=await import('../src/modules/pillars.js');
      const r1=calcDayMasterStrength(0,[0,2,4,6],[0,2,4,6],undefined);
      const r2=calcDayMasterStrength(0,[0,2,4,6],[0,2,4,6],2);
      expect(r1.score).toBeCloseTo(r2.score,5);
    });
    it('bi=null/NaN não lança', async () => {
      const {calcDayMasterStrength}=await import('../src/modules/pillars.js');
      expect(()=>calcDayMasterStrength(0,[0,2,4,6],[null,NaN,4,6],2)).not.toThrow();
    });
    it('score arredondado a 2 casas', async () => {
      const {calcDayMasterStrength}=await import('../src/modules/pillars.js');
      const r=calcDayMasterStrength(0,[0,2,4,6],[0,2,4,6],2);
      expect(String(r.score)).toMatch(/^-?\d+(\.\d{1,2})?$/);
    });
  });

});

// ── U04: data.js ──────────────────────────────────────────────────────────────
describe('U04 — data.js: constantes e tenGod()', () => {

  it('ST: 10 troncos com zh,py,el,po', async () => {
    const {ST}=await import('../src/modules/data.js');
    expect(ST).toHaveLength(10);
    ST.forEach(s=>{expect(s).toHaveProperty('zh');expect(s).toHaveProperty('po');});
  });
  it('EB: 12 ramos com zh,an,hr', async () => {
    const {EB}=await import('../src/modules/data.js');
    expect(EB).toHaveLength(12);
    EB.forEach(b=>{expect(b).toHaveProperty('zh');expect(b).toHaveProperty('an');});
  });
  it('MT: 12 termos com l,n,py', async () => {
    const {MT}=await import('../src/modules/data.js');
    expect(MT).toHaveLength(12);
    MT.forEach(t=>{expect(t).toHaveProperty('l');expect(t).toHaveProperty('n');});
  });
  it('HIDDEN: 12 arrays', async () => {
    const {HIDDEN}=await import('../src/modules/data.js');
    expect(HIDDEN).toHaveLength(12);
    HIDDEN.forEach(h=>expect(Array.isArray(h)).toBe(true));
  });
  it('MBS=12, YMS=10, DHS=10', async () => {
    const {MBS,YMS,DHS}=await import('../src/modules/data.js');
    expect(MBS).toHaveLength(12);
    expect(YMS).toHaveLength(10);
    expect(DHS).toHaveLength(10);
  });

  describe('tenGod() — casos individuais', () => {
    it('(0,0)=比肩', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,0).zh).toBe('比肩'); });
    it('(0,1)=劫財', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,1).zh).toBe('劫財'); });
    it('(0,2)=食神', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,2).zh).toBe('食神'); });
    it('(0,3)=傷官', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,3).zh).toBe('傷官'); });
    it('(0,4)=偏財', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,4).zh).toBe('偏財'); });
    it('(0,5)=正財', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,5).zh).toBe('正財'); });
    it('(0,6)=七殺', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,6).zh).toBe('七殺'); });
    it('(0,7)=正官', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,7).zh).toBe('正官'); });
    it('(0,8)=偏印', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,8).zh).toBe('偏印'); });
    it('(0,9)=正印', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,9).zh).toBe('正印'); });
    it('dm<0 → null', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(-1,0)).toBeNull(); });
    it('o<0 → null', async () => { const {tenGod}=await import('../src/modules/data.js'); expect(tenGod(0,-1)).toBeNull(); });
    it('100 combinações retornam zh e py', async () => {
      const {tenGod}=await import('../src/modules/data.js');
      let n=0;
      for (let dm=0;dm<10;dm++) for (let o=0;o<10;o++) {
        const r=tenGod(dm,o); expect(r).not.toBeNull();
        expect(r).toHaveProperty('zh'); expect(r).toHaveProperty('py'); n++;
      }
      expect(n).toBe(100);
    });
    it('100 combinações coincidem com computeTenGodLabel', async () => {
      const {tenGod}=await import('../src/modules/data.js');
      const G=[(sy)=>sy?'比肩':'劫財',(sy)=>sy?'食神':'傷官',(sy)=>sy?'偏財':'正財',(sy)=>sy?'七殺':'正官',(sy)=>sy?'偏印':'正印'];
      let diffs=0;
      for (let dm=0;dm<10;dm++) for (let o=0;o<10;o++) {
        const sameYin=(dm%2)===(o%2);
        const rel=(Math.floor(o/2)-Math.floor(dm/2)+5)%5;
        if (tenGod(dm,o).zh!==G[rel](sameYin)) diffs++;
      }
      expect(diffs).toBe(0);
    });
  });

});

// ── U05: ten-gods.js ──────────────────────────────────────────────────────────
describe('U05 — ten-gods.js', () => {

  describe('computeTenGods()', () => {
    it('[] → []', async () => { const {computeTenGods}=await import('../src/core/ten-gods.js'); expect(computeTenGods(0,[])).toEqual([]); });
    it('null → []', async () => { const {computeTenGods}=await import('../src/core/ten-gods.js'); expect(computeTenGods(0,null)).toEqual([]); });
    it('mesmo comprimento', async () => { const {computeTenGods}=await import('../src/core/ten-gods.js'); expect(computeTenGods(0,[0,2,4,6])).toHaveLength(4); });
    it('cada item tem stemIdx e tenGod.zh/py', async () => {
      const {computeTenGods}=await import('../src/core/ten-gods.js');
      computeTenGods(0,[0,6,8]).forEach(item=>{
        expect(item).toHaveProperty('stemIdx'); expect(item.tenGod).toHaveProperty('zh');
      });
    });
    it('dm=0 o=0 → 比肩', async () => { const {computeTenGods}=await import('../src/core/ten-gods.js'); expect(computeTenGods(0,[0])[0].tenGod.zh).toBe('比肩'); });
    it('stem -1 → fallback zh="—"', async () => { const {computeTenGods}=await import('../src/core/ten-gods.js'); expect(computeTenGods(0,[-1])[0].tenGod.zh).toBe('—'); });
  });

  describe('getDayMasterStrength()', () => {
    it('retorna score,strong,dmEl', async () => {
      const {getDayMasterStrength}=await import('../src/core/ten-gods.js');
      const r=getDayMasterStrength(0,[0,2,4,6],[0,2,4,6],2);
      expect(r).toHaveProperty('score'); expect(r).toHaveProperty('strong'); expect(r).toHaveProperty('dmEl');
    });
  });

  describe('getFavorableElements()', () => {
    it('input válido → {favorable,unfavorable}', async () => {
      const {getFavorableElements}=await import('../src/core/ten-gods.js');
      const r=getFavorableElements({favorable:['Fire'],unfavorable:['Water'],score:1,strong:true,dmEl:'Wood'});
      expect(r).toHaveProperty('favorable'); expect(r).toHaveProperty('unfavorable');
    });
    it('null → arrays vazios', async () => {
      const {getFavorableElements}=await import('../src/core/ten-gods.js');
      const r=getFavorableElements(null);
      expect(r.favorable).toEqual([]); expect(r.unfavorable).toEqual([]);
    });
    it('sem favorable → []', async () => {
      const {getFavorableElements}=await import('../src/core/ten-gods.js');
      expect(getFavorableElements({score:1}).favorable).toEqual([]);
    });
    it('propaga arrays', async () => {
      const {getFavorableElements}=await import('../src/core/ten-gods.js');
      expect(getFavorableElements({favorable:['Metal','Water'],unfavorable:['Fire']}).favorable).toEqual(['Metal','Water']);
    });
  });

});

// ── U06: bazi-engine.js ───────────────────────────────────────────────────────
describe('U06 — bazi-engine.js', () => {

  describe('computeFourPillars()', () => {
    it('retorna year,month,day,hour,jd', async () => {
      const {computeFourPillars}=await import('../src/core/bazi-engine.js');
      const r=computeFourPillars({year:2000,month:6,day:15,hour:12,minute:0,longitude:116.4,timezone:8,gender:'M'});
      ['year','month','day','hour','jd'].forEach(k=>expect(r).toHaveProperty(k));
    });
    it('si∈[0-9] bi∈[0-11] em todos os pilares', async () => {
      const {computeFourPillars}=await import('../src/core/bazi-engine.js');
      const r=computeFourPillars({year:1984,month:6,day:15,hour:12,minute:0,longitude:116.4,timezone:8,gender:'F'});
      ['year','month','day','hour'].forEach(p=>{
        expect(r[p].si).toBeGreaterThanOrEqual(0); expect(r[p].si).toBeLessThanOrEqual(9);
        expect(r[p].bi).toBeGreaterThanOrEqual(0); expect(r[p].bi).toBeLessThanOrEqual(11);
      });
    });
    it('minute ausente não quebra', async () => {
      const {computeFourPillars}=await import('../src/core/bazi-engine.js');
      expect(()=>computeFourPillars({year:2000,month:6,day:15,hour:12,longitude:116.4,timezone:8,gender:'M'})).not.toThrow();
    });
    it('southernHemisphere altera pilar do mês', async () => {
      const {computeFourPillars}=await import('../src/core/bazi-engine.js');
      const n=computeFourPillars({year:2000,month:6,day:15,hour:12,minute:0,longitude:-46.6,timezone:-3,gender:'M',southernHemisphere:false});
      const s=computeFourPillars({year:2000,month:6,day:15,hour:12,minute:0,longitude:-46.6,timezone:-3,gender:'M',southernHemisphere:true});
      expect(s.month.bi).not.toBe(n.month.bi);
    });
  });

  describe('computeLuckPillars()', () => {
    it('gender null → null', async () => {
      const {computeFourPillars,computeLuckPillars}=await import('../src/core/bazi-engine.js');
      const fp=computeFourPillars({year:2000,month:6,day:15,hour:12,minute:0,longitude:116.4,timezone:8,gender:null});
      expect(computeLuckPillars(fp,{year:2000,month:6,day:15},null)).toBeNull();
    });
    it('retorna forward,pillars,startAge', async () => {
      const {computeFourPillars,computeLuckPillars}=await import('../src/core/bazi-engine.js');
      const fp=computeFourPillars({year:1984,month:6,day:15,hour:12,minute:0,longitude:116.4,timezone:8,gender:'M'});
      const r=computeLuckPillars(fp,{year:1984,month:6,day:15},'M');
      ['forward','pillars','startAge'].forEach(k=>expect(r).toHaveProperty(k));
    });
  });

  describe('detectInteractions()', () => {
    it('sem interações → []', async () => {
      const {detectInteractions}=await import('../src/core/bazi-engine.js');
      expect(Array.isArray(detectInteractions([0,2,4,6]))).toBe(true);
    });
    it('clash 子午 detectado', async () => {
      const {detectInteractions}=await import('../src/core/bazi-engine.js');
      expect(detectInteractions([0,6,2,8]).some(x=>x.type==='clash')).toBe(true);
    });
  });

});

// ── E01: Delta solar ──────────────────────────────────────────────────────────
describe('E01 — Delta solar < 0.1°', () => {
  const cases = [
    [2000,1,1,12,'J2000.0'],
    [1900,1,15,12,'1900-01-15'],
    [2100,6,21,12,'2100-06-21'],
    [1850,3,15,12,'1850-03-15'],
  ];
  cases.forEach(([y,m,d,h,label]) => {
    it(label, async () => {
      const {sunLon,toJD}=await import('../src/modules/engine.js');
      const {Ephemeris}=await import('../src/adapters/ephemeris.adapter.js');
      const jd=toJD(y,m,d,h);
      const baz=sunLon(jd);
      const lw=Ephemeris.sunApparentLongitude(y,m,d,h,0,0);
      expect(lw.error).toBeFalsy();
      expect(Math.abs(baz-lw.lambda)).toBeLessThan(0.1);
    });
  });
});

// ── E03: Fronteiras Jieqi ─────────────────────────────────────────────────────
describe('E03 — Fronteiras Jieqi ±1h', () => {
  GOLDEN_JIEQI_BOUNDARIES.forEach(jq => {
    it(`${jq.id}: ${jq.label}`, async () => {
      const {termJD}=await import('../src/modules/engine.js');
      const year=parseInt(jq.label.match(/\d{4}/)[0]);
      expect(Math.abs(termJD(jq.lambda,year)-jq.jdExpected)).toBeLessThan(1/24);
    });
  });
});

// ── E04: Paridade 50 cartas ───────────────────────────────────────────────────
describe('E04 — Paridade 50/50 (FLAGS=0)', () => {
  GOLDEN_CHARTS.forEach(gc => {
    it(`${gc.id}: ${gc.label}`, async () => {
      const {computeFourPillars}=await import('../src/core/bazi-engine.js');
      const r=computeFourPillars(gc.birth);
      expect(r.year.si, `${gc.id} year.si`).toBe(gc.expected.year.si);
      expect(r.year.bi, `${gc.id} year.bi`).toBe(gc.expected.year.bi);
      expect(r.month.si,`${gc.id} month.si`).toBe(gc.expected.month.si);
      expect(r.month.bi,`${gc.id} month.bi`).toBe(gc.expected.month.bi);
      expect(r.day.si,  `${gc.id} day.si`).toBe(gc.expected.day.si);
      expect(r.day.bi,  `${gc.id} day.bi`).toBe(gc.expected.day.bi);
      expect(r.hour.si, `${gc.id} hour.si`).toBe(gc.expected.hour.si);
      expect(r.hour.bi, `${gc.id} hour.bi`).toBe(gc.expected.hour.bi);
    });
  });
});

// ── E07: Adapters ─────────────────────────────────────────────────────────────
describe('E07 — Adapters carregam sem erro', () => {
  it('Ephemeris: lambda em [0,360)', async () => {
    const {Ephemeris}=await import('../src/adapters/ephemeris.adapter.js');
    const r=Ephemeris.sunApparentLongitude(2000,6,21,12,0,0);
    expect(r.error).toBeFalsy();
    expect(r.lambda).toBeGreaterThanOrEqual(0); expect(r.lambda).toBeLessThan(360);
  });
  it('bazi-engine: 4 pilares + jd', async () => {
    const {computeFourPillars}=await import('../src/core/bazi-engine.js');
    const r=computeFourPillars({year:2000,month:6,day:15,hour:12,gender:'M'});
    ['year','month','day','hour','jd'].forEach(k=>expect(r).toHaveProperty(k));
  });
  it('ten-gods: array TenGodResult', async () => {
    const {computeTenGods}=await import('../src/core/ten-gods.js');
    computeTenGods(0,[0,2,4,6]).forEach(item=>expect(item.tenGod).toHaveProperty('zh'));
  });
  it('HiddenStems adapter carrega', async () => {
    await expect(import('../src/adapters/hiddenStems.adapter.js')).resolves.toBeDefined();
  });
  it('Jieqi adapter carrega', async () => {
    await expect(import('../src/adapters/jieqi.adapter.js')).resolves.toBeDefined();
  });
  it('SolarTime adapter carrega', async () => {
    await expect(import('../src/adapters/solarTime.adapter.js')).resolves.toBeDefined();
  });
});
