// Balance values from Clean_POWA_Reviewer_Handoff/04_Data_Tables, as amended by DECISIONS.md.
// tests/config.test.ts checks these against the CSVs so the two cannot drift apart.

export const TIMERS = {
  scrub: 3,
  shoot: 3,
  daylight: 70,
  night: 45,
} as const;

export const TILE_MIN = -10;
export const TILE_MAX = 8; // D30 (was 4)
export const TILES_PER_PANEL_SIDE = 4;

export interface MapDefinition {
  name: string;
  panelsX: number;
  panelsY: number;
}

export const MAPS: MapDefinition[] = [
  { name: 'Map 1', panelsX: 10, panelsY: 10 },
  { name: 'Map 2', panelsX: 25, panelsY: 25 },
];

// Multiplier applied to Brush POWA for each tile of the destination panel, [row][col].
export type BrushAoe = number[][];

export const BRUSH_AOE_DEFAULT: BrushAoe = [
  [0.5, 0.5, 0.5, 0.5],
  [0.5, 1, 1, 0.5],
  [0.5, 1, 1, 0.5],
  [0.5, 0.5, 0.5, 0.5],
];

export const BRUSH_AOE_SUPPED_UP: BrushAoe = [
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
];

export const DEFAULT_BRUSH_POWA = 2; // D30 (was 1)
export const DEFAULT_SCRUB_MAX = 1;
export const DEFAULT_SHOOT_MAX = 1;

// POWA added to POWAIN per panel, by panel cleanliness rating (D30: extended to +8).
export const POWA_CONVERSION: Record<number, number> = {
  [-10]: 0, [-9]: 0, [-8]: 0, [-7]: 0, [-6]: 0, [-5]: 0, [-4]: 0,
  [-3]: 0, [-2]: 0, [-1]: 0, 0: 0, 1: 0.5, 2: 1, 3: 1.5, 4: 2,
  5: 2.5, 6: 3, 7: 3.5, 8: 4,
};

// Tile colour by cleanliness level (-10..+8). D31: 0 is dusty grey, cleaning goes sage to
// Zima Blue, and everything below 0 is Mud Boy mud (warm brown to near-black).
export const TILE_COLORS: Record<number, string> = {
  8: '#5BC2E7', // Zima Blue
  7: '#50B8CC',
  6: '#4AB0B4',
  5: '#4AA9A0',
  4: '#52A28F',
  3: '#5F9A82',
  2: '#6E9077',
  1: '#7A8670',
  0: '#7D7B6A', // dust
  [-1]: '#8A5A2B', // mud
  [-2]: '#7A4E25',
  [-3]: '#6B4320',
  [-4]: '#5C391B',
  [-5]: '#4E3017',
  [-6]: '#422813',
  [-7]: '#36200F',
  [-8]: '#2B190C',
  [-9]: '#211309',
  [-10]: '#170D06',
};

// D32: Mud Boy dirt, doubled to match the D30 scale.
export const MUD_ENTER = -2; // each panel a Mud Boy spawns on or moves into
export const MUD_POP_CENTER = -4;
export const MUD_POP_NEIGHBOR = -2;

// Night timing: D06 (Mud Boy action every 3 s), D12 (2 s warning, wave 1 at t=2, then every 6 s).
export const NIGHT = {
  warning: 2,
  firstWaveAt: 2,
  waveSpacing: 6,
  mudBoyAction: 3,
  shotDamage: 1,
} as const;

// Days 2+ open with READY / SET / SCRUB!, one word per second.
export const READY_COUNTDOWN = 3;

export type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface WaveRow {
  count: number; // Mud Boys per wave (D08)
  edge: Edge; // spawn edge (D16)
  destination: Edge;
  hp: number; // D07
  waves: number;
}

// BALANCE `Mud boy Waves`: a 30-day cycle repeated for days 1-90, then the `>90` row (D21).
const EDGE_CYCLE: [Edge, Edge][] = [
  ['bottom', 'top'],
  ['left', 'right'],
  ['right', 'left'],
];

function waveCycleRow(i: number): WaveRow {
  const [edge, destination] = EDGE_CYCLE[i % 3];
  const tier = i < 12 ? 0 : i < 24 ? 1 : 2;
  const count = 3 + Math.floor((i - tier * 12) / 3);
  return { count, edge, destination, hp: 3 * (tier + 1), waves: tier + 1 };
}

export const WAVE_TABLE: WaveRow[] = Array.from({ length: 90 }, (_, d) => waveCycleRow(d % 30));
export const WAVE_AFTER_90: WaveRow = { count: 4, edge: 'bottom', destination: 'top', hp: 9, waves: 3 };

export function waveForDay(day: number): WaveRow {
  return day > 90 ? WAVE_AFTER_90 : WAVE_TABLE[day - 1];
}
