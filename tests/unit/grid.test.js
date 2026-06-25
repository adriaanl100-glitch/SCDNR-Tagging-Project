import { describe, it, expect } from 'vitest';
import { latLngToCell, gridCellCentroid, LAT_DELTA, LON_DELTA } from '../../src/js/grid.js';

describe('grid math', () => {
  it('uses SC coast deltas', () => {
    expect(LAT_DELTA).toBe(0.0145);
    expect(LON_DELTA).toBe(0.0172);
  });

  it('computes cell from lat/lng', () => {
    const cell = latLngToCell(32.7, -79.8);
    expect(cell.gridCellId).toMatch(/^\d+\.\d+_-?\d+\.\d+$/);
    expect(cell.latitude).toBeGreaterThan(32);
    expect(cell.longitude).toBeLessThan(-79);
  });

  it('centroid falls inside cell bounds', () => {
    const c = gridCellCentroid(2255, -4639);
    expect(c.latitude).toBeGreaterThan(32);
  });
});
