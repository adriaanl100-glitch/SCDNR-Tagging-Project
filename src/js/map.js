import { getVisibleGridCells, gridCellCentroid, latLngToCell } from './grid.js';

const SC_CENTER = [32.7, -79.8];
const DEFAULT_ZOOM = 9;

let map = null;
let gridLayer = null;
let baseLayer = null;
let bathyLayer = null;
let onLocationSelect = null;

export function initMap(containerId, callback) {
  onLocationSelect = callback;

  map = L.map(containerId, { center: SC_CENTER, zoom: DEFAULT_ZOOM, tap: true });

  baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(map);

  bathyLayer = L.tileLayer.wms('https://gis.charttools.noaa.gov/arcgis/services/MCS/NOAAChartDisplay/MapServer/WMSServer', {
    layers: '0',
    format: 'image/png',
    transparent: true,
    attribution: 'NOAA'
  });

  gridLayer = L.layerGroup().addTo(map);

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
    const { south, north, west, east } = cell.bounds;
    const rect = L.rectangle([[south, west], [north, east]], {
      color: '#0d9488',
      weight: 1,
      fillOpacity: 0.05,
      interactive: true
    });
    rect.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      selectCell(cell.row, cell.col);
    });
    rect.addTo(gridLayer);
  });
}

function handleMapClick(e) {
  const cell = latLngToCell(e.latlng.lat, e.latlng.lng);
  selectCell(cell.row, cell.col);
}

function selectCell(row, col) {
  const centroid = gridCellCentroid(row, col);
  onLocationSelect?.({
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    gridCellId: `${centroid.latitude.toFixed(3)}_${centroid.longitude.toFixed(3)}`
  });
}

export function toggleBathymetry(enabled) {
  if (!map || !bathyLayer) return;
  if (enabled) {
    bathyLayer.addTo(map);
  } else {
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
