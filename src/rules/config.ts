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

// Tile colour by cleanliness level (-10..+8). D30: 0 is dark mud so a fresh map looks dirty,
// and each step up is a clearly different shade.
export const TILE_COLORS: Record<number, string> = {
  8: '#5BC2E7', // Zima Blue
  7: '#4FB3C4',
  6: '#45A39A',
  5: '#4F9A6E',
  4: '#6F8A4A',
  3: '#8C7A3A',
  2: '#8A5E2E',
  1: '#6B4423',
  0: '#4A2E17', // dark mud
  [-1]: '#442A15',
  [-2]: '#3F2713',
  [-3]: '#392312',
  [-4]: '#342010',
  [-5]: '#2E1C0E',
  [-6]: '#28180C',
  [-7]: '#23150A',
  [-8]: '#1D1109',
  [-9]: '#180E07',
  [-10]: '#120A05',
};
