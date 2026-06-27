const CSV_HEADERS = [
  'id', 'tagType', 'tagNumber', 'vialNumber', 'capturedAt', 'species',
  'lengthInches', 'measurementType', 'measurementAccuracy', 'locationName',
  'latitude', 'longitude', 'gridCellId', 'condition', 'syncStatus'
];

function escapeCsv(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(records) {
  const rows = [CSV_HEADERS.join(',')];
  for (const r of records) {
    rows.push(CSV_HEADERS.map((h) => escapeCsv(r[h])).join(','));
  }
  return rows.join('\n');
}

export async function exportBackupZip(records, JSZip) {
  const zip = new JSZip();
  zip.file('catches.csv', buildCsv(records));

  const imagesFolder = zip.folder('images');
  records.forEach((r, i) => {
    if (r.photoBase64) {
      const base64 = r.photoBase64.split(',')[1] || r.photoBase64;
      const filename = `${r.id || `catch_${i}`}.jpg`;
      imagesFolder.file(filename, base64, { base64: true });
    }
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function buildCatchPhotoFilename(record) {
  const normalized = String(record.capturedAt || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = normalized
    ? `${normalized[2]}-${normalized[3]}-${normalized[1]}`
    : (() => {
        const date = record.capturedAt ? new Date(record.capturedAt) : new Date();
        return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
      })();
  const tag = `${record.tagType || 'tag'}${record.tagNumber || 'unknown'}`;
  return `scdnr-${tag}-${d}.jpg`;
}

function prefersShareSave() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export async function savePhotoToDevice(dataUrl, filename, { interactive = false } = {}) {
  const safeName = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], safeName, { type: blob.type });

  if (prefersShareSave()) {
    if (!interactive || !navigator.canShare?.({ files: [file] })) {
      return { saved: false, method: 'manual' };
    }
    try {
      await navigator.share({ files: [file], title: 'SCDNR catch photo' });
      return { saved: true, method: 'share' };
    } catch (err) {
      if (err.name === 'AbortError') return { saved: false, method: 'cancelled' };
      throw err;
    }
  }

  downloadBlob(blob, safeName);
  return { saved: true, method: 'download' };
}

export { CSV_HEADERS };
