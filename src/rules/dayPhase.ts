import { BRUSH_AOE_DEFAULT, BrushAoe, COMBO, DEFAULT_BRUSH_POWA, DEFAULT_SCRUB_MAX, TILE_MAX, TILES_PER_PANEL_SIDE as SIDE, TIMERS } from './config';
import { CounterBank, createBank, spend, tickBank } from './counterBank';
import { Door, MapState, applyBrush, canStep, getTile, isFullyClean, isWaxed, openDoors, panelRating } from './grid';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type MoveResult = 'moved' | 'glided' | 'blocked' | 'no-counter' | 'day-over';

// D47: the word shown after a move. 'none' for a scrub that changed nothing or a glide without Bristles.
export type MoveFeedback = 'scrub' | 'ick' | 'slip' | 'none';

export type WaxResult = 'waxed' | 'not-eligible' | 'no-wax' | 'day-over';

export interface DayState {
  map: MapState;
  px: number;
  py: number;
  scrub: CounterBank;
  brushPowa: number;
  aoe: BrushAoe;
  // Retractable Bristles: entering a +8 panel is free and does not scrub.
  bristles: boolean;
  wax: number;
  dayLength: number;
  timeLeft: number;
  // Day 1: the clock waits for the first valid move.
  started: boolean;
  ended: boolean;
  // D15: set by the move that makes every panel +8; the day ends there.
  victory: boolean;
  // D47: feedback for the last move that happened.
  feedback: MoveFeedback;
  // D49: SCRUB! moves in a row (only counted when COMBO is owned), and the uncut Scrub timer.
  comboEnabled: boolean;
  combo: number;
  scrubBase: number;
  // D55: doors the last move opened.
  opened: Door[];
}

export interface DayOptions {
  startPx?: number;
  startPy?: number;
  scrubMax?: number;
  scrubDuration?: number;
  brushPowa?: number;
  aoe?: BrushAoe;
  bristles?: boolean;
  wax?: number;
  dayLength?: number;
  startedImmediately?: boolean;
  combo?: boolean;
}

export function createDay(map: MapState, opts: DayOptions = {}): DayState {
  const dayLength = opts.dayLength ?? TIMERS.daylight;
  const scrubBase = opts.scrubDuration ?? TIMERS.scrub;
  return {
    map,
    px: opts.startPx ?? 0,
    py: opts.startPy ?? 0,
    scrub: createBank(opts.scrubMax ?? DEFAULT_SCRUB_MAX, scrubBase),
    brushPowa: opts.brushPowa ?? DEFAULT_BRUSH_POWA,
    aoe: opts.aoe ?? BRUSH_AOE_DEFAULT,
    bristles: opts.bristles ?? false,
    wax: opts.wax ?? 0,
    dayLength,
    timeLeft: dayLength,
    started: opts.startedImmediately ?? false,
    ended: false,
    victory: false,
    feedback: 'none',
    comboEnabled: opts.combo ?? false,
    combo: 0,
    scrubBase,
    opened: [],
  };
}

function panelSum(map: MapState, px: number, py: number): number {
  let sum = 0;
  for (let ly = 0; ly < SIDE; ly++) for (let lx = 0; lx < SIDE; lx++) sum += getTile(map, px * SIDE + lx, py * SIDE + ly);
  return sum;
}

// D49: the combo sets the Scrub timer at once, including a recharge already running.
function setCombo(day: DayState, combo: number): void {
  day.combo = combo;
  day.scrub.duration = day.scrubBase * (1 - COMBO.step * Math.min(combo, COMBO.maxSteps));
}

const STEPS: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

// One press-once move: costs a Scrub counter and scrubs the destination panel.
// Edge moves and moves without a counter do nothing and cost nothing.
// Waxed panels, and +8 panels with Retractable Bristles, are entered free without scrubbing ('glided').
export function tryMove(day: DayState, dir: Direction): MoveResult {
  if (day.ended) return 'day-over';
  const [dx, dy] = STEPS[dir];
  const nx = day.px + dx;
  const ny = day.py + dy;
  // The map edge, scenery and closed doors (D55) stop the move for free.
  if (!canStep(day.map, day.px, day.py, nx, ny)) return 'blocked';
  const free = isWaxed(day.map, nx, ny) || (day.bristles && panelRating(day.map, nx, ny) >= TILE_MAX);
  if (!free && !spend(day.scrub)) return 'no-counter';
  day.px = nx;
  day.py = ny;
  day.started = true;
  day.opened = [];
  if (free) {
    day.feedback = day.bristles ? 'slip' : 'none';
  } else {
    const before = panelSum(day.map, nx, ny);
    applyBrush(day.map, nx, ny, day.brushPowa, day.aoe);
    const cleaner = panelSum(day.map, nx, ny) > before;
    day.feedback = !cleaner ? 'none' : panelRating(day.map, nx, ny) > 0 ? 'scrub' : 'ick';
    day.opened = openDoors(day.map);
    // D15/D23: checked after each scrub; victory stops the clock at once.
    if (isFullyClean(day.map)) day.victory = day.ended = true;
  }
  // D51: SLIP! keeps the combo as it is.
  if (day.comboEnabled && day.feedback !== 'slip') setCombo(day, day.feedback === 'scrub' ? day.combo + 1 : 0);
  return free ? 'glided' : 'moved';
}

// Space: wax the current panel if it is unwaxed and rated +8 (D30). Failed attempts cost nothing.
export function tryWax(day: DayState): WaxResult {
  if (day.ended) return 'day-over';
  const { map, px, py } = day;
  if (isWaxed(map, px, py) || panelRating(map, px, py) < TILE_MAX) return 'not-eligible';
  if (day.wax <= 0) return 'no-wax';
  day.wax--;
  map.waxed[py * map.panelsX + px] = 1;
  day.started = true;
  return 'waxed';
}

// Advance the day clock and the scrub recharge by dt seconds.
// D26: a recharge that would land on the frame the day ends grants nothing.
export function tickDay(day: DayState, dt: number): void {
  if (!day.started || day.ended) return;
  day.timeLeft -= dt;
  if (day.timeLeft <= 0) {
    day.timeLeft = 0;
    day.ended = true;
    return;
  }
  tickBank(day.scrub, dt);
}
