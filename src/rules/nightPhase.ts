import {
  BIG_HP_MULTIPLIER,
  DEFAULT_SHOOT_MAX,
  Edge,
  MUD_ENTER,
  MUD_POP_CENTER,
  MUD_POP_NEIGHBOR,
  NIGHT,
  TIMERS,
  WaveRow,
} from './config';
import { CounterBank, createBank, spend, tickBank } from './counterBank';
import { MapState, applyMud, inBounds } from './grid';

export interface MudBoy {
  id: number;
  // Top-left panel; a Big Mud Boy (size 2, D45) covers a 2x2 block from here.
  px: number;
  py: number;
  size: 1 | 2;
  hp: number;
  // Forward step toward the destination edge.
  fx: number;
  fy: number;
  // Seconds into the current 3 s forward-action cycle (D06).
  timer: number;
}

// What happened this tick, for the scene's effects. Rules never wait on these.
export type NightEvent =
  | { type: 'spawn'; id: number }
  | { type: 'pop'; id: number; px: number; py: number; size: 1 | 2 }
  // Pushed backward off the map: no pop, no dirt. px/py is the off-map coordinate.
  | { type: 'splat'; id: number; px: number; py: number }
  | { type: 'shot'; id: number };

export type ShotResult = 'hit' | 'no-counter' | 'no-target' | 'night-over';

export interface NightState {
  map: MapState;
  wave: WaveRow;
  shoot: CounterBank;
  nightLength: number;
  timeLeft: number;
  // D12: the HERE THEY COME! warning runs with the Night clock paused.
  warningLeft: number;
  mudBoys: MudBoy[];
  wavesSpawned: number;
  // Night-clock time of the next queued wave.
  nextWaveAt: number;
  ended: boolean;
  events: NightEvent[];
  nextId: number;
  rng: () => number;
}

export interface NightOptions {
  shootMax?: number;
  shootDuration?: number;
  nightLength?: number;
  rng?: () => number;
}

export function createNight(map: MapState, wave: WaveRow, opts: NightOptions = {}): NightState {
  const nightLength = opts.nightLength ?? TIMERS.night;
  return {
    map,
    wave,
    shoot: createBank(opts.shootMax ?? DEFAULT_SHOOT_MAX, opts.shootDuration ?? TIMERS.shoot),
    nightLength,
    timeLeft: nightLength,
    warningLeft: NIGHT.warning,
    mudBoys: [],
    wavesSpawned: 0,
    nextWaveAt: NIGHT.firstWaveAt,
    ended: false,
    events: [],
    nextId: 1,
    rng: opts.rng ?? Math.random,
  };
}

export function nightClock(night: NightState): number {
  return night.nightLength - night.timeLeft;
}

const covers = (m: MudBoy, px: number, py: number) =>
  px >= m.px && px < m.px + m.size && py >= m.py && py < m.py + m.size;

export function mudBoyAt(night: NightState, px: number, py: number): MudBoy | undefined {
  return night.mudBoys.find((m) => covers(m, px, py));
}

// The panels of a size x size block from (px, py).
function block(px: number, py: number, size: number): [number, number][] {
  const out: [number, number][] = [];
  for (let y = py; y < py + size; y++) for (let x = px; x < px + size; x++) out.push([x, y]);
  return out;
}

const FORWARD: Record<Edge, [number, number]> = {
  bottom: [0, -1],
  top: [0, 1],
  left: [1, 0],
  right: [-1, 0],
};

function edgePanels(map: MapState, edge: Edge): [number, number][] {
  const panels: [number, number][] = [];
  if (edge === 'top' || edge === 'bottom') {
    const py = edge === 'top' ? 0 : map.panelsY - 1;
    for (let px = 0; px < map.panelsX; px++) panels.push([px, py]);
  } else {
    const px = edge === 'left' ? 0 : map.panelsX - 1;
    for (let py = 0; py < map.panelsY; py++) panels.push([px, py]);
  }
  return panels;
}

// Top-left corners of the 2x2 blocks flush with an edge.
function edgeBlocks(map: MapState, edge: Edge): [number, number][] {
  const out: [number, number][] = [];
  if (edge === 'top' || edge === 'bottom') {
    const py = edge === 'top' ? 0 : map.panelsY - 2;
    for (let px = 0; px <= map.panelsX - 2; px++) out.push([px, py]);
  } else {
    const px = edge === 'left' ? 0 : map.panelsX - 2;
    for (let py = 0; py <= map.panelsY - 2; py++) out.push([px, py]);
  }
  return out;
}

