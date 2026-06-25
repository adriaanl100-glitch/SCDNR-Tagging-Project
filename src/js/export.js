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

export { CSV_HEADERS };
