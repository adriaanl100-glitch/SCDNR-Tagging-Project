/**
 * SCDNR Tag Logging — Google Apps Script Webhook
 *
 * Setup:
 * 1. Create a Google Sheet with headers in row 1 (see docs/data-schema.md)
 * 2. Create a Google Drive folder for catch photos
 * 3. Project Settings → Script Properties → add these properties:
 *      SHEET_ID      = your Google Sheet ID
 *      FOLDER_ID     = your Drive photo folder ID
 *      WEBHOOK_TOKEN = a long random shared secret (give the same value to taggers)
 *    (IDs/secrets live in Script Properties, never in this committed file.)
 * 4. Deploy as Web App: Execute as Me, Who has access: Anyone
 * 5. Copy deployment URL + token into the app's Sync tab (or src/config.js)
 *
 * After editing: Save, then Deploy → Manage deployments → Edit → New version → Deploy
 * Verify: open your /exec URL in a browser — JSON should include "scriptVersion".
 */

const SCRIPT_VERSION = '2026-06-27j';
const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const FOLDER_ID = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
const WEBHOOK_TOKEN = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
const SHEET_NAME = 'Catches';
const COL_CAPTURED_AT = 5;
const COL_SYNCED_AT = 16;

function isPlaceholderId_(value, placeholder) {
  return !value || value === placeholder;
}

function resolveSheetId_(data) {
  if (!isPlaceholderId_(SHEET_ID, 'YOUR_SHEET_ID')) return SHEET_ID;
  if (data && data.sheetId) return data.sheetId;
  throw new Error('Enter Sheet ID on the Sync tab (or set SHEET_ID in src/config.js)');
}

function resolveFolderId_(data) {
  if (!isPlaceholderId_(FOLDER_ID, 'YOUR_DRIVE_FOLDER_ID')) return FOLDER_ID;
  if (data && data.folderId) return data.folderId;
  throw new Error('Enter photo folder ID on the Sync tab (or set FOLDER_ID in src/config.js)');
}

function resolveSheetName_(data) {
  if (data && data.sheetName) return data.sheetName;
  return SHEET_NAME;
}

function openTargetSheet_(data) {
  const sheetId = resolveSheetId_(data);
  const sheetName = resolveSheetName_(data);
  return SpreadsheetApp.openById(sheetId).getSheetByName(sheetName)
    || SpreadsheetApp.openById(sheetId).getSheets()[0];
}

/**
 * Returns true when the request carries the correct shared secret.
 * If WEBHOOK_TOKEN is not configured in Script Properties the endpoint
 * stays open (so a fresh deploy keeps working) — set WEBHOOK_TOKEN to enforce.
 */
function isAuthorized_(data) {
  if (!WEBHOOK_TOKEN) return true;
  const provided = data && (data.authToken || data.auth_token);
  return provided === WEBHOOK_TOKEN;
}

/** Apps Script ContentService cannot set real HTTP codes, so the 401 is carried in the body. */
function unauthorizedResponse_() {
  return jsonResponse({
    success: false,
    status: 401,
    error: 'Unauthorized — invalid or missing webhook token',
    scriptVersion: SCRIPT_VERSION
  });
}

function parseRequestBody_(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  throw new Error('Missing payload — send JSON as post body or form field "payload"');
}

function getRawTimestamp_(data) {
  return data.capturedAt || data.timestamp || data.date || '';
}

function parseSheetDate_(value) {
  if (!value) return new Date();
  const str = String(value).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatLogDate_(isoOrDateStr) {
  if (!isoOrDateStr) return '';
  const d = isoOrDateStr instanceof Date ? isoOrDateStr : parseSheetDate_(isoOrDateStr);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'MM/dd/yyyy');
}

function formatTodayDate_() {
  return formatLogDate_(new Date());
}

function writeSheetDates_(sheet, rowId, captureRaw) {
  // Plain text only — Date objects export to Excel as ISO timestamps.
  const captureText = formatLogDate_(captureRaw);
  const syncText = formatTodayDate_();
  sheet.getRange(rowId, COL_CAPTURED_AT).setNumberFormat('@').setValue(captureText);
  sheet.getRange(rowId, COL_SYNCED_AT).setNumberFormat('@').setValue(syncText);
}

function formatCoordinate_(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  if (isNaN(n)) return '';
  return n.toFixed(4);
}

function toMeasurementTypeInitials_(type) {
  if (!type) return '';
  const t = String(type).toLowerCase();
  if (t === 'fork') return 'FL';
  if (t === 'tail' || t === 'total') return 'TL';
  return '';
}

function toMeasurementAccuracyInitials_(accuracy) {
  if (!accuracy) return '';
  const a = String(accuracy).toLowerCase();
  if (a === 'measured') return 'M';
  if (a === 'estimated') return 'E';
  return '';
}

