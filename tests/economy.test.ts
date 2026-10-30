import { describe, expect, it } from 'vitest';
import { BRUSH_AOE_SUPPED_UP, MAPS } from '../src/rules/config';
import { createDay, tickDay, tryMove, tryWax } from '../src/rules/dayPhase';
import { createMap, isWaxed, panelRating } from '../src/rules/grid';
import { createNight, mudBoyAt, tickNight } from '../src/rules/nightPhase';
import {
  buyWax,
  canStartDay,
  dayCost,
  dayOptions,
  equip,
  firstDayIsFree,
  hasShopChanges,
  newRun,
  nightOptions,
  resetPurchases,
  scoreNight,
  startNextDay,
  tryAgain,
  unlockNext,
} from '../src/rules/run';

// Give the map a POWAIN of exactly n (n panels at +2, worth 1 each).
function earn(run: ReturnType<typeof newRun>, n: number) {
  run.map = createMap(MAPS[0]);
  for (let p = 0; p < n; p++) {
    const px = p % 10;
    const py = Math.floor(p / 10);
    for (let ly = 0; ly < 4; ly++) for (let lx = 0; lx < 4; lx++) run.map.tiles[(py * 4 + ly) * 40 + px * 4 + lx] = 2;
  }
  return scoreNight(run);
}

describe('D02 ledger', () => {
  it('owner example: free Day 1, retain floor, day cost with maintenance, red when short', () => {
    const run = newRun();
    expect(run.bank).toBe(0);
    expect(firstDayIsFree(run)).toBe(true);
    expect(earn(run, 6)).toBe(6);
    expect(run.bank).toBe(6);
    expect(unlockNext(run, 'reloadSpeed')).toBe('must-retain'); // 6 - 5 = 1 < 5
    expect(dayCost(run)).toBe(5);
    expect(startNextDay(run)).toBe(true);
    expect([run.bank, run.day]).toEqual([1, 2]); // D14

    earn(run, 12);
    expect(run.bank).toBe(13);
    expect(unlockNext(run, 'reloadSpeed')).toBe('bought'); // equips L1
    expect(run.bank).toBe(8);
    expect(dayCost(run)).toBe(7);
    startNextDay(run);
    expect(run.bank).toBe(1);

    earn(run, 3);
    expect(run.bank).toBe(4);
    expect(canStartDay(run)).toBe(false);
    expect(startNextDay(run)).toBe(false);
    expect(run.bank).toBe(4);
    equip(run, 'reloadSpeed', 0);
    expect(dayCost(run)).toBe(5); // still red: 4 < 5
    expect(canStartDay(run)).toBe(false);
  });

  it('levels unlock in order; equipping any unlocked level is always allowed', () => {
    const run = newRun();
    run.bank = 100;
    expect(unlockNext(run, 'timeManipulation')).toBe('bought');
    expect(unlockNext(run, 'timeManipulation')).toBe('bought');
    expect(run.bank).toBe(55); // 15 + 30, one-time costs
    expect(dayCost(run)).toBe(15); // L2 maintenance 10 replaces L1's
    expect(equip(run, 'timeManipulation', 3)).toBe(false);
    expect(equip(run, 'timeManipulation', 1)).toBe(true);
    expect(dayOptions(run).dayLength).toBe(80);
    expect(unlockNext(run, 'bristles')).toBe('bought');
    expect(unlockNext(run, 'bristles')).toBe('max-level');
  });

  it('D22: Wax packs are repeatable', () => {
    const run = newRun();
    run.bank = 30;
    buyWax(run, 2);
    buyWax(run, 0);
    expect([run.bank, run.wax]).toEqual([15, 4]);
    run.wax = 3; // one used during the day
    buyWax(run, 1);
    expect(run.wax).toBe(5);
    expect(buyWax(run, 2)).toBe('must-retain'); // 7 - 10 < 5
  });

  it('loadout feeds the day and night', () => {
    const run = newRun();
    run.bank = 200;
    for (const id of ['extraScrubbers', 'scrubSpeed', 'brushPowa', 'brushSize', 'clipSize', 'reloadSpeed'] as const) {
      unlockNext(run, id);
    }
    const d = dayOptions(run);
    expect([d.scrubMax, d.scrubDuration, d.brushPowa, d.aoe]).toEqual([2, 2.5, 4, BRUSH_AOE_SUPPED_UP]);
    expect(nightOptions(run)).toEqual({ shootMax: 2, shootDuration: 2.5 });
  });
});

