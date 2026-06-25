# QA Checklist

## Installation (post-deploy)

- [ ] iOS Safari: Add to Home Screen works
- [ ] Android Chrome: Install App works
- [ ] App opens full-screen without browser chrome

## Catch Form

- [ ] GPS button captures lat/long
- [ ] Map grid renders when online
- [ ] Map cell click sets coordinates
- [ ] Bathymetry toggle switches layer
- [ ] All 12 fields present
- [ ] CR tag: rejects non-5-digit numbers
- [ ] K tag: rejects non-6-digit numbers
- [ ] Length minimum enforced (CR 10", K 18")
- [ ] Species dropdown only (no free text)
- [ ] K disabled for flounder species
- [ ] CR disabled for pelagic species
- [ ] Spotted Seatrout shows DO NOT TAG warning
- [ ] Measurement auto-defaults by species
- [ ] Photo capture and preview work
- [ ] Save Catch resets form and increments counter

## Offline / Dead Zone

- [ ] Airplane mode: GPS button still works
- [ ] Airplane mode: Save Catch persists to IndexedDB
- [ ] Offline banner visible when offline
- [ ] Unsent counter accurate after reload

## Sync

- [ ] Submit Sync POSTs to webhook (with valid config)
- [ ] HTTP 200 marks records synced in logbook
- [ ] Failed sync shows "Ingest Failed — Try Again"
- [ ] Progress bar updates during sync

## Export & Purge

- [ ] Download Backup ZIP contains CSV + images
- [ ] Clear logs requires double confirmation
- [ ] Purge after ZIP only after user confirms post-download
- [ ] Synced records retained in logbook after sync

## PWA / Performance

- [ ] Service worker registers
- [ ] Photo compression ≤ ~200KB
- [ ] 10+ catches save without crash

## Automated (CI)

- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
