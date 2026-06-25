# Agent Handoff Document

## Phase Gates

| Phase | Agent | Done When |
|-------|-------|-----------|
| 0 | Agent 1 | docs/, AGENTS.md, config.example.js exist |
| 0 | Agent 2 | docs/ui-design-spec.md approved |
| 1 | Agent 3 | Form validates, saves locally |
| 2 | Agent 4 | Map, grid, GPS working |
| 2 | Agent 5 | Compression ≤200KB |
| 3 | Agent 6 | Sync, ZIP, purge rules |
| 3 | Agent 7 | Code.gs + Sheet mapping |
| 4 | Agent 8 | npm test passes |
| 4 | Agent 9 | qa-checklist.md executed |
| 5 | Agent 10 | README + guides complete |
| 6 | Agent 11 | GitHub Pages + CI stub |

## Module Ownership

- **Agent 3:** `src/index.html`, `src/js/app.js`, `src/js/validation.js`, `src/js/species.js`, `manifest.json`, `sw.js`
- **Agent 4:** `src/js/grid.js`, `src/js/map.js`
- **Agent 5:** `src/js/image.js`
- **Agent 6:** `src/js/storage.js`, `src/js/sync.js`, `src/js/export.js`
- **Agent 7:** `google-apps-script/Code.gs`, `docs/data-schema.md` (Sheet cols)
- **Agent 8:** `tests/`, `package.json`, `vitest.config.js`, `playwright.config.js`

## Contracts

See [docs/data-schema.md](./docs/data-schema.md) for JSON shape and field names (camelCase throughout).
