# QA Report

**Date:** 2026-06-25  
**Build:** Local (`npx serve src -p 3000`)  
**Tester:** Agent 9 (automated + static review)

## Summary

| Severity | Open | Fixed |
|----------|------|-------|
| P0 | 0 | 0 |
| P1 | 0 | 0 |
| P2 | 2 | 0 |

## Automated Test Results

| Suite | Result |
|-------|--------|
| Vitest unit/integration | PASS |
| Playwright E2E | PASS |

## Manual / Static Review

| ID | Area | Result | Notes |
|----|------|--------|-------|
| QA-001 | Form validation | PASS | Unit tests cover tag/species rules |
| QA-002 | Grid math | PASS | Unit tests at 32.7°N |
| QA-003 | CSV export | PASS | Headers match schema |
| QA-004 | Sync mock | PASS | Integration test for 200/500 |
| QA-005 | E2E navigation | PASS | Tabs, validation UI |
| QA-006 | Real webhook | SKIP | User must provide URL |
| QA-007 | iOS install | DEFER | Requires HTTPS deploy |
| QA-008 | Real device GPS | DEFER | Requires physical device |

## Open P2 Items

### P2-001: Google Apps Script CORS

**Description:** Browser fetch to Apps Script may require deployment as web app with "Anyone" access. Some browsers block reading response body cross-origin.

**Workaround:** Sync uses JSON POST; verify with user's deployed URL. Backup ZIP always available.

### P2-002: NOAA WMS availability

**Description:** NOAA WMS endpoint may be slow or unavailable; bathymetry toggle may show empty tiles.

**Workaround:** Standard OSM base layer always available; GPS independent of tiles.

## Sign-off

No P0/P1 defects. Ready for user webhook configuration and GitHub Pages deployment.
