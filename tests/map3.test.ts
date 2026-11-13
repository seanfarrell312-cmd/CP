import { describe, expect, it } from 'vitest';
import { MAPS, TILE_MAX, WaveRow, map2WaveForDay } from '../src/rules/config';
import { createDay, tryMove } from '../src/rules/dayPhase';
import { MapState, applyMud, createMap, expectedPowain, isFullyClean, isPanel, panelCount, panelRating, sectionOf } from '../src/rules/grid';
import { createNight, shootAt, tickNight } from '../src/rules/nightPhase';
import { claimVictory, isLastMap, newRun, nextMap, startNextDay, tryAgain, waveForRun } from '../src/rules/run';

const map3 = () => createMap(MAPS[2]);

// Every tile of a section (or the whole map) to +8.
function cleanSection(map: MapState, s?: number) {
  for (let py = 0; py < map.panelsY; py++) {
    for (let px = 0; px < map.panelsX; px++) {
      const here = sectionOf(map, px, py);
      if (here < 0 || (s !== undefined && here !== s)) continue;
      for (let ty = py * 4; ty < py * 4 + 4; ty++) map.tiles.fill(TILE_MAX, ty * map.tilesX + px * 4, ty * map.tilesX + px * 4 + 4);
    }
  }
}

const wave = (w: Partial<WaveRow> = {}): WaveRow => ({ count: 1, edge: 'bottom', destination: 'top', hp: 3, waves: 1, ...w });

describe('D55 Map 3 layout', () => {
  it('has 140 Panels in 7 sections, all at -10 (D58), with 6 doors', () => {
    const map = map3();
    expect(MAPS[2].label).toBe('Emergency Panels');
    expect(panelCount(map)).toBe(140);
    expect(new Set([...map.section].filter((s) => s >= 0)).size).toBe(7);
    expect(panelRating(map, 3, 13)).toBe(-10);
    expect(map.doors.map((d) => [d.a, d.b])).toEqual([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]);
    expect(map.doors.every((d) => !d.open)).toBe(true);
    expect(isPanel(map, 8, 8)).toBe(false); // the building
  });

  it('scenery is never dirtied, scored or needed for SPOTLESS!', () => {
    const map = map3();
    cleanSection(map);
    expect(isFullyClean(map)).toBe(true);
    expect(expectedPowain(map)).toBe(560);
  });

  it('Scrubby starts at P(3,13) and can not walk onto scenery', () => {
    const run = newRun();
    nextMap(run);
    nextMap(run);
    expect([run.mapIndex, run.px, run.py]).toEqual([2, 3, 13]);
    expect(isLastMap(run)).toBe(true);
    const day = createDay(run.map, { startPx: 5, startPy: 13, startedImmediately: true, scrubMax: 3 });
    expect(tryMove(day, 'right')).toBe('blocked');
    expect(tryMove(day, 'down')).toBe('blocked');
    expect(day.scrub.count).toBe(3); // blocked moves are free
  });
});

describe('D55 doors', () => {
  it('a closed door blocks like the map edge; cleaning a side opens it and it stays open', () => {
    const map = map3();
    const day = createDay(map, { startPx: 6, startPy: 1, startedImmediately: true, scrubMax: 4 });
    expect(tryMove(day, 'right')).toBe('blocked');
    cleanSection(map, 0);
    // The last scrub that leaves section A all +8 opens the A|B door.
    map.tiles[0] = 7; // one corner tile short of +8
    day.px = 1;
    day.py = 0;
    expect(tryMove(day, 'left')).toBe('moved');
    expect(day.opened.map((d) => [d.a, d.b])).toEqual([[0, 1]]);
    day.px = 6;
    day.py = 1;
    expect(tryMove(day, 'right')).toBe('moved');
    expect([day.px, day.py]).toEqual([7, 1]);
    // Dirty A again: the door stays open.
    map.tiles.fill(-4, 0, 16);
    day.scrub.count = 4;
    expect(tryMove(day, 'left')).toBe('moved');
  });

  it('a section between two doors opens both', () => {
    const map = map3();
    cleanSection(map, 1);
    map.tiles[1 * 4 * map.tilesX + 7 * 4] = 7; // one tile of B short
    const day = createDay(map, { startPx: 8, startPy: 1, startedImmediately: true, brushPowa: 8 });
    expect(tryMove(day, 'left')).toBe('moved');
    expect(day.opened.map((d) => [d.a, d.b])).toEqual([[0, 1], [1, 2]]);
  });

  it('TRY AGAIN on Map 3 closes the doors and goes back to P(3,13)', () => {
    const run = newRun();
    nextMap(run);
    nextMap(run);
    run.map.doors[0].open = true;
    run.px = 9;
    tryAgain(run);
    expect(run.map.doors.every((d) => !d.open)).toBe(true);
    expect([run.px, run.py]).toEqual([3, 13]);
  });

  it('a full clean pays 560 once', () => {
    const run = newRun();
    nextMap(run);
    nextMap(run);
    run.bank = 100;
    cleanSection(run.map);
    expect(claimVictory(run)).toBe(560);
    expect(run.bank).toBe(660);
  });
});

