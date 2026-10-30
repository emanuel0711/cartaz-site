# Architecture and product decisions

## Current delivery

The repository contains a complete browser-based MVP: responsive navigation, private preview authentication, Designs library, visual editor, CSV/XLSX import, product validation, preview, vector PDF generation, and local file history.

The hosted preview is intentionally local-first. Supabase environment variables activate real authentication, but database migrations, RLS, Storage, and a server-side PDF worker are not included yet. Real store data must not be used until those services and policies are deployed.

## Stack

- React 18, Vite 8, and TypeScript.
- CSS design tokens with Tailwind available for utility classes.
- Zustand persisted store for browser-only preview data.
- `read-excel-file` for XLSX ingestion and a bounded CSV parser.
- `pdf-lib` for vector text and shapes in physical page sizes.
- Supabase client behind an authentication adapter.
- Vitest for domain and PDF tests.

## Core contracts

- Money is stored as integer cents; floating-point currency is not kept in domain state.
- EAN is always a string so leading zeros survive.
- A versioned `Design` contains physical dimensions in millimeters and typed elements.
- Browser preview and PDF generation read the same `Design`, `DesignElement`, and `Product` contracts.
- Uploaded images are disabled until private object Storage and server-side validation are available.

## Design tokens

| Group | Decision |
| --- | --- |
| Color | Neutral canvas and surfaces; Economix green is the only primary accent |
| Typography | System stack, weights 400/500/600, negative tracking on display headings |
| Spacing | Fluid `clamp()` scale with a 4 px base rhythm |
| Radius | 12 px controls, 18–20 px cards, 24 px panels |
| Motion | 180–220 ms; disabled by `prefers-reduced-motion` |
| Accessibility | 44 px targets, visible focus, labels for icon controls, semantic tables |

## Folder structure

```text
src/
  components/       shared shell and poster canvas
  domain/           types, fixtures, import, formatting, PDF, tests
  features/
    auth/            Supabase adapter and private preview entry
    dashboard/       home screen
    designs/         design library
    editor/          visual editor
    generation/      import, validation, preview, PDF wizard
    files/           local batch history
    settings/        brand and account state
  lib/               Supabase and safe local ID helpers
  store/             persisted preview store
  styles/            tokens and responsive application CSS
```

## Production transition

The next production milestone must add Supabase migrations and RLS, private Storage policies, server-side upload inspection, atomic design version saves, a queued PDF worker, signed downloads, observability, and integration/E2E tests. Preview `localStorage` data must not be migrated automatically into a production account.