function addMudBoy(night: NightState, px: number, py: number, size: 1 | 2, hp: number, timer: number): void {
  const [fx, fy] = FORWARD[night.wave.edge];
  const mb: MudBoy = { id: night.nextId++, px, py, size, hp, fx, fy, timer };
  night.mudBoys.push(mb);
  for (const [x, y] of block(px, py, size)) applyMud(night.map, x, y, MUD_ENTER);
  night.events.push({ type: 'spawn', id: mb.id });
}

// D08/D09/D16/D25: one wave on distinct random free panels of the spawn edge, each dirtying its panels.
// D45: Big Mud Boys take free 2x2 blocks on the edge first, then the small ones fill free edge panels.
function spawnWave(night: NightState, timer: number): void {
  const { map, wave } = night;
  for (let i = 0; i < (wave.big ?? 0); i++) {
    const open = edgeBlocks(map, wave.edge).filter(([px, py]) =>
      block(px, py, 2).every(([x, y]) => !mudBoyAt(night, x, y)),
    );
    if (open.length === 0) break;
    const [px, py] = open[Math.floor(night.rng() * open.length)];
    addMudBoy(night, px, py, 2, wave.hp * BIG_HP_MULTIPLIER, timer);
  }
  const free = edgePanels(map, wave.edge).filter(([px, py]) => !mudBoyAt(night, px, py));
  for (let i = 0; i < wave.count && free.length > 0; i++) {
    const [px, py] = free.splice(Math.floor(night.rng() * free.length), 1)[0];
    addMudBoy(night, px, py, 1, wave.hp, timer);
  }
  night.wavesSpawned++;
}

function remove(night: NightState, mb: MudBoy): void {
  night.mudBoys.splice(night.mudBoys.indexOf(mb), 1);
}

// Its own panels take MUD_POP_CENTER, the panels touching its sides MUD_POP_NEIGHBOR (D45: scaled to 2x2).
function pop(night: NightState, mb: MudBoy): void {
  const { map } = night;
  const { px, py, size } = mb;
  for (const [x, y] of block(px, py, size)) applyMud(map, x, y, MUD_POP_CENTER);
  for (let i = 0; i < size; i++) {
    applyMud(map, px + i, py - 1, MUD_POP_NEIGHBOR);
    applyMud(map, px + i, py + size, MUD_POP_NEIGHBOR);
    applyMud(map, px - 1, py + i, MUD_POP_NEIGHBOR);
    applyMud(map, px + size, py + i, MUD_POP_NEIGHBOR);
  }
  remove(night, mb);
  night.events.push({ type: 'pop', id: mb.id, px, py, size });
}

// D06/D10: move one panel forward, pushing any small occupant forward first (chained, front first).
// A push leaves the pushed Mud Boy's timer and HP alone. Stepping past the destination edge
// pops the Mud Boy on the farthest panel it reached. D45: a Big Mud Boy can't be pushed, so a
// small one behind it waits. Returns false when the Mud Boy could not get out of the way.
function moveForward(night: NightState, mb: MudBoy, dx: number, dy: number): boolean {
  if (mb.size === 2) return moveBigForward(night, mb, dx, dy);
  const nx = mb.px + dx;
  const ny = mb.py + dy;
  if (!inBounds(night.map, nx, ny)) {
    pop(night, mb);
    return true;
  }
  const occupant = mudBoyAt(night, nx, ny);
  if (occupant && (occupant.size === 2 || !moveForward(night, occupant, dx, dy))) return false;
  mb.px = nx;
  mb.py = ny;
  applyMud(night.map, nx, ny, MUD_ENTER);
  return true;
}