describe('D56 Map 3 nights', () => {
  it('bottom-side Mud Boys spawn on the lowest Panel of each column', () => {
    const map = map3();
    const n = createNight(map, wave({ count: 34 }), { rng: () => 0 });
    tickNight(n, 2 + 2.01);
    const spots = n.mudBoys.map((m) => `${m.px},${m.py}`).sort();
    expect(n.mudBoys).toHaveLength(34);
    expect(spots).toContain('0,8'); // under the small left block
    expect(spots).toContain('4,13'); // bottom of the column
    expect(spots).toContain('7,2'); // corridor B
    expect(spots).toContain('33,3'); // section G
    expect(spots).toContain('6,2'); // column 6 ends with A's top block
  });

  it('right-side Mud Boys land on the column beside the building', () => {
    const map = map3();
    const n = createNight(map, wave({ count: 15, edge: 'right', destination: 'left' }), { rng: () => 0 });
    tickNight(n, 4.01);
    const spots = n.mudBoys.map((m) => `${m.px},${m.py}`);
    expect(spots).toContain('5,10');
    expect(spots).toContain('33,2');
    expect(spots).toContain('25,0');
  });

  it('a Mud Boy walking into a door pops on the Panel before it, even when the door is open', () => {
    const map = map3();
    map.doors[0].open = true;
    // P(29,2) in F starts at 0, so the pop splash next door shows.
    for (let ty = 8; ty < 12; ty++) map.tiles.fill(0, ty * map.tilesX + 29 * 4, ty * map.tilesX + 30 * 4);
    // Right-side outer Panels by row: (25,0), (33,1), (33,2), ... so this picks (33,2).
    const n = createNight(map, wave({ count: 1, edge: 'right', destination: 'left' }), { rng: () => 0.16 });
    tickNight(n, 4.01); // spawned
    const mb = n.mudBoys[0];
    expect([mb.px, mb.py]).toEqual([33, 2]);
    // Walk it left across G: it pops at x 30 instead of entering corridor F.
    for (let i = 0; i < 5; i++) tickNight(n, 3);
    expect(n.mudBoys).toHaveLength(0);
    expect(panelRating(map, 30, mb.py)).toBe(-10);
    expect(panelRating(map, 29, 2)).toBe(-2); // the pop splash still lands in F
  });

  it('a knockback into a door is a SPLAT!, and pops never dirty scenery', () => {
    const map = map3();
    const n = createNight(map, wave({ count: 1, edge: 'left', destination: 'right' }), { rng: () => 0, shootMax: 3 });
    tickNight(n, 4.01);
    const mb = n.mudBoys[0];
    expect([mb.px, mb.py]).toEqual([0, 0]);
    // Put it right of the A|B door and knock it back into the door.
    mb.px = 7;
    mb.py = 1;
    expect(shootAt(n, 7, 1)).toBe('hit');
    expect(n.events.some((e) => e.type === 'splat')).toBe(true);
    applyMud(map, 8, 8, -4); // scenery
    expect(map.tiles[8 * 4 * map.tilesX + 8 * 4]).toBe(-10);
  });

  it('Big Mud Boys spawn on 2x2 blocks inside one section', () => {
    const map = map3();
    const n = createNight(map, wave({ count: 0, big: 6, hp: 3 }), { rng: () => 0.99 });
    tickNight(n, 4.01);
    for (const m of n.mudBoys) {
      const s = sectionOf(map, m.px, m.py);
      expect(s).toBeGreaterThanOrEqual(0);
      expect([sectionOf(map, m.px + 1, m.py), sectionOf(map, m.px, m.py + 1), sectionOf(map, m.px + 1, m.py + 1)]).toEqual([s, s, s]);
    }
    expect(n.mudBoys.length).toBeGreaterThan(0);
  });

  it('Map 3 continues the Map 2 wave chart', () => {
    const run = newRun();
    run.day = 5;
    nextMap(run); // Map 2 day 1 is day 6
    run.day = 14; // Map 2 won on day 14
    nextMap(run);
    startNextDay(run); // day 15: Map 2 chart row 10
    expect(waveForRun(run)).toEqual(map2WaveForDay(10));
  });
});
