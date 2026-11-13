import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/rules/config';
import { createDay, tickDay, tryMove } from '../src/rules/dayPhase';
import { createNight, tickNight } from '../src/rules/nightPhase';
import {
  claimVictory,
  firstDayIsFree,
  needsDayTutorial,
  needsNightTutorial,
  newRun,
  nextMap,
  startNextDay,
  tryAgain,
  waveForRun,
} from '../src/rules/run';
import { DialogCursor, markSeen, wasSeen } from '../src/story/dialog';
import { SCRIPT } from '../src/story/script';

describe('D53 dialog cursor', () => {
  it('one click finishes the typing line, the next advances, the last ends once', () => {
    const c = new DialogCursor(['Hello?', 'Scrubby?'], 10);
    c.tick(0.3);
    expect([c.text, c.typing]).toEqual(['Hel', true]);
    expect(c.click()).toBe('finished-line');
    expect([c.text, c.index]).toEqual(['Hello?', 0]);
    expect(c.click()).toBe('advanced');
    expect([c.text, c.index, c.isLast]).toEqual(['', 1, true]);
    expect(c.click()).toBe('finished-line');
    expect(c.click()).toBe('done');
    expect(c.click()).toBe('ignored');
    expect(c.done).toBe(true);
  });

  it('typing stops at the end of the line and never runs into the next one', () => {
    const c = new DialogCursor(['Hi', 'There'], 10);
    c.tick(5);
    expect([c.text, c.typing, c.index]).toEqual(['Hi', false, 0]);
  });

  it('SKIP ends at once, and only once', () => {
    const c = new DialogCursor(['a', 'b', 'c']);
    expect(c.skip()).toBe('done');
    expect(c.skip()).toBe('ignored');
    expect(c.click()).toBe('ignored');
  });

  it('seen flags are kept in memory for the session', () => {
    expect(wasSeen('test.scene')).toBe(false);
    markSeen('test.scene');
    expect(wasSeen('test.scene')).toBe(true);
  });
});

describe('D53 script', () => {
  it('has the authored number of entries per scene', () => {
    expect(SCRIPT['intro.supervisorBoot']).toHaveLength(8);
    expect(SCRIPT['S01.dayTutorial']).toHaveLength(5);
    expect(SCRIPT['S01.nightTutorial']).toHaveLength(7);
    expect(SCRIPT['S01.supervisorOutro']).toHaveLength(6);
    expect(SCRIPT['S02.supervisorOutro']).toHaveLength(9);
  });

  it('D54: the maps show as Power Panels', () => {
    expect(MAPS.map((m) => m.label)).toEqual(['Power Panel 1', 'Power Panel 2']);
  });
});

describe('D53 onboarding once per new game', () => {
  it('shows on a new game, not after TRY AGAIN, and again on a fresh game', () => {
    const run = newRun();
    expect([needsDayTutorial(run), needsNightTutorial(run)]).toEqual([true, true]);
    run.onboarded.day = true;
    run.onboarded.night = true;
    startNextDay(run);
    tryAgain(run);
    expect(firstDayIsFree(run)).toBe(true); // still the free Day 1 (D13)
    expect(run.day).toBe(1); // no extra day
    expect([needsDayTutorial(run), needsNightTutorial(run)]).toEqual([false, false]);
    expect([needsDayTutorial(newRun()), needsNightTutorial(newRun())]).toEqual([true, true]);
  });

  it('never shows on Map 2', () => {
    const run = newRun();
    nextMap(run);
    startNextDay(run);
    expect([needsDayTutorial(run), needsNightTutorial(run)]).toEqual([false, false]);
  });

  it('a Day 1 left open (tutorial up) spends no clock or counters until the first valid move', () => {
    const run = newRun();
    const day = createDay(run.map, { scrubMax: 1 });
    tickDay(day, 30); // time the tutorial was open
    expect([day.timeLeft, day.started, day.scrub.count]).toEqual([70, false, 1]);
    expect(tryMove(day, 'up')).toBe('blocked'); // map edge: not a valid move
    tickDay(day, 5);
    expect(day.timeLeft).toBe(70);
    expect(tryMove(day, 'right')).toBe('moved');
    tickDay(day, 1);
    expect(day.timeLeft).toBe(69);
  });

  it('the first night still warns for 2 s and spawns wave 1 at t = 2 s after the tutorial', () => {
    const run = newRun();
    const night = createNight(run.map, waveForRun(run), { rng: () => 0 });
    tickNight(night, 2); // the 2 s warning; clock still 45
    expect([night.mudBoys.length, night.timeLeft]).toEqual([0, 45]);
    tickNight(night, 1.9); // clock t = 1.9 s
    expect(night.mudBoys).toHaveLength(0);
    tickNight(night, 0.2); // clock t = 2.1 s
    expect(night.mudBoys.length).toBeGreaterThan(0);
  });
});

describe('Phase 1 payouts and carry-over are unchanged', () => {
  it('Map 1 pays 400 once and Map 2 pays 2,500 once, with bank, upgrades, Wax and day carried', () => {
    const run = newRun();
    run.map.tiles.fill(8);
    run.day = 7;
    expect(claimVictory(run)).toBe(400);
    run.unlocked.combo = 1;
    run.wax = 3;
    nextMap(run);
    expect([run.mapIndex, run.bank, run.unlocked.combo, run.wax, run.day]).toEqual([1, 400, 1, 3, 7]);
    startNextDay(run);
    expect(run.day - run.firstMapDay + 1).toBe(1); // Map 2 day 1 (D44)
    run.map.tiles.fill(8);
    expect(claimVictory(run)).toBe(2500);
    expect(run.bank).toBe(2900);
  });
});
