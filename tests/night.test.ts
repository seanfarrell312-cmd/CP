import { describe, expect, it } from 'vitest';
import { MAPS, WaveRow, waveForDay } from '../src/rules/config';
import { createMap, getTile, panelRating } from '../src/rules/grid';
import { MudBoy, NightState, createNight, mudBoyAt, shootAt, tickNight } from '../src/rules/nightPhase';

const wave = (over: Partial<WaveRow> = {}): WaveRow => ({
  count: 3, edge: 'bottom', destination: 'top', hp: 3, waves: 1, ...over,
});

// Deterministic rng: always picks the first free edge panel.
const night = (w: WaveRow = wave()) => createNight(createMap(MAPS[0]), w, { rng: () => 0 });

// Place a Mud Boy by hand, as a bottom→top walker.
function place(n: NightState, px: number, py: number, hp = 3): MudBoy {
  const mb: MudBoy = { id: n.nextId++, px, py, hp, fx: 0, fy: -1, timer: 0 };
  n.mudBoys.push(mb);
  return mb;
}

// Skip the warning and start the clock with no waves left to spawn.
function running(w: WaveRow = wave()): NightState {
  const n = night(w);
  n.warningLeft = 0;
  n.wavesSpawned = w.waves;
  return n;
}

const pos = (m: MudBoy) => [m.px, m.py];

describe('night timing', () => {
  it('D12: 2 s warning with the clock paused, wave 1 at t=2, then every 6 s', () => {
    const n = night(wave({ waves: 3 }));
    tickNight(n, 2);
    expect(n.timeLeft).toBe(45);
    expect(n.mudBoys.length).toBe(0);
    tickNight(n, 1.5);
    expect(n.mudBoys.length).toBe(0);
    tickNight(n, 0.5);
    expect(n.wavesSpawned).toBe(1);
    tickNight(n, 5.5);
    expect(n.wavesSpawned).toBe(1);
    tickNight(n, 0.5);
    expect(n.wavesSpawned).toBe(2);
    tickNight(n, 6);
    expect(n.wavesSpawned).toBe(3);
  });

  it('D11: clearing the screen brings the next wave forward; clearing the last ends the night', () => {
    const n = night(wave({ count: 1, hp: 1, waves: 3 }));
    tickNight(n, 2);
    tickNight(n, 4); // wave 1 at t=2, now t=4
    expect(n.wavesSpawned).toBe(1);
    const [a] = n.mudBoys;
    expect(shootAt(n, a.px, a.py)).toBe('hit');
    expect(n.wavesSpawned).toBe(2); // at once
    tickNight(n, 3); // reload
    const [b] = n.mudBoys;
    shootAt(n, b.px, b.py);
    expect(n.wavesSpawned).toBe(3);
    tickNight(n, 3);
    const [c] = n.mudBoys;
    shootAt(n, c.px, c.py);
    expect(n.ended).toBe(true);
    expect(n.timeLeft).toBeGreaterThan(30);
  });

  it('night ends at 45 s and any Mud Boys left leave the map', () => {
    const n = night();
    tickNight(n, 2);
    for (let i = 0; i < 45; i++) tickNight(n, 1);
    expect(n.ended).toBe(true);
    expect(n.mudBoys.length).toBe(0);
  });
});

describe('spawning', () => {
  it('D09/D16/D25: distinct panels on the spawn edge, each dirtied to -2 (D32)', () => {
    const n = createNight(createMap(MAPS[0]), wave({ count: 6 }));
    tickNight(n, 2);
    tickNight(n, 2);
    expect(n.mudBoys.length).toBe(6);
    expect(n.mudBoys.every((m) => m.py === 9)).toBe(true);
    expect(new Set(n.mudBoys.map((m) => m.px)).size).toBe(6);
    for (const m of n.mudBoys) expect(panelRating(n.map, m.px, m.py)).toBe(-2);
  });

  it('left and right spawns walk inward', () => {
    for (const [edge, x, step] of [['left', 0, 1], ['right', 9, -1]] as const) {
      const n = night(wave({ edge, count: 1 }));
      tickNight(n, 2);
      tickNight(n, 2);
      const [m] = n.mudBoys;
      expect(m.px).toBe(x);
      tickNight(n, 3);
      expect(m.px).toBe(x + step);
    }
  });

  it('D21: lookups for days 90, 91 and 120', () => {
    expect(waveForDay(90)).toMatchObject({ edge: 'right', destination: 'left' });
    for (const d of [91, 120]) expect(waveForDay(d)).toEqual(wave({ count: 4, hp: 9, waves: 3 }));
  });
});

