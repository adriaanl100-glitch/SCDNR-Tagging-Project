import { getVisibleGridCells, gridCellCentroid, latLngToCell } from './grid.js';

const SC_CENTER = [32.7, -79.8];
const DEFAULT_ZOOM = 9;

const NOAA_EXPORT_URL =
  'https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/ENCOnline/MapServer/exts/MaritimeChartService/MapServer/export';

let map = null;
let gridLayer = null;
let baseLayer = null;
let bathyLayer = null;
let onLocationSelect = null;
let selectedCell = null;

/** Esri MapServer export tiles (NOAA ENC — WMS endpoint returns 403). */
const NoaaEncLayer = L.GridLayer.extend({
  initialize(options) {
    L.GridLayer.prototype.initialize.call(this, options);
    this._exportUrl = options.exportUrl;
    this._layerParam = options.layers || 'show:2';
  },

  createTile(coords, done) {
    const tile = L.DomUtil.create('img', 'leaflet-tile');
    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const tileBounds = this._tileCoordsToBounds(coords);
    const crs = this._map.options.crs;
    const sw = crs.project(tileBounds.getSouthWest());
    const ne = crs.project(tileBounds.getNorthEast());
    const bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`;
    const size = this.getTileSize();

    tile.src =
      `${this._exportUrl}?bbox=${bbox}&bboxSR=3857&imageSR=3857` +
      `&size=${size.x},${size.y}&layers=${encodeURIComponent(this._layerParam)}` +
      '&format=png&transparent=true&f=image';

    tile.onload = () => done(null, tile);
    tile.onerror = () => done(new Error('NOAA tile failed'), tile);
    return tile;
  }
});

export function initMap(containerId, callback) {
  onLocationSelect = callback;

  map = L.map(containerId, { center: SC_CENTER, zoom: DEFAULT_ZOOM });

  baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(map);

  bathyLayer = new NoaaEncLayer({
    exportUrl: NOAA_EXPORT_URL,
    layers: 'show:1,2,3',
    opacity: 0.92,
    maxZoom: 16,
    attribution: '© NOAA ENC'
  });

  if (!map.getPane('gridPane')) {
    map.createPane('gridPane');
    map.getPane('gridPane').style.zIndex = 401;
  }

  gridLayer = L.layerGroup({ pane: 'gridPane' }).addTo(map);

  map.on('moveend', redrawGrid);
  map.on('click', handleMapClick);
  redrawGrid();

  return map;
}

function redrawGrid() {
  if (!map || !gridLayer) return;
  gridLayer.clearLayers();
  const bounds = map.getBounds();
  const cells = getVisibleGridCells(bounds);

  cells.forEach((cell) => {
    const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
    const { south, north, west, east } = cell.bounds;
    const rect = L.rectangle([[south, west], [north, east]], {
      color: isSelected ? '#92400e' : '#0d9488',
      weight: isSelected ? 3 : 1,
      fillColor: isSelected ? '#fbbf24' : '#0d9488',
      fillOpacity: isSelected ? 0.5 : 0.05,
      interactive: true,
      pane: 'gridPane'
    });
    rect.on('click', (e) => {
      L.DomEvent.stop(e);
      selectCell(cell.row, cell.col);
    });
    rect.addTo(gridLayer);
  });

  gridLayer.bringToFront();
}

function handleMapClick(e) {
  const cell = latLngToCell(e.latlng.lat, e.latlng.lng);
  selectCell(cell.row, cell.col);
}

function selectCell(row, col) {
  selectedCell = { row, col };
  const centroid = gridCellCentroid(row, col);
  onLocationSelect?.({
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    gridCellId: `${centroid.latitude.toFixed(3)}_${centroid.longitude.toFixed(3)}`
  });
  redrawGrid();
}

export function highlightCellAt(lat, lon) {
  const cell = latLngToCell(lat, lon);
  selectedCell = { row: cell.row, col: cell.col };
  redrawGrid();
}

export function toggleBathymetry(enabled) {
  if (!map || !bathyLayer) return;
  if (enabled) {
    if (!map.hasLayer(bathyLayer)) {
      bathyLayer.addTo(map);
    }
    bathyLayer.bringToFront();
    gridLayer?.bringToFront();
  } else if (map.hasLayer(bathyLayer)) {
    map.removeLayer(bathyLayer);
  }
}

export function captureGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const cell = latLngToCell(latitude, longitude);
        selectedCell = { row: cell.row, col: cell.col };
        redrawGrid();
        resolve({
          latitude,
          longitude,
          gridCellId: cell.gridCellId
        });
      },
      (err) => reject(new Error(err.message || 'GPS capture failed')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export function getMap() {
  return map;
}

export function setMapLocation(lat, lon) {
  if (map) {
    map.setView([lat, lon], Math.max(map.getZoom(), 12));
  }
}
