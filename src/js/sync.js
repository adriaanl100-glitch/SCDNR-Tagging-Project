import { getAllCatches, updateCatch } from './storage.js';

const PLACEHOLDER_PATTERNS = ['YOUR_DEPLOYMENT_ID', 'YOUR_ID', 'YOUR_SHEET_ID', 'YOUR_DRIVE_FOLDER_ID'];
const FORM_POST_LIMIT = 32000;

const GOOGLE_IDS_KEY = 'scdnr-google-ids';
const WEBHOOK_URL_KEY = 'scdnr-webhook-url';
const WEBHOOK_TOKEN_KEY = 'scdnr-webhook-token';

function readStoredGoogleIds() {
  try {
    const raw = localStorage.getItem(GOOGLE_IDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function readStoredWebhookUrl() {
  try {
    return (localStorage.getItem(WEBHOOK_URL_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function saveWebhookUrl(url) {
  const next = (url || '').trim();
  try {
    if (next) localStorage.setItem(WEBHOOK_URL_KEY, next);
    else localStorage.removeItem(WEBHOOK_URL_KEY);
  } catch {
    /* storage unavailable — fall back to in-memory config only */
  }
  return next;
}

export function readStoredWebhookToken() {
  try {
    return (localStorage.getItem(WEBHOOK_TOKEN_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function saveWebhookToken(token) {
  const next = (token || '').trim();
  try {
    if (next) localStorage.setItem(WEBHOOK_TOKEN_KEY, next);
    else localStorage.removeItem(WEBHOOK_TOKEN_KEY);
  } catch {
    /* storage unavailable — fall back to in-memory config only */
  }
  return next;
}

export function saveGoogleIds({ sheetId, folderId, sheetName }) {
  const next = {
    sheetId: (sheetId || '').trim(),
    folderId: (folderId || '').trim(),
    sheetName: (sheetName || 'Catches').trim() || 'Catches'
  };
  localStorage.setItem(GOOGLE_IDS_KEY, JSON.stringify(next));
  return next;
}

export function getSyncConfig() {
  const cfg = window.SCDNR_CONFIG || {};
  const stored = readStoredGoogleIds();
  // Webhook URL saved on the Sync tab (localStorage) wins over any bundled
  // config.js value — this is what makes the GitHub Pages build syncable.
  const storedWebhook = readStoredWebhookUrl();
  const storedToken = readStoredWebhookToken();
  return {
    webhookUrl: (storedWebhook || cfg.WEBHOOK_URL || '').trim(),
    authToken: (storedToken || cfg.WEBHOOK_TOKEN || '').trim(),
    sheetId: (stored.sheetId || cfg.SHEET_ID || '').trim(),
    folderId: (stored.folderId || cfg.FOLDER_ID || '').trim(),
    sheetName: (stored.sheetName || cfg.SHEET_NAME || 'Catches').trim() || 'Catches'
  };
}

export function isGoogleConfigComplete(config = getSyncConfig()) {
  // Sheet/Folder IDs now live in the Apps Script's Script Properties
  // (server-side), so the client only needs a configured webhook URL.
  // Any IDs the client does hold are still forwarded as a fallback.
  return isWebhookConfigured(config.webhookUrl);
}

export function isWebhookConfigured(webhookUrl) {
  if (!webhookUrl?.trim()) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => webhookUrl.includes(p));
}

/** Normalize capture date to YYYY-MM-DD (no time). */
export function normalizeCaptureDate(value) {
  if (!value) return '';
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Strip client-only fields before sending to Google Apps Script. */
export function prepareRecordForSync(record, config = getSyncConfig()) {
  return {
    authToken: config.authToken,
    sheetId: config.sheetId,
    folderId: config.folderId,
    sheetName: config.sheetName,
    id: record.id,
    tagType: record.tagType,
    tagNumber: record.tagNumber,
    vialNumber: record.vialNumber || '',
    capturedAt: normalizeCaptureDate(record.capturedAt),
    species: record.species,
    lengthInches: record.lengthInches,
    measurementType: record.measurementType,
    measurementAccuracy: record.measurementAccuracy,
    locationName: record.locationName,
    latitude: record.latitude,
    longitude: record.longitude,
    gridCellId: record.gridCellId || '',
    condition: record.condition,
    photoBase64: record.photoBase64 || ''
  };
}

function ensureSyncFrame() {
  let frame = document.getElementById('scdnr-sync-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'scdnr-sync-frame';
    frame.name = 'scdnr-sync-frame';
    frame.title = 'SCDNR sync';
    frame.style.display = 'none';
    document.body.appendChild(frame);
  }
  return frame;
}

/** Hidden form POST — most reliable way to reach Google Apps Script webhooks. */
export function postViaHiddenForm(webhookUrl, payloadJson) {
  ensureSyncFrame();
  return new Promise((resolve, reject) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = webhookUrl;
    form.target = 'scdnr-sync-frame';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = payloadJson;
    form.appendChild(input);

    let settled = false;
    const finish = (ok, err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      form.remove();
      if (ok) resolve({ success: true, method: 'form-post' });
      else reject(err);
    };

    const timer = setTimeout(() => finish(true), 8000);
    const frame = document.getElementById('scdnr-sync-frame');
    frame.onload = () => finish(true);
    frame.onerror = () => finish(false, new Error('Sync form post failed'));

    document.body.appendChild(form);
    form.submit();
  });
}

async function postJsonBody(webhookUrl, payloadJson) {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payloadJson
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true, method: 'fetch', verified: true, data };
      throw new Error(data.error || 'Webhook rejected catch');
    }
    throw new Error(`Webhook HTTP ${res.status}`);
  } catch (err) {
    if (err.message && !/failed to fetch|network|JSON/i.test(err.message)) {
      throw err;
    }
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payloadJson
    });
    return { success: true, method: 'fetch-no-cors', verified: false };
  }
}

async function postPayload(webhookUrl, payloadJson) {
  if (payloadJson.length <= FORM_POST_LIMIT) {
    try {
      const result = await postJsonBody(webhookUrl, payloadJson);
      if (result.verified) return result;
    } catch {
      /* Apps Script often 302/405 on fetch — fall back to form POST */
    }
  } else {
    try {
      const result = await postJsonBody(webhookUrl, payloadJson);
      if (result.verified) return result;
    } catch {
      /* fall through */
    }
  }
  await postViaHiddenForm(webhookUrl, payloadJson);
  return { success: true, method: 'form-post' };
}

/**
 * Sync one catch: metadata first, photo in a follow-up request if needed.
 */
export async function syncRecord(webhookUrl, record) {
  const full = prepareRecordForSync(record);
  const photoBase64 = full.photoBase64;
  const meta = { ...full, photoBase64: '' };
  const metaJson = JSON.stringify(meta);

  await postPayload(webhookUrl, metaJson);

  if (photoBase64) {
    const photoJson = JSON.stringify({
      photoOnly: true,
      authToken: meta.authToken,
      id: meta.id,
      sheetId: meta.sheetId,
      folderId: meta.folderId,
      sheetName: meta.sheetName,
      photoBase64
    });
    await postPayload(webhookUrl, photoJson);
  }

  return { success: true, method: 'split-sync' };
}

export async function pingWebhook(webhookUrl) {
  const config = getSyncConfig();
  const url = webhookUrl || config.webhookUrl;

  if (!isWebhookConfigured(url)) {
    return { ok: false, message: 'Webhook URL not configured in src/config.js' };
  }
  if (!config.sheetId || config.sheetId === 'YOUR_SHEET_ID') {
    return { ok: false, message: 'Enter your Sheet ID on the Sync tab (or in src/config.js)' };
  }
  if (!config.folderId || config.folderId === 'YOUR_DRIVE_FOLDER_ID') {
    return { ok: false, message: 'Enter your photo folder ID on the Sync tab (or in src/config.js)' };
  }

  try {
    const diagUrl = url.includes('?')
      ? `${url}&diag=1`
      : `${url}?diag=1`;
    const res = await fetch(diagUrl, { method: 'GET' });
    if (!res.ok) {
      return { ok: false, message: `Webhook HTTP ${res.status} — check deployment URL` };
    }
    const data = await res.json();
    if (!data.scriptVersion) {
      return {
        ok: false,
        message: 'Apps Script is outdated — paste latest Code.gs, Save, Deploy → New version'
      };
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data.sampleSyncDate || '')) {
      return {
        ok: false,
        message: `Webhook v${data.scriptVersion} has bad date format — redeploy latest Code.gs`
      };
    }
    return {
      ok: true,
      message: `Webhook ready (${data.scriptVersion}) — dates sync as MM/DD/YYYY`
    };
  } catch {
    return {
      ok: false,
      message: 'Cannot reach webhook — check URL and Apps Script deployment'
    };
  }
}

export async function syncAllRecords(webhookUrl, onProgress, { force = false } = {}) {
  const config = getSyncConfig();
  const url = webhookUrl || config.webhookUrl;

  if (!isGoogleConfigComplete(config)) {
    throw new Error('Submission is temporarily unavailable. Please try again later.');
  }

  const records = await getAllCatches();
  const pending = force
    ? records
    : records.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'failed');

  if (pending.length === 0) {
    return { synced: 0, failed: 0, errors: [], skipped: records.length };
  }

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < pending.length; i++) {
    const record = pending[i];
    onProgress?.({ current: i + 1, total: pending.length });

    try {
      await syncRecord(url, record);
      await updateCatch(record.id, {
        syncStatus: 'synced',
        syncedAt: normalizeCaptureDate(new Date().toISOString())
      });
      synced++;
    } catch (err) {
      await updateCatch(record.id, { syncStatus: 'failed' });
      failed++;
      errors.push({ id: record.id, message: err.message });
    }

    if (i < pending.length - 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  return { synced, failed, errors };
}

export async function syncPendingRecords(webhookUrl, onProgress) {
  return syncAllRecords(webhookUrl, onProgress);
}
