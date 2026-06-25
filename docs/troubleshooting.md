# Troubleshooting

## GPS not working

- Allow location permission when prompted
- On iOS: Settings → Safari → Location → Allow
- GPS requires HTTPS in production (localhost works for dev)
- If map is blank offline, use **Capture Current GPS Location** — it does not need map tiles

## Sync failed / Ingest Failed

- Check Wi-Fi or cellular connection
- Verify `src/config.js` has the correct webhook URL
- Retry **Submit Sync to DNR**
- Use **Download Backup ZIP** and email to program leader

## Photo won't save

- Ensure camera/storage permission is granted
- Very large photos are compressed automatically; if it still fails, try a smaller image

## App won't install to home screen

- Use Safari on iOS or Chrome on Android
- Page must be served over HTTPS (except localhost)

## Storage full

- Sync or export catches to free local space
- iOS may evict IndexedDB if device storage is critically low — sync regularly at the dock

## Species or tag type grayed out

- Tag rules are enforced by species (e.g. no K tags on flounder, no CR on mackerel)
- Change species or tag type to a valid combination
