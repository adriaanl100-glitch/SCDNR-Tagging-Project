# Project Evolution & Strategy Summary

## Genesis

Originated from SCDNR marine game fish tagging events. Paper logs require manual transcription of 7,000+ catches annually. Goal: lightweight downloadable web utility for offline logging with spatial mapping.

## Key Architectural Pivots

1. **Raw HTML → PWA on GitHub Pages** — Mobile OS sandboxing breaks raw file GPS/storage; PWA "Add to Home Screen" grants native-like access.
2. **CSV email → Google Apps Script webhook** — Silent POST to Sheet + Drive eliminates manual import.
3. **User accounts → local logbook** — Synced records flagged locally; no server-side auth.

## Finalized Features

- Tailwind mobile-first UI
- Leaflet 1-mile grid + NOAA bathymetry
- Hardware GPS in dead zones
- Canvas compression + SCDNR watermark
- LocalForage IndexedDB
- Conditional tag/species validation from official log sheets

## Validation Rules (from official sheets)

- CR: 5 digits, ≥ 10" length
- K: 6 digits, ≥ 18" length
- K disabled for Flounder; CR disabled for pelagics
- Spotted Seatrout: DO NOT TAG warning
- Measurement type auto-defaults by species