// D45: a Big Mud Boy jumps 2 panels into a fresh 2x2 block, dirtying all 4. Small Mud Boys in
// that block are pushed forward until clear of it; another Big Mud Boy there blocks the jump.
// A jump that would leave the map pops it where it stands.
function moveBigForward(night: NightState, mb: MudBoy, dx: number, dy: number): boolean {
  const nx = mb.px + 2 * dx;
  const ny = mb.py + 2 * dy;
  const target = block(nx, ny, 2);
  if (!target.every(([x, y]) => inBounds(night.map, x, y))) {
    pop(night, mb);
    return true;
  }
  const inTarget = (m: MudBoy) => night.mudBoys.includes(m) && target.some(([x, y]) => covers(m, x, y));
  const occupants = night.mudBoys.filter((m) => m !== mb && inTarget(m));
  if (occupants.some((m) => m.size === 2)) return false;
  // Front-most first, so each push has room.
  occupants.sort((a, b) => (b.px - a.px) * dx + (b.py - a.py) * dy);
  for (const m of occupants) {
    while (inTarget(m)) if (!moveForward(night, m, dx, dy)) return false;
  }
  mb.px = nx;
  mb.py = ny;
  for (const [x, y] of target) applyMud(night.map, x, y, MUD_ENTER);
  return true;
}

// ENEMY: knockback one panel toward the spawn edge, pushing small occupants back first.
// Off the map means eliminated with no pop and no dirt. Backward moves never dirty panels.
// D45: a Big Mud Boy behind it can't be pushed, so the knockback is blocked.
function pushBack(night: NightState, mb: MudBoy, dx: number, dy: number): boolean {
  const nx = mb.px + dx;
  const ny = mb.py + dy;
  if (!inBounds(night.map, nx, ny)) {
    remove(night, mb);
    night.events.push({ type: 'splat', id: mb.id, px: nx, py: ny });
    return true;
  }
  const occupant = mudBoyAt(night, nx, ny);
  if (occupant && (occupant.size === 2 || !pushBack(night, occupant, dx, dy))) return false;
  mb.px = nx;
  mb.py = ny;
  return true;
}

// Click on a panel: spend a Shoot counter on the Mud Boy there (any of a Big Mud Boy's 4 panels).
export function shootAt(night: NightState, px: number, py: number): ShotResult {
  if (night.ended) return 'night-over';
  const mb = mudBoyAt(night, px, py);
  if (!mb) return 'no-target';
  if (!spend(night.shoot)) return 'no-counter';
  night.events.push({ type: 'shot', id: mb.id });
  mb.hp -= NIGHT.shotDamage;
  if (mb.hp <= 0) pop(night, mb);
  else if (mb.size === 1) pushBack(night, mb, -mb.fx, -mb.fy); // D45: hits never move a Big Mud Boy
  settle(night, nightClock(night));
  return 'hit';
}

export function tickNight(night: NightState, dt: number): void {
  if (night.ended) return;
  if (night.warningLeft > 0) {
    night.warningLeft -= dt;
    if (night.warningLeft > 0) return;
    dt = -night.warningLeft;
    night.warningLeft = 0;
  }

  night.timeLeft -= dt;
  if (night.timeLeft <= 0) {
    // D26: nothing granted or moved on the frame the night ends; remaining Mud Boys leave.
    night.timeLeft = 0;
    night.ended = true;
    night.mudBoys = [];
    return;
  }
  const clock = nightClock(night);

  // Forward actions, oldest Mud Boy first. Copy: pops remove from the list.
  for (const mb of [...night.mudBoys]) {
    mb.timer += dt;
    while (mb.timer >= NIGHT.mudBoyAction && night.mudBoys.includes(mb)) {
      mb.timer -= NIGHT.mudBoyAction;
      moveForward(night, mb, mb.fx, mb.fy);
    }
  }

  // Scheduled waves (D12), timed from their exact spawn moment.
  while (night.wavesSpawned < night.wave.waves && clock >= night.nextWaveAt) {
    spawnWave(night, clock - night.nextWaveAt);
    night.nextWaveAt += NIGHT.waveSpacing;
  }

  settle(night, clock);
  tickBank(night.shoot, dt);
}

// D11: an empty map brings the next queued wave forward; with none queued the night is won.
function settle(night: NightState, clock: number): void {
  if (night.mudBoys.length > 0 || night.wavesSpawned === 0) return;
  if (night.wavesSpawned < night.wave.waves) {
    spawnWave(night, 0);
    night.nextWaveAt = clock + NIGHT.waveSpacing;
  } else {
    night.ended = true;
  }
}
