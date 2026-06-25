/** 1-mile grid math for SC coast (~32.7°N) */
export const LAT_DELTA = 0.0145;
export const LON_DELTA = 0.0172;

export function snapToGrid(lat, lon) {
  const row = Math.floor(lat / LAT_DELTA);
  const col = Math.floor(lon / LON_DELTA);
  return { row, col };
}

export function gridCellBounds(row, col) {
  const south = row * LAT_DELTA;
  const north = south + LAT_DELTA;
  const west = col * LON_DELTA;
  const east = west + LON_DELTA;
  return { south, north, west, east };
}

export function gridCellCentroid(row, col) {
  const bounds = gridCellBounds(row, col);
  return {
    latitude: (bounds.south + bounds.north) / 2,
    longitude: (bounds.west + bounds.east) / 2
  };
}

export function gridCellId(row, col) {
  const c = gridCellCentroid(row, col);
  return `${c.latitude.toFixed(3)}_${c.longitude.toFixed(3)}`;
}

export function latLngToCell(lat, lon) {
  const { row, col } = snapToGrid(lat, lon);
  const centroid = gridCellCentroid(row, col);
  return {
    row,
    col,
    gridCellId: gridCellId(row, col),
    latitude: centroid.latitude,
    longitude: centroid.longitude
  };
}

export function getVisibleGridCells(bounds) {
  const minRow = Math.floor(bounds.getSouth() / LAT_DELTA);
  const maxRow = Math.floor(bounds.getNorth() / LAT_DELTA);
  const minCol = Math.floor(bounds.getWest() / LON_DELTA);
  const maxCol = Math.floor(bounds.getEast() / LON_DELTA);
  const cells = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const b = gridCellBounds(row, col);
      cells.push({ row, col, bounds: b, id: gridCellId(row, col) });
    }
  }
  return cells;
}
