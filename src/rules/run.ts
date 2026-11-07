import {
  BRUSH_AOE_DEFAULT,
  BRUSH_AOE_SUPPED_UP,
  MAPS,
  UPGRADES,
  UpgradeDef,
  UpgradeId,
  WAX_PACKS,
  WaveRow,
  map2WaveForDay,
  waveForDay,
} from './config';
import { DayOptions } from './dayPhase';
import { MapState, createMap, expectedPowain } from './grid';
import { NightOptions } from './nightPhase';

export type Levels = Record<UpgradeId, number>;

// What TRY AGAIN restores (D13): the state on arrival at the current map.
export interface Checkpoint {
  bank: number;
  unlocked: Levels;
  wax: number;
  day: number;
}

// Everything that carries from one phase to the next within a play session (D24: memory only).
export interface RunState {
  mapIndex: number;
  map: MapState;
  day: number;
  // Scrubby's last panel; the next day redeploys here.
  px: number;
  py: number;
  bank: number;
  // Highest bought level per upgrade; it is always the active one (D37).
  unlocked: Levels;
  wax: number;
  // The day number of the first day played on this map (D44).
  firstMapDay: number;
  checkpoint: Checkpoint;
  // What RESET PURCHASES restores (D34): the state when the upgrade screen opened.
  shopStart: Checkpoint;
}

const noLevels = (): Levels =>
  Object.fromEntries(UPGRADES.map((u) => [u.id, 0])) as Levels;

export function newRun(): RunState {
  const run: RunState = {
    mapIndex: 0,
    map: createMap(MAPS[0]),
    day: 1,
    px: 0,
    py: 0,
    bank: 0,
    unlocked: noLevels(),
    wax: 0,
    firstMapDay: 1,
    checkpoint: undefined!,
    shopStart: undefined!,
  };
  run.checkpoint = snapshot(run);
  run.shopStart = snapshot(run);
  return run;
}

function snapshot(run: RunState): Checkpoint {
  return { bank: run.bank, unlocked: { ...run.unlocked }, wax: run.wax, day: run.day };
}

// D13: back to the map-arrival checkpoint with the map reset. On Map 1 that is the fresh game.
export function tryAgain(run: RunState): void {
  const c = run.checkpoint;
  run.map = createMap(MAPS[run.mapIndex]);
  run.px = 0;
  run.py = 0;
  run.bank = c.bank;
  run.unlocked = { ...c.unlocked };
  run.wax = c.wax;
  run.day = c.day;
  run.shopStart = snapshot(run);
}

// D34: undo every purchase made on this upgrade screen.
export function resetPurchases(run: RunState): void {
  const s = run.shopStart;
  run.bank = s.bank;
  run.unlocked = { ...s.unlocked };
  run.wax = s.wax;
}

export function hasShopChanges(run: RunState): boolean {
  const s = run.shopStart;
  return (
    run.bank !== s.bank ||
    run.wax !== s.wax ||
    UPGRADES.some((u) => run.unlocked[u.id] !== s.unlocked[u.id])
  );
}

// Map 1's checkpoint starts with the free Day 1 instead of an upgrade screen.
export function firstDayIsFree(run: RunState): boolean {
  return run.mapIndex === 0 && run.day === 1;
}

export function upgradeDef(id: UpgradeId): UpgradeDef {
  return UPGRADES.find((u) => u.id === id)!;
}

export function upgradeValue(run: RunState, id: UpgradeId): number {
  return upgradeDef(id).levels[run.unlocked[id]].value;
}

export type PurchaseResult = 'bought' | 'too-expensive' | 'max-level' | 'locked';

// D42: the highest level that can be bought on the current map.
export function maxBuyableLevel(run: RunState, id: UpgradeId): number {
  const def = upgradeDef(id);
  const top = def.levels.length - 1;
  return run.mapIndex === 0 && def.map1MaxLevel !== undefined ? Math.min(top, def.map1MaxLevel) : top;
}

// D40: no day cost, so a purchase only needs the POWA in the bank.
export function canSpend(run: RunState, cost: number): boolean {
  return run.bank >= cost;
}

// Unlock the next level (sequential); it takes effect from the next day.
export function unlockNext(run: RunState, id: UpgradeId): PurchaseResult {
  const next = run.unlocked[id] + 1;
  const level = upgradeDef(id).levels[next];
  if (!level) return 'max-level';
  if (next > maxBuyableLevel(run, id)) return 'locked';
  if (!canSpend(run, level.cost)) return 'too-expensive';
  run.bank -= level.cost;
  run.unlocked[id] = next;
  return 'bought';
}

// D22: Wax packs, repeatable.
export function buyWax(run: RunState, pack: number): PurchaseResult {
  const { charges, cost } = WAX_PACKS[pack];
  if (!canSpend(run, cost)) return 'too-expensive';
  run.bank -= cost;
  run.wax += charges;
  return 'bought';
}

// D14/D40: the next day is free; just move to the next day number.
export function startNextDay(run: RunState): void {
  run.day++;
}

// D02/D03: end of night, POWA-IN for the whole map, rounded down, into the bank.
export function scoreNight(run: RunState): number {
  const powain = expectedPowain(run.map);
  run.bank += powain;
  run.shopStart = snapshot(run);
  return powain;
}

// D23: a mid-day victory skips the night and pays the clean map once (400 on Map 1, 2,500 on Map 2).
export function claimVictory(run: RunState): number {
  return scoreNight(run);
}

export function isLastMap(run: RunState): boolean {
  return run.mapIndex === MAPS.length - 1;
}

// NEXT MAP: purchases, POWA, Wax and the day number carry over; the new map starts dirty
// with Scrubby on P(0,0), and this arrival becomes the TRY AGAIN checkpoint (D13).
export function nextMap(run: RunState): void {
  run.mapIndex++;
  run.map = createMap(MAPS[run.mapIndex]);
  run.px = 0;
  run.py = 0;
  run.firstMapDay = run.day + 1;
  run.checkpoint = snapshot(run);
  run.shopStart = snapshot(run);
}

// D44: Map 1 waves go by day number; Map 2 has its own table, counted from its first day.
export function waveForRun(run: RunState): WaveRow {
  return run.mapIndex === 0 ? waveForDay(run.day) : map2WaveForDay(run.day - run.firstMapDay + 1);
}

export function dayOptions(run: RunState): DayOptions {
  return {
    startPx: run.px,
    startPy: run.py,
    scrubMax: upgradeValue(run, 'extraScrubbers'),
    scrubDuration: upgradeValue(run, 'scrubSpeed'),
    brushPowa: upgradeValue(run, 'brushPowa'),
    aoe: upgradeValue(run, 'brushSize') ? BRUSH_AOE_SUPPED_UP : BRUSH_AOE_DEFAULT,
    bristles: upgradeValue(run, 'bristles') === 1,
    dayLength: upgradeValue(run, 'timeManipulation'),
    wax: run.wax,
    combo: upgradeValue(run, 'combo') === 1,
  };
}

export function nightOptions(run: RunState): NightOptions {
  return {
    shootMax: upgradeValue(run, 'clipSize'),
    shootDuration: upgradeValue(run, 'reloadSpeed'),
  };
}
