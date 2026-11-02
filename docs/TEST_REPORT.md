# Adversarial test report — 2026-11-02

> Evidence labels: `[VERIFIED]` executed and observed; `[CODE REVIEWED]` inspected without execution; `[ASSUMPTION]` not verified. This report intentionally records incomplete work.

## Summary

| Round | Verified passes | Confirmed failures fixed | Open / unverified |
| --- | ---: | ---: | ---: |
| 1 — Functional walkthrough | 8 | 1 | 7 |
| 2 — Fonts and text | 3 | 1 | 7 |
| 3 — Data and spreadsheet fuzzing | 9 | 3 | 8 |
| 4 — State, storage, concurrency | 3 | 1 | 8 |
| 5 — UI, accessibility, security | 6 | 1 | 7 |

The Vitest suite finished with **17/17 passing tests**. `npm run check` and `npm run build` passed. `pnpm audit --json` reported zero known vulnerabilities after removing ESLint 10, whose transitive minimatch dependency had one moderate advisory. `[VERIFIED]`

The repository includes Playwright specs for 390/768/1440 px, but the CLI run could not start because the managed executor has no Playwright browser binary. Installing a separate browser was intentionally not attempted because managed Sites QA uses the available cloud browser. The same core workflow was exercised through that browser's Playwright API. `[VERIFIED]`

## Round 1 — Functional walkthrough

### Plan

Open every primary route, confirm local mode, exercise Designs → Editor → Generate → Review, edit a product description in the modal, reach PDF output, and check invalid deep links and browser navigation.

### Executed

- Home opened without a pretend login and displayed `Local workspace`. `[VERIFIED]`
- Designs loaded and showed TLT import controls. `[VERIFIED]`
- Editor loaded; adding text exposed the font selector; dynamic tool buttons showed exact abstract headers such as `DESCRICAO`, `REFERENCIA`, `EAN`, and `PRECO NORMAL`. `[VERIFIED]`
- Generate reached Review data with 10 synthetic products and no blocking errors. `[VERIFIED]`
- Description editing opened an accessible Radix dialog containing original value, textarea, count, live preview, Cancel, and Save; saving updated the table and exposed Undo. `[VERIFIED]`
- The real 8.9 MB sanitized TLT HAR was selected through the browser and produced `1 converted, 30 unavailable`; the captured `Super Dia E (TLT import)` design appeared in the library. The end-to-end automation call, including browser file synchronization, took about 248 seconds, so importer responsiveness remains a performance risk. `[VERIFIED]`
- A one-product browser PDF generation reached the visible `PDF generated` success state and created a Files-history entry with `Download again`. The automation did not observe a browser download event or synchronized PDF file, so the actual downloaded bytes remain unverified. Unit PDF generation and parsing passed. `[VERIFIED]`
- Settings visibly showed Local mode, IndexedDB disclosure, Anton fallback warning, Impact upload, and backup controls. Files, refresh-at-each-step, back/forward state, invalid deep links, and backup download/restore were not completed in browser QA. `[VERIFIED]`

### Failure and fix

The first modal automation matched a canvas element labelled “Description” instead of the textarea. The E2E locator was corrected to scope the textarea inside the dialog. No product defect was found. `[VERIFIED]`

Permanent coverage: `e2e/app.spec.ts` covers routes, tokens, modal save/undo, three viewports, and invalid design IDs. It remains unexecuted by the local CLI for the missing-browser reason above.

## Round 2 — Fonts and text

### Plan

Exercise bundled fallback, uploaded/corrupt font validation, Portuguese glyphs, extreme text lengths, and preview/PDF comparison.

### Executed

- Anton is bundled locally and emitted into the production build; no runtime font CDN is used. `[VERIFIED]`
- PDF generation embedded the local Anton WOFF2 with fontkit and accepted `Café, maçã, promoção, 1ª opção` in `src/domain/pdf.test.ts`. `[VERIFIED]`
- Uploaded font code rejects non-TTF extension, files over 5 MB, and invalid TrueType signatures before IndexedDB storage (`src/lib/impactFont.ts`). `[CODE REVIEWED]`
- Initial PDF tests failed because IndexedDB does not exist in Node; `loadImpactFont` now returns null in non-browser tests and the regression suite passes. `[VERIFIED]`

### Open