function toConditionInitials_(condition) {
  if (!condition) return '';
  const c = String(condition).toLowerCase();
  if (c === 'good') return 'G';
  if (c === 'fair') return 'F';
  if (c === 'poor') return 'P';
  return '';
}

function getGridId_(data) {
  return data.gridId || data.gridCellId || '';
}

function buildLogRow_(data, imageUrl) {
  // Column order must match docs/data-schema.md (A–P). Dates written after append.
  return [
    data.id || '',                                    // A Record ID
    data.tagType || '',                               // B Tag Type
    data.tagNumber || '',                             // C Tag Number
    data.vialNumber || '',                            // D Vial Number
    '',                                               // E Captured At (set below as text)
    data.species || '',                               // F Species
    data.lengthInches ?? '',                          // G Length (in)
    toMeasurementTypeInitials_(data.measurementType), // H Measurement Type
    toMeasurementAccuracyInitials_(data.measurementAccuracy), // I Measurement Accuracy
    data.locationName || '',                          // J Location Name
    formatCoordinate_(data.latitude),                 // K Latitude
    formatCoordinate_(data.longitude),                // L Longitude
    getGridId_(data),                                 // M Grid Cell ID
    toConditionInitials_(data.condition),             // N Condition
    imageUrl || '',                                   // O Photo URL
    '',                                               // P Synced At (set below as text)
  ];
}

function findRowById_(sheet, recordId) {
  if (!recordId) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(recordId)) return i + 2;
  }
  return -1;
}

function updatePhotoForRecord_(data) {
  const sheet = openTargetSheet_(data);
  const rowId = findRowById_(sheet, data.id);
  if (rowId === -1) throw new Error('Record not found: ' + data.id);

  const imageUrl = savePhotoToDrive(data.photoBase64, data.id, data);
  sheet.getRange(rowId, 15).setValue(imageUrl);
  return { rowId: rowId, imageUrl: imageUrl };
}

function doPost(e) {
  try {
    const data = parseRequestBody_(e);

    if (data.ping === true) {
      return jsonResponse({
        success: true,
        pong: true,
        service: 'SCDNR Tag Logging Webhook',
        scriptVersion: SCRIPT_VERSION
      });
    }

    // All data-writing requests must present the shared secret.
    if (!isAuthorized_(data)) {
      return unauthorizedResponse_();
    }

    if (data.photoOnly === true) {
      const result = updatePhotoForRecord_(data);
      return jsonResponse({
        success: true,
        rowId: result.rowId,
        imageUrl: result.imageUrl,
        scriptVersion: SCRIPT_VERSION
      });
    }

    const sheet = openTargetSheet_(data);

    // Upsert by Record ID (col A) so re-syncing a catch updates its row
    // instead of creating a duplicate.
    const existingRow = findRowById_(sheet, data.id);
    let rowId;
    let existingImageUrl = '';
    if (existingRow !== -1) {
      rowId = existingRow;
      existingImageUrl = sheet.getRange(rowId, 15).getValue();
      const row = buildLogRow_(data, existingImageUrl);
      sheet.getRange(rowId, 1, 1, row.length).setValues([row]);
    } else {
      const row = buildLogRow_(data, '');
      sheet.appendRow(row);
      rowId = sheet.getLastRow();
    }
    writeSheetDates_(sheet, rowId, getRawTimestamp_(data));

    let imageUrl = existingImageUrl || '';
    if (data.photoBase64) {
      try {
        imageUrl = savePhotoToDrive(data.photoBase64, data.id || Utilities.getUuid(), data);
        sheet.getRange(rowId, 15).setValue(imageUrl);
      } catch (photoErr) {
        // Catch row is saved even if Drive upload fails.
      }
    } else if (existingImageUrl) {
      sheet.getRange(rowId, 15).setValue(existingImageUrl);
    }

    return jsonResponse({ success: true, rowId: rowId, imageUrl: imageUrl, scriptVersion: SCRIPT_VERSION });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message, scriptVersion: SCRIPT_VERSION });
  }
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (params.diag === '1') {
    return jsonResponse({
      status: 'ok',
      service: 'SCDNR Tag Logging Webhook',
      scriptVersion: SCRIPT_VERSION,
      sampleCaptureDate: formatLogDate_('2026-06-27T07:36:11.342Z'),
      sampleSyncDate: formatTodayDate_()
    });
  }
  return jsonResponse({
    status: 'ok',
    service: 'SCDNR Tag Logging Webhook',
    scriptVersion: SCRIPT_VERSION
  });
}

function savePhotoToDrive(base64Data, recordId, data) {
  const folder = DriveApp.getFolderById(resolveFolderId_(data || {}));
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', 'catch_' + recordId + '.jpg');
  const file = folder.createFile(blob);
  // Photo stays private — only the Drive folder owner (and anyone they
  // explicitly share with) can view it. No public link is created.
  return file.getUrl();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
