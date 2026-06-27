# SCDNR Tag Logging PWA

Offline-first Progressive Web App for SCDNR volunteer marine fish taggers. Log catches with GPS, photos, and structured data on the water; sync to Google Sheets when back online.

## Quick Start

```bash
# Install dev dependencies
npm install

# Configure webhook (copy example and edit)
cp src/config.example.js src/config.js
# Edit src/config.js with your Google Apps Script URL

# Run locally
npm run serve
# Open http://localhost:3000

# Run tests
npm test
npm run test:e2e
```

## Project Structure

```
├── docs/                  # Specifications and guides
├── src/
│   ├── index.html         # PWA entry point
│   ├── js/                # Application modules
│   ├── manifest.json
│   └── sw.js              # Service worker
├── google-apps-script/    # Webhook for Sheet + Drive
├── tests/                 # Vitest + Playwright
└── config/                # Shared config example
```

## Configuration

1. Deploy `google-apps-script/Code.gs` — see [docs/admin-guide.md](docs/admin-guide.md)
2. Copy `src/config.example.js` → `src/config.js`
3. Set `WEBHOOK_URL` to your deployed Apps Script URL

## Documentation

- [Project brief](docs/project_brief.md)
- [Data schema](docs/data-schema.md)
- [Onboarding guide](docs/onboarding-guide.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Admin guide](docs/admin-guide.md)
- [QA checklist](docs/qa-checklist.md)

## Deployment (GitHub Pages)

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml). Enable GitHub Pages from the `gh-pages` branch or GitHub Actions artifact.

## License

Internal use — SCDNR volunteer tagging program.

