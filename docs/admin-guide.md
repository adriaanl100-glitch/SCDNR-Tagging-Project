# Admin Guide

## Google Sheet Setup

Create a sheet named **Catches** (or update `SHEET_NAME` in `Code.gs`) with row 1 headers:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Record ID | Tag Type | Tag Number | Vial Number | Captured At | Species | Length (in) | Measurement Type | Measurement Accuracy | Location Name | Latitude | Longitude | Grid Cell ID | Condition | Photo URL | Synced At |

## Google Drive

1. Create a folder for catch photos (e.g. `SCDNR Tag Photos`)
2. Copy the folder ID from the URL
3. Paste into `FOLDER_ID` in `google-apps-script/Code.gs`

## Apps Script Deployment

1. Open [script.google.com](https://script.google.com) → New project
2. Paste contents of `google-apps-script/Code.gs`
3. Set `SHEET_ID` and `FOLDER_ID`
4. Deploy → New deployment → Web app
5. Execute as: **Me**
6. Who has access: **Anyone**
7. Copy the deployment URL into `src/config.js`:

```javascript
window.SCDNR_CONFIG = {
  WEBHOOK_URL: 'https://script.google.com/macros/s/.../exec'
};
```

## Testing the Webhook

Use **text/plain** (not application/json) — required for Google Apps Script:

```bash
# Ping test
curl -sL -X POST -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"ping":true}' \
  YOUR_WEBHOOK_URL

# Full catch test
curl -sL -X POST -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"id":"test-1","tagType":"CR","tagNumber":"12345","species":"Red Drum","lengthInches":24,"measurementType":"Tail","measurementAccuracy":"Measured","locationName":"Test","latitude":32.7,"longitude":-79.8,"condition":"Good","photoBase64":""}' \
  YOUR_WEBHOOK_URL
```

Expected response: `{"success":true,...}` — not an HTML login page.

See [google-setup-walkthrough.md](./google-setup-walkthrough.md) for the full step-by-step.

## Redeployment

After code changes, create a **New deployment** (or manage versions) so the URL stays stable or update `config.js` if the URL changes.

## Data Retention

- Synced records remain on device in **Logbook** (not deleted after sync)
- Sheet is the system of record for program leader
- Photos stored in Drive with public link in sheet column O
