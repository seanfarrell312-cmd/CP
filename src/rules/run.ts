import {
  BRUSH_AOE_DEFAULT,
  BRUSH_AOE_SUPPED_UP,
  DAY_BASE_COST,
  MAPS,
  UPGRADES,
  UpgradeDef,
  UpgradeId,
  WAX_PACKS,
} from './config';
import { DayOptions } from './dayPhase';
import { MapState, createMap, expectedPowain } from './grid';
import { NightOptions } from './nightPhase';

export type Levels = Record<UpgradeId, number>;

// What TRY AGAIN restores (D13): the state on arrival at the current map.
export interface Checkpoint {
  bank: number;
  unlocked: Levels;
  equipped: Levels;
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
  // Highest unlocked level per upgrade, and the level equipped for the next day (<= unlocked).
  unlocked: Levels;
  equipped: Levels;
  wax: number;
  checkpoint: Checkpoint;
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
    equipped: noLevels(),
    wax: 0,
    checkpoint: undefined!,
  };
  run.checkpoint = snapshot(run);
  return run;
}

function snapshot(run: RunState): Checkpoint {
  return { bank: run.bank, unlocked: { ...run.unlocked }, equipped: { ...run.equipped }, wax: run.wax, day: run.day };
}

// D13: back to the map-arrival checkpoint with the map reset. On Map 1 that is the fresh game.
export function tryAgain(run: RunState): void {
  const c = run.checkpoint;
  run.map = createMap(MAPS[run.mapIndex]);
  run.px = 0;
  run.py = 0;
  run.bank = c.bank;
  run.unlocked = { ...c.unlocked };
  run.equipped = { ...c.equipped };
  run.wax = c.wax;
  run.day = c.day;
}

// Map 1's checkpoint starts with the free Day 1 instead of an upgrade screen.
export function firstDayIsFree(run: RunState): boolean {
  return run.mapIndex === 0 && run.day === 1;
}

export function upgradeDef(id: UpgradeId): UpgradeDef {
  return UPGRADES.find((u) => u.id === id)!;
}

export function equippedValue(run: RunState, id: UpgradeId): number {
  return upgradeDef(id).levels[run.equipped[id]].value;
}

export function maintenance(run: RunState): number {
  return UPGRADES.reduce((sum, u) => sum + u.levels[run.equipped[u.id]].maintenance, 0);
}

// D02/D33: the number on GET SCRUBBIN!
export function dayCost(run: RunState): number {
  return DAY_BASE_COST + maintenance(run);
}

export function canStartDay(run: RunState): boolean {
  return run.bank >= dayCost(run);
}

export type PurchaseResult = 'bought' | 'must-retain' | 'max-level';

// D02 item 6: refused if the bank would drop below the current day cost.
export function canSpend(run: RunState, cost: number): boolean {
  return run.bank - cost >= dayCost(run);
}

// Unlock the next level (sequential) and equip it.
export function unlockNext(run: RunState, id: UpgradeId): PurchaseResult {
  const next = run.unlocked[id] + 1;
  const level = upgradeDef(id).levels[next];
  if (!level) return 'max-level';
  if (!canSpend(run, level.cost)) return 'must-retain';
  run.bank -= level.cost;
  run.unlocked[id] = next;
  run.equipped[id] = next;
  return 'bought';
}

// Equip any unlocked level, including 0 (off). Always allowed; it may turn GET SCRUBBIN! red.
export function equip(run: RunState, id: UpgradeId, level: number): boolean {
  if (level < 0 || level > run.unlocked[id]) return false;
  run.equipped[id] = level;
  return true;
}

// D22: Wax packs, repeatable, under the same retain floor as unlocks.
export function buyWax(run: RunState, pack: number): PurchaseResult {
  const { charges, cost } = WAX_PACKS[pack];
  if (!canSpend(run, cost)) return 'must-retain';
  run.bank -= cost;
  run.wax += charges;
  return 'bought';
}

// D02/D14: pay the day cost and move to the next day number.
export function startNextDay(run: RunState): boolean {
  if (!canStartDay(run)) return false;
  run.bank -= dayCost(run);
  run.day++;
  return true;
}

// D02/D03: end of night, POWAIN for the whole map, rounded down, into the bank.
export function scoreNight(run: RunState): number {
  const powain = expectedPowain(run.map);
  run.bank += powain;
  return powain;
}

export function dayOptions(run: RunState): DayOptions {
  return {
    startPx: run.px,
    startPy: run.py,
    scrubMax: equippedValue(run, 'extraScrubbers'),
    scrubDuration: equippedValue(run, 'scrubSpeed'),
    brushPowa: equippedValue(run, 'brushPowa'),
    aoe: equippedValue(run, 'brushSize') ? BRUSH_AOE_SUPPED_UP : BRUSH_AOE_DEFAULT,
    bristles: equippedValue(run, 'bristles') === 1,
    dayLength: equippedValue(run, 'timeManipulation'),
    wax: run.wax,
  };
}

export function nightOptions(run: RunState): NightOptions {
  return {
    shootMax: equippedValue(run, 'clipSize'),
    shootDuration: equippedValue(run, 'reloadSpeed'),
  };
}
