# GitHub Pages Deployment

## Prerequisites

1. Push this repository to GitHub
2. Enable GitHub Pages: Settings → Pages → Source: **GitHub Actions**

## Automatic Deploy

The workflow `.github/workflows/deploy.yml` deploys the `src/` folder on every push to `main`.

## Manual Deploy

```bash
npm run serve   # verify locally at http://localhost:3000
```

## Post-Deploy Checklist

- [ ] HTTPS URL loads the app
- [ ] Geolocation works (requires HTTPS)
- [ ] Add to Home Screen on iOS/Android
- [ ] Update `src/config.js` with production webhook URL before tagging a release

## Config on Production

`src/config.js` is gitignored. For GitHub Pages you have two options:

1. **Commit a non-secret config** — webhook URLs are not secret if Apps Script is deployed as "Anyone"; copy `config.example.js` → `config.js` and commit only the URL (remove from `.gitignore` if desired)
2. **GitHub Actions secret injection** — extend deploy workflow to write `config.js` from a repository secret

Recommended for this project: copy `src/config.example.js` to `src/config.js`, paste your webhook URL, and include it in deploy (Apps Script web app URLs are not credentials).
