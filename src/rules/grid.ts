import {
  BrushAoe,
  MapDefinition,
  POWA_CONVERSION,
  TILE_MAX,
  TILE_MIN,
  TILES_PER_PANEL_SIDE as SIDE,
} from './config';

export interface MapState {
  panelsX: number;
  panelsY: number;
  tilesX: number;
  tilesY: number;
  // Raw tile cleanliness, row-major by global tile coordinate.
  tiles: Float64Array;
  // 1 where the panel is waxed (immune to every cleanliness change), row-major by panel.
  waxed: Uint8Array;
}

export function createMap(def: MapDefinition, startValue = 0): MapState {
  const tilesX = def.panelsX * SIDE;
  const tilesY = def.panelsY * SIDE;
  const tiles = new Float64Array(tilesX * tilesY).fill(startValue);
  const waxed = new Uint8Array(def.panelsX * def.panelsY);
  return { panelsX: def.panelsX, panelsY: def.panelsY, tilesX, tilesY, tiles, waxed };
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

// Mud Boy dirt (D32): adds `amount` to all 16 tiles of a panel. Off-map and waxed panels are untouched.
export function applyMud(map: MapState, px: number, py: number, amount: number): void {
  if (!inBounds(map, px, py) || isWaxed(map, px, py)) return;
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
      total += POWA_CONVERSION[panelRating(map, px, py)];
    }
  }
  return Math.floor(total);
}

export function isFullyClean(map: MapState): boolean {
  for (let py = 0; py < map.panelsY; py++) {
    for (let px = 0; px < map.panelsX; px++) {
      if (panelRating(map, px, py) < TILE_MAX) return false;
    }
  }
  return true;
}
