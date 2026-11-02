# Cartaz Economix

Modern replacement for Cartaz TLT: create reusable designs, validate product batches, preview posters, and export vector PDFs for printing.

## Current release

The functional English local MVP includes responsive navigation, a Designs library, a visual editor with abstract spreadsheet tokens, CSV/XLSX import, modal product-name correction, TLT HAR migration, poster preview, vector PDF generation, portable backup, and local file history.

## Run locally

```bash
npm install
npm run dev
```

Checks:

```bash
npm run check
npm test
npm run build
npm audit
```

Open the local address printed by Vite. The production build can be served on a regular Windows PC with:

```bash
npm run build
npx serve dist
```

The application is local-first and makes no GPT/LLM calls. Product, design, batch, brand, and font data are stored in IndexedDB. Supabase remains optional and off unless both variables below are configured:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without these variables, the app opens directly in clearly labeled **Local mode**; there is no pretend login.

## Impact font

Impact is proprietary and is not included. Open **Settings → Impact font** to upload your own licensed `impact.ttf` (maximum 5 MB). It stays in IndexedDB on that computer. Without it, the bundled open-license Anton font is used in both preview and PDF, and the UI shows a warning.

## Backup and restore

Open **Settings → Local backup**. **Export all data** creates one versioned JSON backup. **Import backup** validates the schema and asks before replacing all local data.

## Import saved TLT posters

Open **Designs → Import from TLT** and select a sanitized HAR capture that contains `GetCartazes`/`GetModelos` plus the `LerDesignText`, `LerDesignImg`, and `LerDesignBack` responses. Each poster receives an imported/partial/failed report. If only a flattened poster is available, use **Import background image** and place dynamic boxes over it manually. PDF backgrounds are not yet accepted by this fallback.

Read [docs/TLT_FORMAT.md](docs/TLT_FORMAT.md), [docs/TEST_REPORT.md](docs/TEST_REPORT.md), and [docs/AUDIT_HANDOFF.md](docs/AUDIT_HANDOFF.md) before production use.