System Impact cannot be extracted from the OS and embedded into a vector PDF. The implemented parity path is uploaded licensed Impact or bundled Anton fallback. Exact system-Impact preview/PDF parity remains unsupported. `[VERIFIED]`

Uploaded valid/corrupt fonts were not exercised through the browser file chooser. Visual PDF-to-preview image diff, RTL shaping, combining marks, 0/1/40/120/240/1000-character screenshots, overlap detection, and zero-width/control-character visual checks remain unverified. `[ASSUMPTION]`

## Round 3 — Data and spreadsheet fuzzing

### Executed

Vitest verifies:

- Brazilian and international decimal forms: `9,99`, `1.000,00`, `1,000.00`, numeric `0.99`;
- delimiter detection without splitting decimal commas;
- quoted CSV cells;
- leading-zero EAN text;
- safe scientific-notation EAN conversion;
- duplicate mapped header rejection;
- required values;
- TLT malformed-capture rejection and observed-format conversion.

Bugs fixed:

1. The original parser treated comma, semicolon, and tab as delimiters simultaneously, corrupting `9,99` in semicolon CSV. It now selects one delimiter from the header (`src/domain/products.ts`). `[VERIFIED]`
2. Formula neutralization omitted leading `-`; text cells now cover `= + - @` (`src/domain/format.ts`). `[VERIFIED]`
3. Duplicate mapped headers and missing required headers were not rejected; both now produce a clear import error. `[VERIFIED]`

Open: encrypted XLSX, malformed ZIP, compression bombs, 16 MB+, Windows-1252 browser upload, quoted multiline cells, 5,000+ rows, 64+ columns, wrong MIME, zero-byte files, and state-preservation after parser failure were not executed as a corpus. The 16 MB/5,000/64 guards are code-reviewed only. `[CODE REVIEWED]`

## Round 4 — State, storage, and concurrency

### Executed

- Zustand persistence moved from localStorage to versioned IndexedDB storage; persisted envelopes are checked with zod and invalid envelopes are ignored (`src/lib/indexedDbStorage.ts`). `[CODE REVIEWED]`
- Backup round-trip and unsupported-version rejection pass automated tests (`src/domain/backup.test.ts`). `[VERIFIED]`
- Local mode opens without a fake password flow (`src/features/auth/AuthProvider.tsx`). `[VERIFIED]`
- The original Node PDF regression caused by missing IndexedDB was fixed. `[VERIFIED]`

Open: quota exhaustion, clearing IndexedDB mid-session, hand-corrupted live records, old-schema migration beyond the envelope version, two-tab editing, rapid double-clicks, generation cancellation, closing during generation, 100/1,000-page performance, memory measurement, and Web Worker responsiveness remain unverified. PDF generation still runs on the main thread and has no Cancel button. `[VERIFIED]`

## Round 5 — UI, accessibility, and security

### Executed

- Source search found no `dangerouslySetInnerHTML`, direct `innerHTML =`, `eval`, or `new Function` in `src`. `[VERIFIED]`
- Source search found no runtime external HTTP URL. The only `fetch` loads the Vite-bundled local Anton asset. `[VERIFIED]`
- Portuguese UI scan found no Portuguese interface strings; brand name “Cartaz” and spreadsheet tokens remain intentionally unchanged. `[VERIFIED]`
- Radix Dialog supplies focus trapping, Escape close, focus restoration, and semantic dialog roles; Save is a form submit and Enter confirms. `[CODE REVIEWED]`
- TypeScript strict check, production build, and dependency audit passed. `[VERIFIED]`
- ESLint 10 introduced a moderate transitive minimatch advisory and no project configuration; it was removed. This leaves linting unconfigured and explicitly open. `[VERIFIED]`

Open: Lighthouse, screen-reader session, complete keyboard order, contrast automation, reduced-motion verification, XSS payload execution across every field, malicious SVG upload through UI, CSP/headers, source-map exposure, and cold offline reload remain unverified. SVG is excluded by image MIME validation. `[CODE REVIEWED]`

## Final honest result

The local-first MVP builds and its 17 deterministic domain tests pass. The core browser workflow through description correction was observed. TLT HAR conversion is grounded in the real sanitized capture. It is **not** accurate to claim the five adversarial rounds are complete: performance/cancellation, browser font upload, visual PDF parity, full upload fuzzing, accessibility/Lighthouse, cold-offline behavior, and the standalone Playwright viewport suite remain open.

