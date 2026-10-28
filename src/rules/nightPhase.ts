import { DEFAULT_SHOOT_MAX, Edge, MUD_ENTER, MUD_POP_CENTER, MUD_POP_NEIGHBOR, NIGHT, TIMERS, WaveRow } from './config';
import { CounterBank, createBank, spend, tickBank } from './counterBank';
import { MapState, applyMud, inBounds } from './grid';

export interface MudBoy {
  id: number;
  px: number;
  py: number;
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
  | { type: 'pop'; id: number; px: number; py: number }
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

export function mudBoyAt(night: NightState, px: number, py: number): MudBoy | undefined {
  return night.mudBoys.find((m) => m.px === px && m.py === py);
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

// D08/D09/D16/D25: one wave on distinct random free panels of the spawn edge, each dirtying its panel.
function spawnWave(night: NightState, timer: number): void {
  const { map, wave } = night;
  const free = edgePanels(map, wave.edge).filter(([px, py]) => !mudBoyAt(night, px, py));
  const [fx, fy] = FORWARD[wave.edge];
  for (let i = 0; i < wave.count && free.length > 0; i++) {
    const [px, py] = free.splice(Math.floor(night.rng() * free.length), 1)[0];
    const mb: MudBoy = { id: night.nextId++, px, py, hp: wave.hp, fx, fy, timer };
    night.mudBoys.push(mb);
    applyMud(map, px, py, MUD_ENTER);
    night.events.push({ type: 'spawn', id: mb.id });
  }
  night.wavesSpawned++;
}

function remove(night: NightState, mb: MudBoy): void {
  night.mudBoys.splice(night.mudBoys.indexOf(mb), 1);
}

function pop(night: NightState, mb: MudBoy): void {
  const { map } = night;
  applyMud(map, mb.px, mb.py, MUD_POP_CENTER);
  applyMud(map, mb.px + 1, mb.py, MUD_POP_NEIGHBOR);
  applyMud(map, mb.px - 1, mb.py, MUD_POP_NEIGHBOR);
  applyMud(map, mb.px, mb.py + 1, MUD_POP_NEIGHBOR);
  applyMud(map, mb.px, mb.py - 1, MUD_POP_NEIGHBOR);
  remove(night, mb);
  night.events.push({ type: 'pop', id: mb.id, px: mb.px, py: mb.py });
}

// D06/D10: move one panel forward, pushing any occupant forward first (chained, front first).
// A push leaves the pushed Mud Boy's timer and HP alone. Stepping past the destination edge
// pops the Mud Boy on the farthest panel it reached.
function moveForward(night: NightState, mb: MudBoy, dx: number, dy: number): void {
  const nx = mb.px + dx;
  const ny = mb.py + dy;
  if (!inBounds(night.map, nx, ny)) {
    pop(night, mb);
    return;
  }
  const occupant = mudBoyAt(night, nx, ny);
  if (occupant) moveForward(night, occupant, dx, dy);
  mb.px = nx;
  mb.py = ny;
  applyMud(night.map, nx, ny, MUD_ENTER);
}

// ENEMY: knockback one panel toward the spawn edge, pushing occupants back first.
// Off the map means eliminated with no pop and no dirt. Backward moves never dirty panels.
function pushBack(night: NightState, mb: MudBoy, dx: number, dy: number): void {
  const nx = mb.px + dx;
  const ny = mb.py + dy;
  if (!inBounds(night.map, nx, ny)) {
    remove(night, mb);
    night.events.push({ type: 'splat', id: mb.id, px: nx, py: ny });
    return;
  }
  const occupant = mudBoyAt(night, nx, ny);
  if (occupant) pushBack(night, occupant, dx, dy);
  mb.px = nx;
  mb.py = ny;
}

// Click on a panel: spend a Shoot counter on the Mud Boy there.
export function shootAt(night: NightState, px: number, py: number): ShotResult {
  if (night.ended) return 'night-over';
  const mb = mudBoyAt(night, px, py);
  if (!mb) return 'no-target';
  if (!spend(night.shoot)) return 'no-counter';
  night.events.push({ type: 'shot', id: mb.id });
  mb.hp -= NIGHT.shotDamage;
  if (mb.hp <= 0) pop(night, mb);
  else pushBack(night, mb, -mb.fx, -mb.fy);
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
