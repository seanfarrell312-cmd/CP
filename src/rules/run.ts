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

// D02/D33/D37: the number on GET SCRUBBIN!, a flat cost with no maintenance.
export function dayCost(_run: RunState): number {
  return DAY_BASE_COST;
}

export function canStartDay(run: RunState): boolean {
  return run.bank >= dayCost(run);
}

export type PurchaseResult = 'bought' | 'must-retain' | 'max-level';

// D02 item 6: refused if the bank would drop below the current day cost.
export function canSpend(run: RunState, cost: number): boolean {
  return run.bank - cost >= dayCost(run);
}

// Unlock the next level (sequential); it takes effect from the next day.
export function unlockNext(run: RunState, id: UpgradeId): PurchaseResult {
  const next = run.unlocked[id] + 1;
  const level = upgradeDef(id).levels[next];
  if (!level) return 'max-level';
  if (!canSpend(run, level.cost)) return 'must-retain';
  run.bank -= level.cost;
  run.unlocked[id] = next;
  return 'bought';
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

// D02/D03: end of night, POWA-IN for the whole map, rounded down, into the bank.
export function scoreNight(run: RunState): number {
  const powain = expectedPowain(run.map);
  run.bank += powain;
  run.shopStart = snapshot(run);
  return powain;
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
  };
}

export function nightOptions(run: RunState): NightOptions {
  return {
    shootMax: upgradeValue(run, 'clipSize'),
    shootDuration: upgradeValue(run, 'reloadSpeed'),
  };
}
