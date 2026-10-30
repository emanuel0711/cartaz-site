# Cartaz Economix

Modern replacement for Cartaz TLT: create reusable designs, validate product batches, preview posters, and export vector PDFs for printing.

## Current release

The functional English MVP includes responsive navigation, a Designs library, visual editor, CSV/XLSX import, inline product correction, poster preview, vector PDF generation, and local file history.

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

Optional variables for Supabase Auth:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without these variables, the application runs in private preview mode and persists data in the current browser. Do not use real business data until the Supabase database, RLS, private Storage, and worker services are implemented. Read [docs/AUDIT_HANDOFF.md](docs/AUDIT_HANDOFF.md) before reviewing or publishing the system.
