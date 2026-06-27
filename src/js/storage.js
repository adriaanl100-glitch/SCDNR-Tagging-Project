/**
 * IndexedDB storage via LocalForage (loaded globally in index.html).
 */
const lf = typeof localforage !== 'undefined' ? localforage : null;

if (lf) {
  lf.config({
    name: 'SCDNRTagLogging',
    storeName: 'scdnr-catches'
  });
}

export async function getAllCatches() {
  if (!lf) return [];
  const records = await lf.getItem('records');
  return Array.isArray(records) ? records : [];
}

export async function saveCatch(record) {
  const records = await getAllCatches();
  records.push(record);
  await lf.setItem('records', records);
  return record;
}

export async function updateCatch(id, updates) {
  const records = await getAllCatches();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Record not found');
  records[idx] = { ...records[idx], ...updates };
  await lf.setItem('records', records);
  return records[idx];
}

export async function updateCatches(updatedList) {
  await lf.setItem('records', updatedList);
}

export async function markAllAsUnsent() {
  const records = await getAllCatches();
  const updated = records.map((r) => ({
    ...r,
    syncStatus: 'pending',
    syncedAt: null
  }));
  await lf.setItem('records', updated);
  return updated;
}

export async function clearAllCatches() {
  await lf.setItem('records', []);
}

export function countPending(records) {
  return records.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'failed').length;
}

export function countSynced(records) {
  return records.filter((r) => r.syncStatus === 'synced').length;
}

export function generateId() {
  return crypto.randomUUID();
}
