# SCDNR Tag Logging PWA — Project Brief

## Mission Objective

Eliminate manual data entry for the SCDNR marine game fish volunteer tagging program. Replace 7,000+ annual paper logs with a zero-backend, offline-first Progressive Web App (PWA) that allows ~150 volunteer taggers to log structured catch data and photos without cell service.

## Architecture

- **Format:** Single-page PWA (`src/index.html` + supporting JS modules)
- **Hosting:** GitHub Pages (static)
- **Offline:** Client-side IndexedDB via LocalForage
- **Ingest:** Google Apps Script webhook → Google Sheet + Google Drive

## Technology Stack

| Layer | Technology |
|-------|------------|
| UI | Tailwind CSS (CDN) |
| Mapping | Leaflet.js + navigator.geolocation |
| Storage | LocalForage (IndexedDB) |
| Images | HTML5 Canvas (800px max, 75% JPEG) |
| Export | JSZip (CSV + images) |
| Backend | Google Apps Script `doPost` |

## Data Schema

12 required fields — see [data-schema.md](./data-schema.md).

## Edge Cases

1. **Dead zone:** GPS button works without map tiles
2. **Image crashes:** Canvas compression before storage (~150KB)
3. **Accidental deletion:** Double-confirm modals; purge only after HTTP 200 or verified ZIP
4. **Species typos:** Strict dropdown, no free text
5. **Tag validation:** CR = 5 digits, ≥10"; K = 6 digits, ≥18"
6. **Species/tag rules:** K disabled for flounder; CR disabled for pelagics

## Mapping

- 1-square-mile dynamic grid at SC coast (~32.7°N)
- Lat delta: 0.0145°/mile; Lon delta: 0.0172°/mile
- NOAA bathymetric WMS layer toggle

## Data Ingest

- Primary: POST JSON to Google Apps Script webhook
- Fallback: IndexedDB queue + JSZip email export

## Additional Features (Evolution doc)

- **My Logbook:** Local history gallery (records retained after sync, flagged "Synced")
- **Photo watermark:** "SCDNR Saltwater Tagging Program" overlay before save
