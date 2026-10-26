import { BRUSH_AOE_DEFAULT, BrushAoe, DEFAULT_BRUSH_POWA, DEFAULT_SCRUB_MAX, TIMERS } from './config';
import { CounterBank, createBank, spend, tickBank } from './counterBank';
import { MapState, applyBrush, inBounds } from './grid';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type MoveResult = 'moved' | 'blocked' | 'no-counter' | 'day-over';

export interface DayState {
  map: MapState;
  px: number;
  py: number;
  scrub: CounterBank;
  brushPowa: number;
  aoe: BrushAoe;
  dayLength: number;
  timeLeft: number;
  // Day 1: the clock waits for the first valid move.
  started: boolean;
  ended: boolean;
}

export interface DayOptions {
  startPx?: number;
  startPy?: number;
  scrubMax?: number;
  scrubDuration?: number;
  brushPowa?: number;
  aoe?: BrushAoe;
  dayLength?: number;
  startedImmediately?: boolean;
}

export function createDay(map: MapState, opts: DayOptions = {}): DayState {
  const dayLength = opts.dayLength ?? TIMERS.daylight;
  return {
    map,
    px: opts.startPx ?? 0,
    py: opts.startPy ?? 0,
    scrub: createBank(opts.scrubMax ?? DEFAULT_SCRUB_MAX, opts.scrubDuration ?? TIMERS.scrub),
    brushPowa: opts.brushPowa ?? DEFAULT_BRUSH_POWA,
    aoe: opts.aoe ?? BRUSH_AOE_DEFAULT,
    dayLength,
    timeLeft: dayLength,
    started: opts.startedImmediately ?? false,
    ended: false,
  };
}

const STEPS: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

// One press-once move: costs a Scrub counter and scrubs the destination panel.
// Edge moves and moves without a counter do nothing and cost nothing.
export function tryMove(day: DayState, dir: Direction): MoveResult {
  if (day.ended) return 'day-over';
  const [dx, dy] = STEPS[dir];
  const nx = day.px + dx;
  const ny = day.py + dy;
  if (!inBounds(day.map, nx, ny)) return 'blocked';
  if (!spend(day.scrub)) return 'no-counter';
  day.px = nx;
  day.py = ny;
  applyBrush(day.map, nx, ny, day.brushPowa, day.aoe);
  day.started = true;
  return 'moved';
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