describe('D13 TRY AGAIN', () => {
  it('Map 1 returns to the fresh game every time', () => {
    const run = newRun();
    earn(run, 20);
    unlockNext(run, 'clipSize');
    startNextDay(run);
    run.px = 4;
    for (let i = 0; i < 2; i++) {
      tryAgain(run);
      expect([run.bank, run.day, run.px, run.wax, run.unlocked.clipSize, run.equipped.clipSize]).toEqual([0, 1, 0, 0, 0, 0]);
      expect(run.map.tiles.every((v) => v === 0)).toBe(true);
      expect(firstDayIsFree(run)).toBe(true);
    }
  });
});

describe('Wax and Retractable Bristles (D30: +8)', () => {
  const cleanPanel = (map: ReturnType<typeof createMap>, px: number, py: number) => {
    for (let ly = 0; ly < 4; ly++) for (let lx = 0; lx < 4; lx++) map.tiles[(py * 4 + ly) * 40 + px * 4 + lx] = 8;
  };

  it('Space waxes an unwaxed +8 panel; waxed panels are free to enter and immune to Mud Boys', () => {
    const map = createMap(MAPS[0]);
    cleanPanel(map, 0, 1);
    const day = createDay(map, { wax: 2 });
    expect(tryWax(day)).toBe('not-eligible'); // P(0,0) is 0
    expect(day.wax).toBe(2);
    tryMove(day, 'down');
    expect(tryWax(day)).toBe('waxed');
    expect(tryWax(day)).toBe('not-eligible');
    expect([day.wax, isWaxed(map, 0, 1)]).toEqual([1, true]);
    tickDay(day, 3);
    tryMove(day, 'up');
    expect(tryMove(day, 'down')).toBe('glided'); // no counter left, still allowed

    const night = createNight(map, { count: 1, edge: 'left', destination: 'right', hp: 3, waves: 1 }, { rng: () => 0.1 });
    tickNight(night, 4);
    expect(mudBoyAt(night, 0, 1)).toBeDefined();
    expect(panelRating(map, 0, 1)).toBe(8);
  });

  it('Bristles make +8 panels free; without them entering costs a counter', () => {
    const map = createMap(MAPS[0]);
    cleanPanel(map, 1, 0);
    const plain = createDay(map);
    expect(tryMove(plain, 'right')).toBe('moved');
    expect(plain.scrub.count).toBe(0);
    const bristly = createDay(map, { bristles: true });
    expect(tryMove(bristly, 'right')).toBe('glided');
    expect(bristly.scrub.count).toBe(1);
    expect(tryMove(bristly, 'left')).toBe('moved');
  });
});

describe('RESET PURCHASES (D34)', () => {
  it('restores the bank, unlocks and loadout from when the night was scored', () => {
    const run = newRun();
    earn(run, 23);
    expect(hasShopChanges(run)).toBe(false);
    // 23 - 5 - 10 = 8 left, but the new loadout costs 5 + 2 + 3 = 10: stuck without a reset.
    expect(unlockNext(run, 'scrubSpeed')).toBe('bought');
    expect(unlockNext(run, 'extraScrubbers')).toBe('bought');
    expect(canStartDay(run)).toBe(false);
    expect(hasShopChanges(run)).toBe(true);

    resetPurchases(run);
    expect(run.bank).toBe(23);
    expect(run.unlocked.extraScrubbers).toBe(0);
    expect(run.equipped.extraScrubbers).toBe(0);
    expect(run.unlocked.scrubSpeed).toBe(0);
    expect(canStartDay(run)).toBe(true);
    expect(hasShopChanges(run)).toBe(false);
  });

  it('keeps purchases from earlier days', () => {
    const run = newRun();
    earn(run, 30);
    unlockNext(run, 'extraScrubbers');
    startNextDay(run);
    const bank = run.bank + earn(run, 10);
    equip(run, 'extraScrubbers', 0);
    resetPurchases(run);
    expect(run.bank).toBe(bank);
    expect(run.unlocked.extraScrubbers).toBe(1);
    expect(run.equipped.extraScrubbers).toBe(1);
  });
});
