import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/rules/config';
import { createBank, rechargeProgress, spend, tickBank } from '../src/rules/counterBank';
import { createDay, tickDay, tryMove } from '../src/rules/dayPhase';
import { colorLevel, createMap, expectedPowain, getTile, isFullyClean, panelRating } from '../src/rules/grid';

const map1 = () => createMap(MAPS[0]);

describe('grid', () => {
  it('Map 1 is 10x10 panels, 40x40 tiles, all 0', () => {
    const m = map1();
    expect([m.panelsX, m.panelsY, m.tilesX, m.tilesY]).toEqual([10, 10, 40, 40]);
    expect(m.tiles.every((v) => v === 0)).toBe(true);
  });

  it('D19: tile colour level clamps then truncates toward zero', () => {
    expect([-0.5, -1.7, 0.5, 1.7, 9, -12].map(colorLevel)).toEqual([0, -1, 0, 1, 8, -10]);
  });

  it('D03: expected POWAIN sums panel values then rounds down', () => {
    const m = map1();
    const setPanel = (px: number, v: number) => {
      for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) m.tiles[ty * m.tilesX + px * 4 + tx] = v;
    };
    setPanel(0, 1);
    expect(expectedPowain(m)).toBe(0); // 0.5 → 0
    setPanel(1, 3);
    setPanel(2, 4);
    expect(expectedPowain(m)).toBe(4); // 0.5 + 1.5 + 2
    setPanel(3, 8);
    expect(expectedPowain(m)).toBe(8); // + 4 for the +8 panel (D30)
    m.tiles.fill(4);
    expect(isFullyClean(m)).toBe(false); // D30: fully clean is +8
    m.tiles.fill(8);
    expect(isFullyClean(m)).toBe(true);
    expect(expectedPowain(m)).toBe(400);
  });
});

describe('counter bank (D04/D35)', () => {
  it('max 4: one completed timer refills the whole bank, then stops', () => {
    const b = createBank(4, 3);
    spend(b);
    spend(b);
    spend(b);
    expect(b.count).toBe(1);
    tickBank(b, 2.9);
    expect(b.count).toBe(1);
    tickBank(b, 0.1);
    expect(b.count).toBe(4);
    tickBank(b, 10);
    expect(b.count).toBe(4);
    expect(rechargeProgress(b)).toBe(0);
  });

  it('max 1: spent counter returns after 3 s', () => {
    const b = createBank(1, 3);
    expect(spend(b)).toBe(true);
    expect(spend(b)).toBe(false);
    tickBank(b, 2.9);
    expect(b.count).toBe(0);
    tickBank(b, 0.1);
    expect(b.count).toBe(1);
  });
});

describe('day phase', () => {
  it('scenario 3: W/A at P(0,0) do nothing and do not start the clock; S scrubs P(0,1)', () => {
    const day = createDay(map1());
    expect(tryMove(day, 'up')).toBe('blocked');
    expect(tryMove(day, 'left')).toBe('blocked');
    tickDay(day, 5);
    expect(day.started).toBe(false);
    expect(day.timeLeft).toBe(70);
    expect(day.scrub.count).toBe(1);

    expect(tryMove(day, 'down')).toBe('moved');
    expect([day.px, day.py]).toEqual([0, 1]);
    expect(day.started).toBe(true);
    expect(day.scrub.count).toBe(0);
    expect(panelRating(day.map, 0, 0)).toBe(0);
  });

  it('D30: default brush 2 gives centre 2 / border 1, rating 1, then 2 after a second pass', () => {
    const day = createDay(map1());
    tryMove(day, 'down');
    const m = day.map;
    expect(getTile(m, 1, 5)).toBe(2);
    expect(getTile(m, 0, 4)).toBe(1);
    expect(panelRating(m, 0, 1)).toBe(1);
    expect(expectedPowain(m)).toBe(0); // 0.5 rounds down
    tickDay(day, 3);
    tryMove(day, 'up');
    tickDay(day, 3);
    tryMove(day, 'down');
    expect(panelRating(m, 0, 1)).toBe(2);
    expect(expectedPowain(m)).toBe(1); // P(0,1) 1 + P(0,0) 0.5 = 1.5, rounded down
  });

  it('D30: a 24-move day visiting a new panel each move earns 12 POWA', () => {
    const day = createDay(map1());
    // Snake along the rows: 23 moves right/down plus the first, all on fresh panels.
    const path: ('right' | 'down' | 'left')[] = [];
    for (let i = 0; i < 9; i++) path.push('right');
    path.push('down');
    for (let i = 0; i < 9; i++) path.push('left');
    path.push('down', 'right', 'right', 'right', 'right');
    expect(path.length).toBe(24);
    // Moves at t = 0, 3, ..., 69 s.
    path.forEach((dir, i) => {
      if (i > 0) tickDay(day, 3);
      expect(tryMove(day, dir)).toBe('moved');
    });
    expect(day.ended).toBe(false);
    expect(expectedPowain(day.map)).toBe(12);
  });

  it('cannot move without a scrub counter', () => {
    const day = createDay(map1());
    tryMove(day, 'down');
    expect(tryMove(day, 'down')).toBe('no-counter');
    expect([day.px, day.py]).toEqual([0, 1]);
  });

  it('D26: day ends at 70 s and a recharge landing on that frame grants nothing', () => {
    const day = createDay(map1());
    tryMove(day, 'down');
    tickDay(day, 69);
    expect(day.ended).toBe(false);
    expect(day.scrub.count).toBe(1);
    tryMove(day, 'down');
    tickDay(day, 1);
    expect(day.ended).toBe(true);
    expect(day.timeLeft).toBe(0);
    expect(day.scrub.count).toBe(0);
    expect(tryMove(day, 'down')).toBe('day-over');
  });

  it('tiles clamp at +8', () => {
    const day = createDay(map1(), { brushPowa: 8, startedImmediately: true });
    for (let i = 0; i < 3; i++) {
      tryMove(day, 'right');
      tickDay(day, 3);
      tryMove(day, 'left');
      tickDay(day, 3);
    }
    expect(Math.max(...day.map.tiles)).toBe(8);
  });
});

describe('D35 refill to max', () => {
  it('spending during a running timer does not restart it', () => {
    const b = createBank(4, 3);
    spend(b);
    tickBank(b, 2);
    spend(b);
    spend(b);
    tickBank(b, 1);
    expect(b.count).toBe(4);
  });
});
