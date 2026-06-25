import { describe, it, expect } from 'vitest';
import { computeScaledDimensions, MAX_WIDTH } from '../../src/js/image.js';
import { getAllowedTagTypes, getDefaultMeasurement, isDoNotTagSpecies } from '../../src/js/species.js';
import { buildCsv, CSV_HEADERS } from '../../src/js/export.js';

describe('computeScaledDimensions', () => {
  it('scales down wide images', () => {
    const { width, height } = computeScaledDimensions(4000, 3000);
    expect(width).toBe(MAX_WIDTH);
    expect(height).toBe(600);
  });

  it('keeps small images unchanged', () => {
    const { width, height } = computeScaledDimensions(640, 480);
    expect(width).toBe(640);
    expect(height).toBe(480);
  });
});

describe('species rules', () => {
  it('disables K for flounder', () => {
    expect(getAllowedTagTypes('Southern Flounder')).toEqual({ CR: true, K: false });
  });

  it('disables CR for king mackerel', () => {
    expect(getAllowedTagTypes('King Mackerel')).toEqual({ CR: false, K: true });
  });

  it('defaults measurement by species', () => {
    expect(getDefaultMeasurement('Red Drum')).toBe('Tail');
    expect(getDefaultMeasurement('Sheepshead')).toBe('Fork');
  });

  it('flags spotted seatrout', () => {
    expect(isDoNotTagSpecies('Spotted Seatrout')).toBe(true);
  });
});

describe('buildCsv', () => {
  it('includes all schema headers', () => {
    expect(CSV_HEADERS).toContain('tagType');
    expect(CSV_HEADERS).toContain('gridCellId');
  });

  it('escapes commas in values', () => {
    const csv = buildCsv([{ id: '1', locationName: 'Wando, River', tagType: 'CR' }]);
    expect(csv).toContain('"Wando, River"');
  });
});
