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

// A block of panels, by top-left panel and size.
export interface PanelRect {
  px: number;
  py: number;
  w: number;
  h: number;
}

export interface MapDefinition {
  name: string;
  // D54: the player-facing name.
  label: string;
  panelsX: number;
  panelsY: number;
  // Starting tile cleanliness (default 0), and blocks that start at TILE_MIN instead.
  start?: number;
  filthy?: PanelRect[];
  // D55: a map made of sections. Panels outside every section are scenery; doors sit where sections touch.
  sections?: PanelRect[][];
  // Where Scrubby starts (default P(0,0)).
  startPanel?: [number, number];
  // D57: drawn around the sections, and revealed on SPOTLESS! instead of the D48 fence.
  scenery?: 'facility';
}

export const MAPS: MapDefinition[] = [
  { name: 'Map 1', label: 'Power Panel 1', panelsX: 10, panelsY: 10 },
  // D43: Map 2 starts dirty, with a fixed set of filthy patches.
  {
    name: 'Map 2',
    label: 'Power Panel 2',
    panelsX: 25,
    panelsY: 25,
    start: -4,
    filthy: [
      { px: 3, py: 4, w: 4, h: 3 },
      { px: 15, py: 2, w: 5, h: 4 },
      { px: 9, py: 11, w: 5, h: 5 },
      { px: 19, py: 13, w: 4, h: 4 },
      { px: 2, py: 18, w: 5, h: 4 },
      { px: 14, py: 20, w: 3, h: 3 },
    ],
  },
  // D55: the Emergency Panels, from the owner's sketch. 140 Panels in 7 sections around the dark facility.
  // D58: they start fully filthy.
  {
    name: 'Map 3',
    label: 'Emergency Panels',
    panelsX: 37,
    panelsY: 15,
    start: -10,
    startPanel: [3, 13],
    scenery: 'facility',
    sections: [
      [
        { px: 0, py: 0, w: 7, h: 3 },
        { px: 3, py: 3, w: 3, h: 11 },
        { px: 0, py: 7, w: 3, h: 2 },
      ],
      [{ px: 7, py: 1, w: 4, h: 2 }],
      [{ px: 11, py: 0, w: 6, h: 4 }],
      [{ px: 17, py: 1, w: 4, h: 2 }],
      [{ px: 21, py: 0, w: 5, h: 4 }],
      [{ px: 26, py: 1, w: 4, h: 2 }],
      [{ px: 30, py: 1, w: 4, h: 3 }],
    ],
  },
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
  // D45: Big Mud Boys per wave (Map 2 only), with twice the small HP.
  big?: number;
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

// D44: Map 2 has its own table, by day on Map 2 (its first day is 1): the Map 1 row for that
// day with 2.5x as many small Mud Boys (rounded down), plus Big Mud Boys from Map 2 day 1 (D45/D50).
export function map2WaveForDay(mapDay: number): WaveRow {
  const base = waveForDay(mapDay);
  const big = mapDay <= 6 ? 1 : mapDay <= 12 ? 2 : 3;
  return { ...base, count: Math.floor(base.count * 2.5), big };
}

export const BIG_HP_MULTIPLIER = 2;

// D49: each SCRUB! in a row cuts the Scrub timer by `step`, up to `maxSteps` steps.
export const COMBO = { step: 0.05, maxSteps: 8 } as const;

// BALANCE `Upgrade Levels` (D01: all in the demo). Level 0 is the free default.
// `value` is what the highest bought level sets; cost is a one-time unlock. No maintenance (D37).
export type UpgradeId =
  | 'combo'
  | 'extraScrubbers'
  | 'clipSize'
  | 'bristles'
  | 'timeManipulation'
  | 'reloadSpeed'
  | 'scrubSpeed'
  | 'brushPowa'
  | 'brushSize';

export interface UpgradeLevel {
  value: number; // bristles / brush size: 0 = off/default, 1 = on/Supped UP
  cost: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  levels: UpgradeLevel[];
  // D42: highest level sold on Map 1; the rest unlock on Map 2.
  map1MaxLevel?: number;
}

const levels = (rows: [number, number][]): UpgradeLevel[] => rows.map(([value, cost]) => ({ value, cost }));

// D41: each level costs 3x the one before, starting at 3x the workbook's level 1 price.
// D46: Scrubbing Speed and Reload Speed level 1 cost 10.
export const UPGRADES: UpgradeDef[] = [
  // D49: COMBO, listed first as the obvious first buy.
  { id: 'combo', name: 'Combo', levels: levels([[0, 0], [1, 10]]) },
  { id: 'extraScrubbers', name: 'Extra Scrubbers', map1MaxLevel: 2, levels: levels([[1, 0], [2, 30], [3, 90], [4, 270]]) },
  // D36: workbook 3/2.5/2/1.5/1 scaled by 5/6.
  { id: 'scrubSpeed', name: 'Scrubbing Speed', map1MaxLevel: 2,
    levels: levels([[2.5, 0], [2.1, 10], [1.7, 45], [1.25, 135], [0.85, 405]]) },
  // D30: Brush POWA values doubled (workbook 1/2/3/4).
  { id: 'brushPowa', name: 'Brush POWA Level', levels: levels([[2, 0], [4, 30], [6, 90], [8, 270]]) },
  { id: 'brushSize', name: 'Brush Size', levels: levels([[0, 0], [1, 45]]) },
  { id: 'bristles', name: 'Retractable Bristles', levels: levels([[0, 0], [1, 45]]) },
  { id: 'timeManipulation', name: 'Time Manipulation', levels: levels([[70, 0], [80, 45], [90, 135], [100, 405]]) },
  { id: 'clipSize', name: 'Clip Size', map1MaxLevel: 2, levels: levels([[1, 0], [2, 30], [3, 90], [4, 270]]) },
  { id: 'reloadSpeed', name: 'Reload Speed', map1MaxLevel: 2, levels: levels([[3, 0], [2.5, 10], [2, 45], [1.5, 135], [1, 405]]) },
];

// D22: Wax packs, buyable any number of times.
export const WAX_PACKS = [
  { charges: 1, cost: 5 },
  { charges: 2, cost: 8 },
  { charges: 3, cost: 10 },
];


export const WAX_COLOR = '#F48FB1';
