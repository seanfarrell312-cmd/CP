// Balance values from Clean_POWA_Reviewer_Handoff/04_Data_Tables, as amended by DECISIONS.md.
// tests/config.test.ts checks these against the CSVs so the two cannot drift apart.

export const TIMERS = {
  scrub: 3,
  shoot: 3,
  daylight: 70,
  night: 45,
} as const;

export const TILE_MIN = -10;
export const TILE_MAX = 4;
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

export const DEFAULT_BRUSH_POWA = 1;
export const DEFAULT_SCRUB_MAX = 1;
export const DEFAULT_SHOOT_MAX = 1;

// POWA added to POWAIN per panel, by panel cleanliness rating.
export const POWA_CONVERSION: Record<number, number> = {
  [-10]: 0, [-9]: 0, [-8]: 0, [-7]: 0, [-6]: 0, [-5]: 0, [-4]: 0,
  [-3]: 0, [-2]: 0, [-1]: 0, 0: 0, 1: 0.5, 2: 1, 3: 1.5, 4: 2,
};

// Tile colour by cleanliness level (-10..+4).
export const TILE_COLORS: Record<number, string> = {
  4: '#5BC2E7',
  3: '#59B6CE',
  2: '#56AAB5',
  1: '#549D9B',
  0: '#529182',
  [-1]: '#5D836E',
  [-2]: '#687459',
  [-3]: '#736645',
  [-4]: '#7E5830',
  [-5]: '#6F4D2A',
  [-6]: '#5F4124',
  [-7]: '#50361E',
  [-8]: '#412B18',
  [-9]: '#311F12',
  [-10]: '#22140C',
};
