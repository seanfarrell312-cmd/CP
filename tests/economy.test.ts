import { describe, expect, it } from 'vitest';
import { BRUSH_AOE_SUPPED_UP, MAPS, WAVE_TABLE, map2WaveForDay } from '../src/rules/config';
import { createDay, tickDay, tryMove, tryWax } from '../src/rules/dayPhase';
import { createMap, isWaxed, panelRating } from '../src/rules/grid';
import { createNight, mudBoyAt, tickNight } from '../src/rules/nightPhase';
import {
  buyWax,
  claimVictory,
  isLastMap,
  nextMap,
  waveForRun,
  dayOptions,
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
  it('D40: days are free; a purchase only needs the price in the bank', () => {
    const run = newRun();
    expect(run.bank).toBe(0);
    expect(firstDayIsFree(run)).toBe(true);
    expect(earn(run, 9)).toBe(9);
    expect(unlockNext(run, 'reloadSpeed')).toBe('too-expensive'); // 9 < 10 (D46)
    startNextDay(run);
    expect([run.bank, run.day]).toEqual([9, 2]); // D14

    earn(run, 1);
    expect(unlockNext(run, 'reloadSpeed')).toBe('bought'); // 10 - 10 = 0 is fine
    expect(run.bank).toBe(0);
    startNextDay(run);
    expect([run.bank, run.day]).toEqual([0, 3]);
  });

  it('levels unlock in order; the highest bought level is active', () => {
    const run = newRun();
    run.bank = 225;
    expect(unlockNext(run, 'timeManipulation')).toBe('bought');
    expect(unlockNext(run, 'timeManipulation')).toBe('bought');
    expect(run.bank).toBe(45); // 45 + 135, one-time costs (D41)
    expect(dayOptions(run).dayLength).toBe(90);
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
    expect(buyWax(run, 2)).toBe('too-expensive'); // 7 < 10
  });

  it('loadout feeds the day and night', () => {
    const run = newRun();
    run.bank = 225;
    for (const id of ['extraScrubbers', 'scrubSpeed', 'brushPowa', 'brushSize', 'clipSize', 'reloadSpeed'] as const) {
      unlockNext(run, id);
    }
    const d = dayOptions(run);
    expect([d.scrubMax, d.scrubDuration, d.brushPowa, d.aoe]).toEqual([2, 2.1, 4, BRUSH_AOE_SUPPED_UP]);
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
      expect([run.bank, run.day, run.px, run.wax, run.unlocked.clipSize]).toEqual([0, 1, 0, 0, 0]);
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
  it('restores the bank and unlocks from when the night was scored', () => {
    const run = newRun();
    earn(run, 48);
    expect(hasShopChanges(run)).toBe(false);
    expect(unlockNext(run, 'scrubSpeed')).toBe('bought');
    expect(unlockNext(run, 'extraScrubbers')).toBe('bought');
    expect(run.bank).toBe(8); // 48 - 10 - 30
    expect(hasShopChanges(run)).toBe(true);

    resetPurchases(run);
    expect(run.bank).toBe(48);
    expect(run.unlocked.extraScrubbers).toBe(0);
    expect(run.unlocked.scrubSpeed).toBe(0);
    expect(hasShopChanges(run)).toBe(false);
  });

  it('keeps purchases from earlier days', () => {
    const run = newRun();
    earn(run, 30);
    unlockNext(run, 'extraScrubbers');
    startNextDay(run);
    const bank = run.bank + earn(run, 10);
    buyWax(run, 0);
    resetPurchases(run);
    expect([run.bank, run.wax]).toEqual([bank, 0]);
    expect(run.unlocked.extraScrubbers).toBe(1);
  });
});

// Every tile +8 except panel (px, py), whose tiles are set to `rest`.
function nearlyClean(run: ReturnType<typeof newRun>, px: number, py: number, rest: number) {
  const { tiles, tilesX } = run.map;
  tiles.fill(8);
  for (let ly = 0; ly < 4; ly++) for (let lx = 0; lx < 4; lx++) tiles[(py * 4 + ly) * tilesX + px * 4 + lx] = rest;
}

describe('map victory and Map 2 (D15, D23, D13)', () => {
  it('the scrub that makes every panel +8 wins at once and stops the clock', () => {
    const run = newRun();
    nearlyClean(run, 3, 0, 6);
    const day = createDay(run.map, { startPx: 2, aoe: BRUSH_AOE_SUPPED_UP, startedImmediately: true });
    tickDay(day, 10);
    expect(tryMove(day, 'right')).toBe('moved');
    expect([day.victory, day.ended]).toEqual([true, true]);
    const left = day.timeLeft;
    tickDay(day, 5);
    expect(day.timeLeft).toBe(left);
    expect(tryMove(day, 'right')).toBe('day-over');
    expect(claimVictory(run)).toBe(400);
    expect(run.bank).toBe(400);
  });

  it('a scrub that leaves a panel below +8 does not win', () => {
    const run = newRun();
    nearlyClean(run, 3, 0, 6);
    const day = createDay(run.map, { startPx: 2, startedImmediately: true }); // default brush: borders reach only +7
    tryMove(day, 'right');
    expect(day.victory).toBe(false);
  });

  it('NEXT MAP keeps POWA, upgrades, Wax and day; TRY AGAIN on Map 2 returns to that arrival', () => {
    const run = newRun();
    run.bank = 450;
    unlockNext(run, 'reloadSpeed');
    unlockNext(run, 'reloadSpeed');
    run.wax = 2;
    run.day = 6;
    run.px = 5;
    nextMap(run);
    expect([run.mapIndex, run.map.panelsX, run.px, run.py, run.day, run.bank, run.wax]).toEqual([1, 25, 0, 0, 6, 395, 2]);
    const fresh = [...run.map.tiles];
    expect(isLastMap(run)).toBe(true);
    expect(firstDayIsFree(run)).toBe(false);

    unlockNext(run, 'clipSize');
    startNextDay(run);
    earn2(run);
    tryAgain(run);
    expect([run.day, run.bank, run.wax, run.unlocked.reloadSpeed, run.unlocked.clipSize]).toEqual([6, 395, 2, 2, 0]);
    expect([...run.map.tiles]).toEqual(fresh);
  });
});

function earn2(run: ReturnType<typeof newRun>) {
  run.map.tiles.fill(2);
  scoreNight(run);
}

describe('D41 prices and D42 Map 1 locks', () => {
  it('Map 1 sells only up to level 2 of the four counter upgrades; Map 2 sells the rest', () => {
    const run = newRun();
    run.bank = 10_000;
    for (const id of ['extraScrubbers', 'scrubSpeed', 'clipSize', 'reloadSpeed'] as const) {
      expect(unlockNext(run, id)).toBe('bought');
      expect(unlockNext(run, id)).toBe('bought');
      expect(unlockNext(run, id)).toBe('locked');
      expect(run.unlocked[id]).toBe(2);
    }
    for (let i = 0; i < 3; i++) expect(unlockNext(run, 'brushPowa')).toBe('bought');
    nextMap(run);
    expect(unlockNext(run, 'scrubSpeed')).toBe('bought');
    expect(unlockNext(run, 'scrubSpeed')).toBe('bought');
    expect(unlockNext(run, 'scrubSpeed')).toBe('max-level');
    expect(dayOptions(run).scrubDuration).toBe(0.85);
  });
});

describe('D43 Map 2 starting dirt', () => {
  it('starts at -4 with filthy -10 patches, and TRY AGAIN restores the same layout', () => {
    const map = createMap(MAPS[1]);
    expect(panelRating(map, 0, 0)).toBe(-4);
    expect(panelRating(map, 11, 13)).toBe(-10); // inside the 5x5 centre patch
    expect(panelRating(map, 14, 13)).toBe(-4); // just right of it
    expect(createMap(MAPS[0]).tiles.every((v) => v === 0)).toBe(true);
  });
});

describe('D44 wave table per map', () => {
  it('Map 2 counts its own days from the first day played there, also after TRY AGAIN', () => {
    const run = newRun();
    run.day = 9;
    expect(waveForRun(run)).toEqual(WAVE_TABLE[8]);
    nextMap(run); // won on day 9
    startNextDay(run); // day 10 = Map 2 day 1
    expect(waveForRun(run)).toEqual(map2WaveForDay(1));
    for (let i = 0; i < 5; i++) startNextDay(run);
    expect(waveForRun(run).big).toBe(1); // Map 2 day 6
    tryAgain(run);
    startNextDay(run);
    expect(waveForRun(run)).toEqual(map2WaveForDay(1));
  });
});
