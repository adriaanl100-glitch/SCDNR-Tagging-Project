# System Architecture

```
[ GitHub Pages ] → [ Mobile Browser PWA ]
                        ├── Tailwind UI
                        ├── Leaflet + NOAA WMS
                        ├── LocalForage (IndexedDB)
                        └── Canvas image pipeline
                              │
                              ▼ JSON POST
                    [ Google Apps Script ]
                        ├── → Google Sheet (row)
                        └── → Google Drive (photo URL)
```

## Client Modules

| Module | File | Owner |
|--------|------|-------|
| Validation | `src/js/validation.js` | Agent 3 |
| Species rules | `src/js/species.js` | Agent 3 |
| Grid math | `src/js/grid.js` | Agent 4 |
| Map | `src/js/map.js` | Agent 4 |
| Image pipeline | `src/js/image.js` | Agent 5 |
| Storage | `src/js/storage.js` | Agent 6 |
| Sync | `src/js/sync.js` | Agent 6 |
| Export | `src/js/export.js` | Agent 6 |
| App shell | `src/js/app.js` | Agent 3 |

## Config Injection

Webhook URL loaded from `config/config.js` (gitignored). Example in `config/config.example.js`.

## PWA

- `manifest.json` for install prompt
- `sw.js` caches app shell + CDN assets
- iOS meta tags for standalone mode