describe('Mud Boy movement', () => {
  it('D06: one panel every 3 s, each entered panel at -2', () => {
    const n = running();
    const m = place(n, 4, 9);
    for (const y of [8, 7, 6]) {
      tickNight(n, 3);
      expect(m.py).toBe(y);
      expect(panelRating(n.map, 4, y)).toBe(-2);
    }
  });

  it('D10: forward push into an occupied panel', () => {
    const n = running();
    const a = place(n, 3, 5);
    const b = place(n, 3, 6);
    a.timer = -10; // only B acts
    b.timer = 2.5;
    tickNight(n, 0.5);
    expect(pos(a)).toEqual([3, 4]);
    expect(pos(b)).toEqual([3, 5]);
    expect(panelRating(n.map, 3, 4)).toBe(-2);
    expect(panelRating(n.map, 3, 5)).toBe(-2);
  });

  it('D10: a push off the destination edge pops the pushed Mud Boy', () => {
    const n = running();
    const a = place(n, 3, 0);
    const b = place(n, 3, 1);
    a.timer = -10;
    b.timer = 2.5;
    tickNight(n, 0.5);
    expect(n.mudBoys).toEqual([b]);
    expect(pos(b)).toEqual([3, 0]);
    expect(panelRating(n.map, 3, 0)).toBe(-6); // pop -4, then B's entry -2
  });

  it('stepping past the far edge pops on the last panel reached (D32 amounts)', () => {
    const n = running();
    n.map.tiles.fill(6);
    place(n, 5, 0);
    tickNight(n, 3);
    expect(n.mudBoys.length).toBe(0);
    expect(panelRating(n.map, 5, 0)).toBe(2);
    expect(panelRating(n.map, 4, 0)).toBe(4);
    expect(panelRating(n.map, 6, 0)).toBe(4);
    expect(panelRating(n.map, 5, 1)).toBe(4);
    expect(panelRating(n.map, 5, 2)).toBe(6);
  });

  it('wax protects a panel from Mud Boy dirt', () => {
    const n = running();
    n.map.waxed[8 * 10 + 4] = 1;
    place(n, 4, 9);
    tickNight(n, 3);
    expect(panelRating(n.map, 4, 8)).toBe(0);
  });
});

describe('shooting', () => {
  it('a hit costs a counter, removes 1 HP and knocks back without dirt', () => {
    const n = running();
    const m = place(n, 4, 5);
    expect(shootAt(n, 4, 5)).toBe('hit');
    expect(m.hp).toBe(2);
    expect(pos(m)).toEqual([4, 6]);
    expect(panelRating(n.map, 4, 6)).toBe(0);
    expect(shootAt(n, 4, 6)).toBe('no-counter');
    expect(m.hp).toBe(2);
    expect(shootAt(n, 0, 0)).toBe('no-target');
  });

  it('D07: 9 HP survives 8 shots and pops on the 9th', () => {
    const n = running();
    const m = place(n, 4, 0, 9);
    n.shoot.max = n.shoot.count = 9;
    for (let i = 0; i < 8; i++) shootAt(n, m.px, m.py);
    expect(m.hp).toBe(1);
    expect(pos(m)).toEqual([4, 8]);
    shootAt(n, m.px, m.py);
    expect(n.mudBoys.length).toBe(0);
    expect(panelRating(n.map, 4, 8)).toBe(-4);
    expect(panelRating(n.map, 4, 9)).toBe(-2);
  });

  it('knockback off the spawn edge is a SPLAT: no pop, no dirt', () => {
    const n = running();
    place(n, 2, 9);
    shootAt(n, 2, 9);
    expect(n.mudBoys.length).toBe(0);
    expect(n.events).toContainEqual({ type: 'splat', id: 1, px: 2, py: 10 });
    expect(getTile(n.map, 8, 36)).toBe(0);
  });

  it('knockback chains into the Mud Boy behind, which keeps its HP until it falls off', () => {
    const n = running();
    const a = place(n, 2, 8);
    const b = place(n, 2, 9);
    shootAt(n, 2, 8);
    expect(n.mudBoys).toEqual([a]);
    expect(pos(a)).toEqual([2, 9]);
    expect(n.events.some((e) => e.type === 'splat' && e.id === b.id)).toBe(true);
  });

  it('the Reload timer brings a counter back after 3 s', () => {
    const n = running();
    place(n, 4, 2, 9);
    shootAt(n, 4, 2);
    tickNight(n, 2.5);
    expect(n.shoot.count).toBe(0);
    tickNight(n, 0.5);
    expect(n.shoot.count).toBe(1);
    expect(mudBoyAt(n, 4, 2)).toBeDefined(); // knocked to 3, walked back to 2
  });
});
