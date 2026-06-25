# Edge Cases, Error Handling & Data Resiliency

## Low/No Connectivity

- Map tiles may fail offline; GPS button remains operational (hardware GPS independent of cell)
- Save Catch commits to IndexedDB with `syncStatus: pending`
- UI shows unsent counter badge

## Mobile Memory

- Intercept uploads through Canvas before LocalForage write
- Max width 800px, JPEG 75%, target ~150KB
- Watermark applied during compression

## Data Safety

- Clear logs requires double-confirmation modal
- Purge after sync only on HTTP 200 from webhook
- Purge after ZIP export only after download completes + user confirms
- Synced records retained locally for My Logbook (not deleted)

## Sync Failure

- Failed POST sets `syncStatus: failed`
- UI shows "Ingest Failed — Try Again"
- Records never dropped on network error
