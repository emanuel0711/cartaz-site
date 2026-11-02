# TLT saved-poster format

> Evidence labels: `[VERIFIED]` executed against the sanitized capture; `[CODE REVIEWED]` inspected in source; `[ASSUMPTION]` not confirmed.

## Evidence

- Sanitized HAR: `cartaz-tlt-sanitizado.har`, captured 2026-10-30. `[VERIFIED]`
- Earlier functional audit and two screen recordings. `[VERIFIED]`
- The HAR contains no password, cookies, authorization headers, or session token. `[VERIFIED]`

## Observed storage contract

TLT is an ASP.NET Web Forms application with JSON-returning ASMX services. Saved posters are not delivered as one export file. The browser reconstructs a design from separate responses:

| Operation | Request | Response payload |
| --- | --- | --- |
| List posters | `POST /ws/ws_inter.asmx/GetCartazes` with `{}` | JSON object whose `d` property is a JSON string containing document metadata |
| List templates | `POST /ws/ws_inter.asmx/GetModelos` with `{}` | Same nested-JSON pattern |
| Read text | `POST /ws/ws_inter.asmx/LerDesignText` with `{"ID":"…","TIPO":"CARTAZ"}` | Array of text elements |
| Read images | `POST /ws/ws_inter.asmx/LerDesignImg` | Array of image elements |
| Read background | `POST /ws/ws_inter.asmx/LerDesignBack` | Background element, commonly a PNG data URL |

`GetCartazes` exposes `ID_DOCUMENTO`, `NOME_DOC`, `TAMANHO`, `LARGURA_MM`, `ALTURA_MM`, `ORIENTACAO`, `PREVIEW`, and `FMT_BACK`. `GetModelos` exposes the equivalent `ID_MODELO` and `NOME_MODELO` fields. `[VERIFIED]`

A text element contains:

- `type: 1`;
- `name` and `img_name`;
- `plug_rect.left/top/width/height` in 96-dpi CSS pixels;
- CKEditor HTML in `html`, including font family, font size, color, alignment, z-index, and a literal `MC_*` token.

The observed design 1680 used Impact and contained `MC_DESCRICAO`, `MC_EAN`, `MC_REF`, `MC_PRNCR`, and `MC_PRPCR`. Its background was an inline PNG data URL and its image layer array was empty. `[VERIFIED]`

## New importer

`src/domain/tlt.ts:186` parses a HAR locally. It:

1. unwraps the ASMX `d` JSON string;
2. joins list metadata and three design-response groups by request `ID`;
3. converts pixels to millimetres with 96 dpi (`src/domain/tlt.ts:33`);
4. converts known `MC_*` tokens to dynamic fields while preserving the raw token;
5. extracts plain text, alignment, font size, color, and Impact declarations from CKEditor HTML;
6. keeps local image/background data URLs;
7. returns one report per listed poster: imported, partial, or failed.

The parser never evaluates imported HTML and never inserts it into the DOM. `[CODE REVIEWED]`

## Known losses and limits

- The HAR only contains full design responses for posters opened during capture. Listed posters without `LerDesign*` responses are reported as failed, not guessed.
- Complex CKEditor markup, transforms, line-height, letter-spacing, filters, and unsupported token semantics may be lost.
- TLT z-index is not yet parsed into an exact stable layer order.
- Backgrounds and images are accepted only when their data URLs can be decoded as PNG/JPEG by the preview/PDF renderer.
- The manual fallback currently accepts PNG, JPEG, or WebP as a flattened background. PDF-as-background is not implemented.
- The capture does not reveal the server database schema or an official downloadable poster-file format.

## Additional samples needed

To improve fidelity, provide sanitized HAR captures that open posters containing: overlay images, static multi-style text, rotated elements, every `MC_*` macro, a template rather than a poster, and a save operation. An official TLT export file—if the product exposes one—would also be required before claiming support for that format.

