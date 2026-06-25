/**
 * SCDNR Tag Logging — Google Apps Script Webhook
 *
 * Setup:
 * 1. Create a Google Sheet with headers in row 1 (see docs/data-schema.md)
 * 2. Create a Google Drive folder for catch photos
 * 3. Paste SHEET_ID and FOLDER_ID below
 * 4. Deploy as Web App: Execute as Me, Who has access: Anyone
 * 5. Copy deployment URL to src/config.js
 */

const SHEET_ID = 'YOUR_SHEET_ID';
const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';
const SHEET_NAME = 'Catches';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
      || SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

    const row = [
      data.id || '',
      data.tagType || '',
      data.tagNumber || '',
      data.vialNumber || '',
      data.capturedAt || '',
      data.species || '',
      data.lengthInches || '',
      data.measurementType || '',
      data.measurementAccuracy || '',
      data.locationName || '',
      data.latitude || '',
      data.longitude || '',
      data.gridCellId || '',
      data.condition || '',
      '', // Photo URL filled after upload
      new Date().toISOString()
    ];

    sheet.appendRow(row);
    const rowId = sheet.getLastRow();

    let imageUrl = '';
    if (data.photoBase64) {
      imageUrl = savePhotoToDrive(data.photoBase64, data.id || rowId);
      sheet.getRange(rowId, 15).setValue(imageUrl);
    }

    return jsonResponse({ success: true, rowId, imageUrl });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

function doGet() {
  return jsonResponse({ status: 'ok', service: 'SCDNR Tag Logging Webhook' });
}

function savePhotoToDrive(base64Data, recordId) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', `catch_${recordId}.jpg`);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function jsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  // Note: Apps Script web apps don't support custom HTTP status codes on output;
  // clients should check obj.success
  return output;
}

/**
 * Test payload (Run manually or via curl):
 *
 * curl -X POST -H "Content-Type: application/json" \
 *   -d '{"id":"test-1","tagType":"CR","tagNumber":"12345","species":"Red Drum","lengthInches":24,"measurementType":"Tail","measurementAccuracy":"Measured","locationName":"Test","latitude":32.7,"longitude":-79.8,"condition":"Good","photoBase64":""}' \
 *   YOUR_WEBHOOK_URL
 */
