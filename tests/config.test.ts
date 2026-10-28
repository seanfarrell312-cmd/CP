import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BRUSH_AOE_DEFAULT, POWA_CONVERSION, TILE_COLORS, TILE_MAX, TILE_MIN, TIMERS, waveForDay } from '../src/rules/config';

const DATA = 'Clean_POWA_Reviewer_Handoff/04_Data_Tables/';

function csvRows(file: string): string[][] {
  return readFileSync(DATA + file, 'utf8')
    .replace(/^﻿/, '')
    .trim()
    .split(/\r?\n/)
    // Split on commas outside double quotes.
    .map((line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '')));
}

describe('config matches the balance data tables', () => {
  it('timers (D17)', () => {
    const rows = Object.fromEntries(csvRows('Timers.csv').slice(1).map((r) => [r[0], Number(r[1])]));
    expect(rows).toMatchObject({
      Scrub: TIMERS.scrub,
      Shoot: TIMERS.shoot,
      Daylight: TIMERS.daylight,
      Night: TIMERS.night,
    });
  });

  it('brush AoE', () => {
    const matrix = csvRows('Brush_AoE.csv').map((r) => r.map((c) => Number(c.replace('X', ''))));
    expect(matrix).toEqual(BRUSH_AOE_DEFAULT);
  });

  it('POWA conversion matches the table up to +4, then continues at 0.5 per level (D30)', () => {
    for (const [rating, value] of csvRows('POWA_conversion.csv').slice(1)) {
      expect(POWA_CONVERSION[Number(rating)]).toBe(Number(value));
    }
    for (let r = 5; r <= TILE_MAX; r++) expect(POWA_CONVERSION[r]).toBe(r * 0.5);
  });
});

// D30 replaces the colors.csv palette; check it covers every level with distinct colours.
describe('D30 palette', () => {
  it('has one distinct colour per level from TILE_MIN to TILE_MAX', () => {
    const colors = [];
    for (let l = TILE_MIN; l <= TILE_MAX; l++) colors.push(TILE_COLORS[l]);
    expect(colors.every((c) => /^#[0-9A-F]{6}$/.test(c))).toBe(true);
    expect(new Set(colors).size).toBe(TILE_MAX - TILE_MIN + 1);
  });
});

describe('Mud Boy wave table', () => {
  it('matches Mud_boy_Waves.csv for days 1-90 and the >90 row', () => {
    for (const [count, edge, destination, hp, waves, day] of csvRows('Mud_boy_Waves.csv').slice(1)) {
      const expected = { count: Number(count), edge, destination, hp: Number(hp), waves: Number(waves) };
      expect(waveForDay(day === '>90' ? 91 : Number(day))).toEqual(expected);
    }
  });
});
