import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BRUSH_AOE_DEFAULT, POWA_CONVERSION, TILE_COLORS, TIMERS } from '../src/rules/config';

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

  it('POWA conversion', () => {
    for (const [rating, value] of csvRows('POWA_conversion.csv').slice(1)) {
      expect(POWA_CONVERSION[Number(rating)]).toBe(Number(value));
    }
  });

  it('tile colours', () => {
    for (const row of csvRows('colors.csv').slice(1)) {
      expect(TILE_COLORS[Number(row[0])]).toBe(row[2].replace(/`/g, ''));
    }
  });
});
