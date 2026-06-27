# Google Setup Walkthrough (Step-by-Step)

This guide matches **this project's actual code**. Some generic tutorials use `export const WEBHOOK_URL` — that is **wrong here**. This app uses:

```javascript
window.SCDNR_CONFIG = {
  WEBHOOK_URL: 'https://script.google.com/macros/s/.../exec'
};
```

in `src/config.js`.

---

## Part A — Google Drive & Sheet (5 minutes)

### 1. Create the photo folder

1. Go to [Google Drive](https://drive.google.com)
2. **New → Folder** → name it `SCDNR Tag Photos`
3. Open the folder
4. Copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/1ABCxyzYOUR_FOLDER_ID
                                          ^^^^^^^^^^^^^^^^^^^
   ```

### 2. Create the catch log sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. **Blank spreadsheet** → rename to `SCDNR Catch Log`
3. In row 1, paste these headers (columns A–P):

   `Record ID` | `Tag Type` | `Tag Number` | `Vial Number` | `Captured At` | `Species` | `Length (in)` | `Measurement Type` | `Measurement Accuracy` | `Location Name` | `Latitude` | `Longitude` | `Grid Cell ID` | `Condition` | `Photo URL` | `Synced At`

4. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABCxyzYOUR_SHEET_ID/edit
                                            ^^^^^^^^^^^^^^^^^^^
   ```

---

## Part B — Apps Script (10 minutes)

### 3. Open the script editor

From your **SCDNR Catch Log** sheet:

**Extensions → Apps Script**

### 4. Paste the webhook code

1. Delete everything in the editor (default `myFunction` etc.)
2. In Cursor, open [`google-apps-script/Code.gs`](../google-apps-script/Code.gs)
3. Copy **all** of it and paste into the Apps Script editor

### 5. Set your IDs (critical)

At the top of the script, replace the placeholders:

```javascript
const SHEET_ID = 'paste-your-sheet-id-here';
const FOLDER_ID = 'paste-your-folder-id-here';
const SHEET_NAME = 'Catches';  // or rename tab to match
```

- Keep the single quotes
- If your sheet tab is still "Sheet1", either rename the tab to **Catches** or change `SHEET_NAME` to `Sheet1`
- Click **Save** (disk icon)

### 6. Deploy as Web App

1. Click **Deploy → New deployment** (always **New**, not "Manage" — Google caches old permissions)
2. Gear icon → **Web app**
3. Settings:
   - **Description:** SCDNR Catch Logging Webhook
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← required; "Only myself" causes 401 errors
4. Click **Deploy**
5. Click **Authorize access** → choose your Google account
6. On "Google hasn't verified this app" → **Advanced → Go to … (unsafe) → Allow**
7. Copy the **Web app URL** (ends in `/exec`)

---

## Part C — Wire the PWA (2 minutes)

### 7. Config file in Cursor

In terminal:

```bash
cp src/config.example.js src/config.js
```

Open `src/config.js` and paste your **new** Web app URL:

```javascript
window.SCDNR_CONFIG = {
  WEBHOOK_URL: 'https://script.google.com/macros/s/YOUR_NEW_ID/exec'
};
```

Save. (`src/config.js` is gitignored — safe for your URL.)

The app loads `config.js` from `index.html` — not `config.example.js`.

---

## Part D — Verify before testing in browser

### 8. Curl test (must pass before sync will work)

Replace `YOUR_URL` with your `/exec` URL:

```bash
curl -sL -X POST -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"ping":true}' \
  YOUR_URL
```

**Success looks like:**
```json
{"success":true,"pong":true,"service":"SCDNR Tag Logging Webhook"}
```

**Failure looks like:**
- HTML page saying "Page Not Found" or "Sign in"
- HTTP 401

If you see failure → redeploy with **Anyone** access and confirm IDs are set in the **saved** script.

Full catch test:

```bash
curl -sL -X POST -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"id":"test-1","tagType":"CR","tagNumber":"12345","species":"Red Drum","lengthInches":24,"measurementType":"Tail","measurementAccuracy":"Measured","locationName":"Test","latitude":32.7,"longitude":-79.8,"condition":"Good","photoBase64":""}' \
  YOUR_URL
```

Then open your Google Sheet — you should see a new row.

---

## Part E — Local sea trial

```bash
npm install
npm run serve
```

1. Open http://localhost:3000
2. Hard refresh: **Cmd+Shift+R**
3. Log a test catch (GPS → form → photo → **Save Catch**)
4. Open **Sync** tab — check webhook status line
5. Tap **Submit Sync to DNR**
6. Confirm row in Sheet + photo in Drive folder

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Failed to fetch` in browser | Usually fixed in app (form POST). If curl also fails, fix Google deployment first |
| HTTP 401 / Page Not Found on curl | Redeploy: **Anyone** access, new deployment |
| Row missing in sheet | Check `SHEET_ID`, tab name vs `SHEET_NAME`, Apps Script **Executions** log |
| Photo missing | Check `FOLDER_ID`, Drive permissions |
| Gemini said `export const WEBHOOK_URL` | Ignore — use `window.SCDNR_CONFIG` in `src/config.js` |

### Check Apps Script execution log

Apps Script editor → **Executions** (left sidebar). Failed runs show the exact error (bad Sheet ID, permission denied, etc.).

---

## Part F — GitHub Pages (when ready)

```bash
git remote add origin YOUR_REPO_URL
git push -u origin main
```

GitHub → repo **Settings → Pages → Source: GitHub Actions**

For production, copy `src/config.js` webhook URL into the deployed build (see [DEPLOY.md](./DEPLOY.md)).

---

## Current status of your URL

Your URL ending in `...XQatc/exec` currently returns **HTTP 401** on POST when tested from the command line. That means Google is still blocking anonymous requests — the app cannot sync until a **new deployment** with **Anyone** access succeeds in the curl ping test above.

After redeploying, paste the **new** URL into `src/config.js` and rerun the ping command.
