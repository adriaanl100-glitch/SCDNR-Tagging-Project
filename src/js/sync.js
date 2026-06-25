import { getAllCatches, updateCatch } from './storage.js';

export async function syncPendingRecords(webhookUrl, onProgress) {
  if (!webhookUrl || webhookUrl.includes('YOUR_DEPLOYMENT_ID')) {
    throw new Error('Configure WEBHOOK_URL in config/config.js');
  }

  const records = await getAllCatches();
  const pending = records.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'failed');

  if (pending.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < pending.length; i++) {
    const record = pending[i];
    onProgress?.({ current: i + 1, total: pending.length, record });

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(record)
      });

      // no-cors returns opaque response; treat as success if no network error
      // For testable sync with mock fetch, check response.ok
      let success = true;
      if (response.type !== 'opaque' && !response.ok) {
        success = false;
      }

      if (success) {
        await updateCatch(record.id, { syncStatus: 'synced', syncedAt: new Date().toISOString() });
        synced++;
      } else {
        await updateCatch(record.id, { syncStatus: 'failed' });
        failed++;
        errors.push({ id: record.id, message: `HTTP ${response.status}` });
      }
    } catch (err) {
      await updateCatch(record.id, { syncStatus: 'failed' });
      failed++;
      errors.push({ id: record.id, message: err.message });
    }
  }

  return { synced, failed, errors };
}

/** Testable variant with full CORS response checking */
export async function syncRecord(webhookUrl, record) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    throw new Error(`Sync failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Sync failed');
  }

  return data;
}

export async function syncAllRecords(webhookUrl, onProgress) {
  const records = await getAllCatches();
  const pending = records.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'failed');

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < pending.length; i++) {
    const record = pending[i];
    onProgress?.({ current: i + 1, total: pending.length });

    try {
      await syncRecord(webhookUrl, record);
      await updateCatch(record.id, { syncStatus: 'synced', syncedAt: new Date().toISOString() });
      synced++;
    } catch (err) {
      await updateCatch(record.id, { syncStatus: 'failed' });
      failed++;
      errors.push({ id: record.id, message: err.message });
    }
  }

  return { synced, failed, errors };
}
