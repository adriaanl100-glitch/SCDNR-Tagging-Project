import { SPECIES_LIST, getAllowedTagTypes, getDefaultMeasurement, isDoNotTagSpecies } from './species.js';
import { validateCatchRecord } from './validation.js';
import { compressImage } from './image.js';
import { getAllCatches, saveCatch, countPending, generateId } from './storage.js';
import { syncAllRecords, getSyncConfig, isWebhookConfigured } from './sync.js';
import { savePhotoToDevice, buildCatchPhotoFilename } from './export.js';
import { initMap, captureGPS, toggleBathymetry, setMapLocation } from './map.js';

const state = {
  photoBase64: null,
  photoFilename: null,
  latitude: null,
  longitude: null,
  gridCellId: null,
  records: []
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function getWebhookUrl() {
  return getSyncConfig().webhookUrl;
}

function showTab(tabId) {
  $$('[data-tab-panel]').forEach((p) => p.classList.add('hidden'));
  $$('[data-tab-btn]').forEach((b) => {
    b.classList.remove('border-teal-600', 'text-teal-700');
    b.classList.add('border-transparent', 'text-slate-500');
  });
  $(`#panel-${tabId}`)?.classList.remove('hidden');
  const btn = $(`[data-tab-btn="${tabId}"]`);
  if (btn) {
    btn.classList.add('border-teal-600', 'text-teal-700');
    btn.classList.remove('border-transparent', 'text-slate-500');
  }
  if (tabId === 'logbook') renderLogbook();
}

function updateOfflineBanner() {
  const banner = $('#offline-banner');
  if (!banner) return;
  banner.classList.toggle('hidden', navigator.onLine);
}

function updateUnsentBadge() {
  const pending = countPending(state.records);
  const badges = $$('.unsent-badge');
  badges.forEach((el) => {
    el.textContent = pending;
    el.classList.toggle('hidden', pending === 0);
  });
  const syncCount = $('#sync-count');
  if (syncCount) syncCount.textContent = pending;
}

function setCoordinates(lat, lon, gridCellId) {
  state.latitude = lat;
  state.longitude = lon;
  state.gridCellId = gridCellId || null;
  $('#latitude').value = lat?.toFixed(4) ?? '';
  $('#longitude').value = lon?.toFixed(4) ?? '';
  $('#grid-cell-id').value = gridCellId ?? '';
  setMapLocation(lat, lon);
}

function populateSpeciesDropdown() {
  const select = $('#species');
  select.innerHTML = '<option value="">Select species...</option>';
  SPECIES_LIST.forEach((sp) => {
    const opt = document.createElement('option');
    opt.value = sp.name;
    opt.textContent = sp.name;
    select.appendChild(opt);
  });
}

function updateTagTypeAvailability() {
  const species = $('#species').value;
  const allowed = getAllowedTagTypes(species);
  const crRadio = $('#tag-type-cr');
  const kRadio = $('#tag-type-k');
  if (crRadio) {
    crRadio.disabled = !allowed.CR;
    crRadio.parentElement.classList.toggle('opacity-50', !allowed.CR);
  }
  if (kRadio) {
    kRadio.disabled = !allowed.K;
    kRadio.parentElement.classList.toggle('opacity-50', !allowed.K);
  }
  if (!allowed.CR && crRadio?.checked) kRadio.checked = true;
  if (!allowed.K && kRadio?.checked) crRadio.checked = true;

  const warn = $('#do-not-tag-warning');
  if (warn) {
    warn.classList.toggle('hidden', !isDoNotTagSpecies(species));
  }

  if (species) {
    const def = getDefaultMeasurement(species);
    const tail = $('#measurement-tail');
    const fork = $('#measurement-fork');
    if (def === 'Tail') tail.checked = true;
    else fork.checked = true;
  }
}

function todayDateInputValue() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateInputToIso(dateValue) {
  if (!dateValue) return '';
  return dateValue;
}

function setDefaultCaptureDate() {
  const input = $('#captured-at');
  if (input) input.value = todayDateInputValue();
}

function formatCaptureDate(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${m}/${d}/${y}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function showFieldErrors(errors) {
  $$('.field-error').forEach((el) => {
    el.textContent = '';
    el.classList.add('hidden');
  });
  Object.entries(errors).forEach(([field, msg]) => {
    const el = $(`#error-${field}`);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  });
}

function collectFormData() {
  const tagType = document.querySelector('input[name="tagType"]:checked')?.value;
  const measurementType = document.querySelector('input[name="measurementType"]:checked')?.value;
  const measurementAccuracy = document.querySelector('input[name="measurementAccuracy"]:checked')?.value;
  const condition = document.querySelector('input[name="condition"]:checked')?.value;

  return {
    tagType,
    tagNumber: $('#tag-number').value.trim(),
    vialNumber: $('#vial-number').value.trim(),
    capturedAt: dateInputToIso($('#captured-at').value),
    species: $('#species').value,
    lengthInches: parseFloat($('#length-inches').value),
    measurementType,
    measurementAccuracy,
    locationName: $('#location-name').value.trim(),
    latitude: state.latitude,
    longitude: state.longitude,
    gridCellId: state.gridCellId,
    condition,
    photoBase64: state.photoBase64
  };
}

function updatePhotoUI() {
  const hasPhoto = !!state.photoBase64;
  $('#photo-upload-area')?.classList.toggle('hidden', hasPhoto);
  const preview = $('#photo-preview');
  if (preview) {
    preview.classList.toggle('hidden', !hasPhoto);
    preview.src = hasPhoto ? state.photoBase64 : '';
  }
  $('#photo-actions')?.classList.toggle('hidden', !hasPhoto);
  $('#photo-save-status')?.classList.add('hidden');
}

function setPhotoSaveStatus(message, isError = false) {
  const el = $('#photo-save-status');
  if (!el) return;
  el.textContent = message;
  el.className = isError
    ? 'text-xs text-red-600 mt-1'
    : 'text-xs text-green-700 mt-1';
  el.classList.remove('hidden');
}

async function persistPhotoToDevice(dataUrl, filename, { interactive = false } = {}) {
  const result = await savePhotoToDevice(dataUrl, filename, { interactive });
  if (result.saved) {
    setPhotoSaveStatus(
      result.method === 'share'
        ? 'Photo saved to your device.'
        : 'Photo downloaded to this device.'
    );
  } else if (result.method === 'manual') {
    setPhotoSaveStatus('Tap "Save photo to device" to store this photo on your phone.');
  }
  return result;
}

function clearPhoto() {
  state.photoBase64 = null;
  state.photoFilename = null;
  const input = $('#photo-input');
  if (input) input.value = '';
  updatePhotoUI();
  showFieldErrors({});
}

async function handleSavePhotoToDevice() {
  if (!state.photoBase64) return;
  const filename = state.photoFilename || `scdnr-catch-${Date.now()}.jpg`;
  try {
    const result = await savePhotoToDevice(state.photoBase64, filename, { interactive: true });
    if (result.method === 'cancelled') return;
    if (result.saved) {
      setPhotoSaveStatus(
        result.method === 'share'
          ? 'Photo saved to your device.'
          : 'Photo downloaded to this device.'
      );
    } else if (result.method === 'manual') {
      setPhotoSaveStatus('Tap "Save photo to device" to store this photo on your phone.');
    }
  } catch (err) {
    setPhotoSaveStatus(err.message || 'Could not save photo', true);
  }
}

function resetForm() {
  $('#catch-form').reset();
  state.photoBase64 = null;
  state.photoFilename = null;
  state.latitude = null;
  state.longitude = null;
  state.gridCellId = null;
  $('#latitude').value = '';
  $('#longitude').value = '';
  $('#grid-cell-id').value = '';
  const input = $('#photo-input');
  if (input) input.value = '';
  updatePhotoUI();
  setDefaultCaptureDate();
  showFieldErrors({});
}

async function handleSaveCatch(e) {
  e.preventDefault();
  const data = collectFormData();
  const { valid, errors } = validateCatchRecord(data);
  if (!valid) {
    showFieldErrors(errors);
    return;
  }

  const record = {
    ...data,
    id: generateId(),
    syncStatus: 'pending',
    createdAt: new Date().toISOString()
  };

  await saveCatch(record);
  state.records = await getAllCatches();
  updateUnsentBadge();

  if (record.photoBase64) {
    await persistPhotoToDevice(record.photoBase64, buildCatchPhotoFilename(record), { interactive: true });
  }

  $('#save-toast').classList.remove('hidden');
  setTimeout(() => $('#save-toast').classList.add('hidden'), 2500);

  resetForm();
}

async function handlePhotoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (state.photoBase64) return;
  try {
    const { dataUrl } = await compressImage(file);
    state.photoBase64 = dataUrl;
    state.photoFilename = `scdnr-catch-${Date.now()}.jpg`;
    updatePhotoUI();
    showFieldErrors({});
    await persistPhotoToDevice(dataUrl, state.photoFilename);
  } catch (err) {
    showFieldErrors({ photoBase64: err.message });
  } finally {
    e.target.value = '';
  }
}

async function handleGPS() {
  const btn = $('#gps-btn');
  btn.disabled = true;
  btn.textContent = 'Acquiring GPS...';
  try {
    const loc = await captureGPS();
    setCoordinates(loc.latitude, loc.longitude, loc.gridCellId);
    $('#error-coordinates')?.classList.add('hidden');
  } catch (err) {
    const el = $('#error-coordinates');
    if (el) {
      el.textContent = err.message;
      el.classList.remove('hidden');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Capture Current GPS Location';
  }
}

async function handleSync() {
  const url = getWebhookUrl();
  const status = $('#sync-status');

  if (!isWebhookConfigured(url)) {
    status.textContent = 'Submission is temporarily unavailable. Please try again later.';
    status.className = 'text-red-600 font-semibold text-sm';
    return;
  }

  const progress = $('#sync-progress');
  const bar = $('#sync-progress-bar');

  progress.classList.remove('hidden');
  bar.style.width = '0%';
  status.textContent = 'Submitting your catches…';

  try {
    const result = await syncAllRecords(url, ({ current, total }) => {
      bar.style.width = `${(current / total) * 100}%`;
    });

    state.records = await getAllCatches();
    updateUnsentBadge();

    if (result.failed > 0) {
      status.textContent = 'Some catches could not be submitted. Check your connection and try again.';
      status.className = 'text-red-600 font-semibold text-sm';
    } else if (result.synced === 0) {
      status.textContent = state.records.length
        ? 'All catches have been submitted. Thank you for participating!'
        : 'No catches to submit yet.';
      status.className = 'text-slate-600 text-sm';
    } else {
      status.textContent =
        'Thank you for participating! Our fisheries resources appreciate your contribution.';
      status.className = 'text-green-600 font-semibold text-sm';
    }
  } catch (err) {
    status.textContent = 'Submission failed. Please check your connection and try again.';
    status.className = 'text-red-600 font-semibold';
  }
}

function buildLogbookCard(r) {
  // Build with DOM APIs + textContent so user-supplied fields (species,
  // locationName, etc.) can never be interpreted as HTML/JS (stored XSS).
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow p-3';

  if (r.photoBase64) {
    const img = document.createElement('img');
    img.src = r.photoBase64;
    img.alt = '';
    img.className = 'w-full h-24 object-cover rounded-lg mb-2 bg-slate-100';
    card.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className =
      'w-full h-24 rounded-lg mb-2 bg-slate-100 flex items-center justify-center text-slate-400 text-xs';
    placeholder.textContent = 'No photo';
    card.appendChild(placeholder);
  }

  const species = document.createElement('p');
  species.className = 'font-semibold text-sm';
  species.textContent = r.species || '';
  card.appendChild(species);

  if (r.locationName) {
    const location = document.createElement('p');
    location.className = 'text-xs text-slate-500 truncate';
    location.textContent = r.locationName;
    card.appendChild(location);
  }

  const date = document.createElement('p');
  date.className = 'text-xs text-slate-500';
  date.textContent = formatCaptureDate(r.capturedAt);
  card.appendChild(date);

  const synced = r.syncStatus === 'synced';
  const badge = document.createElement('span');
  badge.className =
    'inline-block mt-1 text-xs px-2 py-0.5 rounded-full ' +
    (synced ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800');
  badge.textContent = synced ? 'Submitted' : 'Not yet submitted';
  card.appendChild(badge);

  return card;
}

function renderLogbook() {
  const grid = $('#logbook-grid');
  if (!grid) return;

  grid.replaceChildren();

  if (!state.records.length) {
    const empty = document.createElement('p');
    empty.className = 'text-slate-500 text-center col-span-2 py-8';
    empty.textContent = 'No catches logged yet';
    grid.appendChild(empty);
    return;
  }

  state.records
    .slice()
    .reverse()
    .forEach((r) => grid.appendChild(buildLogbookCard(r)));
}

async function init() {
  // Remove legacy modal overlay from older cached builds (blocked bottom tabs).
  document.getElementById('clear-modal')?.remove();

  populateSpeciesDropdown();
  setDefaultCaptureDate();

  state.records = await getAllCatches();
  updateUnsentBadge();
  updateOfflineBanner();

  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);

  initMap('map', (loc) => setCoordinates(loc.latitude, loc.longitude, loc.gridCellId));

  $('#species').addEventListener('change', updateTagTypeAvailability);
  $('#catch-form').addEventListener('submit', handleSaveCatch);
  $('#photo-input').addEventListener('change', handlePhotoChange);
  $('#photo-save-btn').addEventListener('click', handleSavePhotoToDevice);
  $('#photo-remove-btn').addEventListener('click', clearPhoto);
  $('#gps-btn').addEventListener('click', handleGPS);
  $('#bathy-toggle').addEventListener('change', (e) => toggleBathymetry(e.target.checked));
  $('#sync-btn').addEventListener('click', handleSync);

  $$('[data-tab-btn]').forEach((btn) => {
    btn.addEventListener('click', () => showTab(btn.dataset.tabBtn));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => reg.update()).catch(() => {});
    caches?.keys?.().then((keys) =>
      keys.filter((k) => k !== 'scdnr-tag-logging-v17').forEach((k) => caches.delete(k))
    );
  }
}

document.addEventListener('DOMContentLoaded', init);
