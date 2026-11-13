import {
  BrushAoe,
  MapDefinition,
  POWA_CONVERSION,
  TILE_MAX,
  TILE_MIN,
  TILES_PER_PANEL_SIDE as SIDE,
} from './config';

// D55: where two sections touch. It opens once a section on either side is all +8, and stays open.
export interface Door {
  a: number;
  b: number;
  open: boolean;
  // The panel pairs it separates: [px, py] and the neighbour at [px + 1, py] or [px, py + 1].
  edges: [number, number, 'right' | 'down'][];
}

export interface MapState {
  panelsX: number;
  panelsY: number;
  tilesX: number;
  tilesY: number;
  // Raw tile cleanliness, row-major by global tile coordinate.
  tiles: Float64Array;
  // 1 where the panel is waxed (immune to every cleanliness change), row-major by panel.
  waxed: Uint8Array;
  // D55: section index per panel, -1 for scenery. Maps without sections are one section.
  section: Int8Array;
  doors: Door[];
}

export function createMap(def: MapDefinition, startValue = def.start ?? 0): MapState {
  const tilesX = def.panelsX * SIDE;
  const tilesY = def.panelsY * SIDE;
  const tiles = new Float64Array(tilesX * tilesY).fill(startValue);
  const waxed = new Uint8Array(def.panelsX * def.panelsY);
  for (const r of def.filthy ?? []) {
    for (let ty = r.py * SIDE; ty < (r.py + r.h) * SIDE; ty++) {
      tiles.fill(TILE_MIN, ty * tilesX + r.px * SIDE, ty * tilesX + (r.px + r.w) * SIDE);
    }
  }
  const section = new Int8Array(def.panelsX * def.panelsY).fill(def.sections ? -1 : 0);
  def.sections?.forEach((rects, s) => {
    for (const r of rects) {
      for (let py = r.py; py < r.py + r.h; py++) section.fill(s, py * def.panelsX + r.px, py * def.panelsX + r.px + r.w);
    }
  });
  const map: MapState = { panelsX: def.panelsX, panelsY: def.panelsY, tilesX, tilesY, tiles, waxed, section, doors: [] };
  map.doors = findDoors(map);
  return map;
}

function findDoors(map: MapState): Door[] {
  const doors: Door[] = [];
  const add = (px: number, py: number, dir: 'right' | 'down', nx: number, ny: number) => {
    const s1 = sectionOf(map, px, py);
    const s2 = sectionOf(map, nx, ny);
    if (s1 < 0 || s2 < 0 || s1 === s2) return;
    const [a, b] = s1 < s2 ? [s1, s2] : [s2, s1];
    let door = doors.find((d) => d.a === a && d.b === b);
    if (!door) doors.push((door = { a, b, open: false, edges: [] }));
    door.edges.push([px, py, dir]);
  };
  for (let py = 0; py < map.panelsY; py++) {
    for (let px = 0; px < map.panelsX; px++) {
      add(px, py, 'right', px + 1, py);
      add(px, py, 'down', px, py + 1);
    }
  }
  return doors;
}

// -1 off the map or on scenery.
export function sectionOf(map: MapState, px: number, py: number): number {
  return inBounds(map, px, py) ? map.section[py * map.panelsX + px] : -1;
}

// A cleanable, walkable panel (not scenery, not off the map).
export function isPanel(map: MapState, px: number, py: number): boolean {
  return sectionOf(map, px, py) >= 0;
}

export function doorBetween(map: MapState, s1: number, s2: number): Door | undefined {
  return map.doors.find((d) => (d.a === s1 && d.b === s2) || (d.a === s2 && d.b === s1));
}

// D55: Scrubby can step onto a panel of the same section, or through an open door.
export function canStep(map: MapState, px: number, py: number, nx: number, ny: number): boolean {
  const from = sectionOf(map, px, py);
  const to = sectionOf(map, nx, ny);
  if (to < 0) return false;
  return from === to || doorBetween(map, from, to)?.open === true;
}

export function isSectionClean(map: MapState, s: number): boolean {
  for (let py = 0; py < map.panelsY; py++) {
    for (let px = 0; px < map.panelsX; px++) {
      if (map.section[py * map.panelsX + px] === s && panelRating(map, px, py) < TILE_MAX) return false;
    }
  }
  return true;
}

// D55: open every closed door with a clean section on either side. Returns the doors it opened.
export function openDoors(map: MapState): Door[] {
  const opened = map.doors.filter((d) => !d.open && (isSectionClean(map, d.a) || isSectionClean(map, d.b)));
  for (const d of opened) d.open = true;
  return opened;
}

export function panelCount(map: MapState): number {
  return map.section.reduce((n, s) => n + (s >= 0 ? 1 : 0), 0);
}

export function isWaxed(map: MapState, px: number, py: number): boolean {
  return map.waxed[py * map.panelsX + px] === 1;
}

export function inBounds(map: MapState, px: number, py: number): boolean {
  return px >= 0 && py >= 0 && px < map.panelsX && py < map.panelsY;
}

export function getTile(map: MapState, tx: number, ty: number): number {
  return map.tiles[ty * map.tilesX + tx];
}

export function clampTile(value: number): number {
  return Math.min(TILE_MAX, Math.max(TILE_MIN, value));
}

// D19: clamp, then truncate toward zero.
export function colorLevel(raw: number): number {
  return Math.trunc(clampTile(raw)) || 0;
}

// Panel rating = mean of its 16 tiles, truncated toward zero.
export function panelRating(map: MapState, px: number, py: number): number {
  let sum = 0;
  for (let ly = 0; ly < SIDE; ly++) {
    for (let lx = 0; lx < SIDE; lx++) {
      sum += getTile(map, px * SIDE + lx, py * SIDE + ly);
    }
  }
  return Math.trunc(sum / (SIDE * SIDE)) || 0;
}

export function applyBrush(map: MapState, px: number, py: number, brushPowa: number, aoe: BrushAoe): void {
  if (isWaxed(map, px, py)) return;
  for (let ly = 0; ly < SIDE; ly++) {
    for (let lx = 0; lx < SIDE; lx++) {
      const i = (py * SIDE + ly) * map.tilesX + px * SIDE + lx;
      map.tiles[i] = clampTile(map.tiles[i] + brushPowa * aoe[ly][lx]);
    }
  }
}

// Mud Boy dirt (D32): adds `amount` to all 16 tiles of a panel. Off-map, scenery and waxed panels are untouched.
export function applyMud(map: MapState, px: number, py: number, amount: number): void {
  if (!isPanel(map, px, py) || isWaxed(map, px, py)) return;
  for (let ly = 0; ly < SIDE; ly++) {
    for (let lx = 0; lx < SIDE; lx++) {
      const i = (py * SIDE + ly) * map.tilesX + px * SIDE + lx;
      map.tiles[i] = clampTile(map.tiles[i] + amount);
    }
  }
}

// D03: per-panel values summed, then the total rounded down.
export function expectedPowain(map: MapState): number {
  let total = 0;
  for (let py = 0; py < map.panelsY; py++) {
    for (let px = 0; px < map.panelsX; px++) {
      if (isPanel(map, px, py)) total += POWA_CONVERSION[panelRating(map, px, py)];
    }
  }
  return Math.floor(total);
}

export function isFullyClean(map: MapState): boolean {
  for (let py = 0; py < map.panelsY; py++) {
    for (let px = 0; px < map.panelsX; px++) {
      if (isPanel(map, px, py) && panelRating(map, px, py) < TILE_MAX) return false;
    }
  }
  return true;
}
