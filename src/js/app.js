import { SPECIES_LIST, getAllowedTagTypes, getDefaultMeasurement, isDoNotTagSpecies } from './species.js';
import { validateCatchRecord } from './validation.js';
import { compressImage } from './image.js';
import { getAllCatches, saveCatch, clearAllCatches, countPending, generateId } from './storage.js';
import { syncAllRecords } from './sync.js';
import { exportBackupZip, downloadBlob } from './export.js';
import { initMap, captureGPS, toggleBathymetry, setMapLocation } from './map.js';

const state = {
  photoBase64: null,
  latitude: null,
  longitude: null,
  gridCellId: null,
  records: []
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function getWebhookUrl() {
  return window.SCDNR_CONFIG?.WEBHOOK_URL || '';
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
  $('#latitude').value = lat?.toFixed(6) ?? '';
  $('#longitude').value = lon?.toFixed(6) ?? '';
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
    capturedAt: new Date().toISOString(),
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

function resetForm() {
  $('#catch-form').reset();
  state.photoBase64 = null;
  state.latitude = null;
  state.longitude = null;
  state.gridCellId = null;
  $('#latitude').value = '';
  $('#longitude').value = '';
  $('#grid-cell-id').value = '';
  $('#photo-preview').classList.add('hidden');
  $('#photo-preview').src = '';
  $('#captured-at').value = new Date().toLocaleString();
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

  $('#save-toast').classList.remove('hidden');
  setTimeout(() => $('#save-toast').classList.add('hidden'), 2500);

  resetForm();
}

async function handlePhotoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const { dataUrl } = await compressImage(file);
    state.photoBase64 = dataUrl;
    const preview = $('#photo-preview');
    preview.src = dataUrl;
    preview.classList.remove('hidden');
  } catch (err) {
    showFieldErrors({ photoBase64: err.message });
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
  const progress = $('#sync-progress');
  const bar = $('#sync-progress-bar');
  const status = $('#sync-status');

  progress.classList.remove('hidden');
  bar.style.width = '0%';
  status.textContent = 'Syncing...';

  try {
    const result = await syncAllRecords(url, ({ current, total }) => {
      bar.style.width = `${(current / total) * 100}%`;
    });

    state.records = await getAllCatches();
    updateUnsentBadge();

    if (result.failed > 0) {
      status.textContent = `Ingest Failed — ${result.failed} catch(es) need retry`;
      status.className = 'text-red-600 font-semibold';
    } else {
      status.textContent = `Successfully synced ${result.synced} catch(es)`;
      status.className = 'text-green-600 font-semibold';
    }
  } catch (err) {
    status.textContent = `Ingest Failed — ${err.message}`;
    status.className = 'text-red-600 font-semibold';
  }
}

async function handleExportZip() {
  const pending = state.records.filter((r) => r.syncStatus !== 'synced');
  const toExport = pending.length ? pending : state.records;
  if (!toExport.length) {
    alert('No catches to export');
    return;
  }

  const blob = await exportBackupZip(toExport, window.JSZip);
  downloadBlob(blob, `scdnr-catches-${Date.now()}.zip`);

  const clearAfter = confirm('Download complete. Clear exported catches from local queue?');
  if (clearAfter) {
    const remaining = state.records.filter((r) => !toExport.find((e) => e.id === r.id));
    await import('./storage.js').then((m) => m.updateCatches(remaining));
    state.records = remaining;
    updateUnsentBadge();
  }
}

function showClearModal(step) {
  const modal = $('#clear-modal');
  modal.classList.remove('hidden');
  $('#clear-step-1').classList.toggle('hidden', step !== 1);
  $('#clear-step-2').classList.toggle('hidden', step !== 2);
}

function hideClearModal() {
  $('#clear-modal').classList.add('hidden');
}

async function handleClearConfirm() {
  await clearAllCatches();
  state.records = [];
  updateUnsentBadge();
  hideClearModal();
  renderLogbook();
}

function renderLogbook() {
  const grid = $('#logbook-grid');
  if (!grid) return;

  if (!state.records.length) {
    grid.innerHTML = '<p class="text-slate-500 text-center col-span-2 py-8">No catches logged yet</p>';
    return;
  }

  grid.innerHTML = state.records
    .slice()
    .reverse()
    .map(
      (r) => `
    <div class="bg-white rounded-xl shadow p-3">
      <img src="${r.photoBase64 || ''}" alt="" class="w-full h-24 object-cover rounded-lg mb-2 bg-slate-100" />
      <p class="font-semibold text-sm">${r.species}</p>
      <p class="text-xs text-slate-500">${new Date(r.capturedAt).toLocaleDateString()}</p>
      <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
        r.syncStatus === 'synced' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      }">${r.syncStatus}</span>
    </div>`
    )
    .join('');
}

async function init() {
  populateSpeciesDropdown();
  $('#captured-at').value = new Date().toLocaleString();

  state.records = await getAllCatches();
  updateUnsentBadge();
  updateOfflineBanner();

  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);

  initMap('map', (loc) => setCoordinates(loc.latitude, loc.longitude, loc.gridCellId));

  $('#species').addEventListener('change', updateTagTypeAvailability);
  $('#catch-form').addEventListener('submit', handleSaveCatch);
  $('#photo-input').addEventListener('change', handlePhotoChange);
  $('#gps-btn').addEventListener('click', handleGPS);
  $('#bathy-toggle').addEventListener('change', (e) => toggleBathymetry(e.target.checked));
  $('#sync-btn').addEventListener('click', handleSync);
  $('#export-btn').addEventListener('click', handleExportZip);
  $('#clear-btn').addEventListener('click', () => showClearModal(1));
  $('#clear-step1-yes').addEventListener('click', () => showClearModal(2));
  $('#clear-step1-no').addEventListener('click', hideClearModal);
  $('#clear-step2-yes').addEventListener('click', handleClearConfirm);
  $('#clear-step2-no').addEventListener('click', hideClearModal);

  $$('[data-tab-btn]').forEach((btn) => {
    btn.addEventListener('click', () => showTab(btn.dataset.tabBtn));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
