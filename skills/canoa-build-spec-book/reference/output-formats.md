# Output formats

## PDF (default for client delivery)

The server returns a print-ready HTML page with `window.print()` triggered on load. The designer's browser opens its print dialog and they save to PDF via Cmd+P → Save as PDF. Native server-rendered PDF (via Cloudflare Browser Rendering) is a v1.1 follow-up.

- **Cover** — project name, client name, studio name, issue date, items count
- **Item block** — table per category; identifiers, specs, price, URL linkified
- **Footer** — studio footer line (default: "Specifications subject to change — verify before order placement"); designer can override per-export
- **Page break** — CSS `page-break-inside: avoid` on `<tr>` keeps rows whole; categories flow naturally
- **Print stylesheet** — A4-margined, header + footer reserved; brand color rule on category headings (terracotta default, override via `brand_template.primary_color`)

Designer logo: top-right of cover. Logo URL pulled from the studio profile; if not set, the cover renders without one.

## HTML (same as PDF without auto-print)

Identical render to the PDF format minus the auto-trigger. Useful when the designer wants to view in-browser without immediately seeing the print dialog. Same 24h signed-URL retrieval; same print stylesheet — designer can still Cmd+P → Save as PDF.

## Google Sheets (collaborative review)

- **Sheet 1: Items** — full table of in-scope rows, columns filtered by audience profile
- **Sheet 2: Summary** — counts per category, total list price, embodied carbon total
- **Sheet 3: Audit trail** — when each row was last verified, by which audit run
- **Permissions** — copy to designer's Drive, share link auto-set to "anyone with link can comment"

Useful for handing off to a junior designer or a client who wants to comment inline. The original master schedule stays intact — exports are always copies.

## Markdown (for embedding)

- **One H2 per category** — Seating / Tables / Lighting / Casegoods
- **Each item as a table row** — manufacturer / product / variant / list price / lead time / tier
- **No thumbnails** (use [reference/thumbnails-readme.md] for the path if the designer wants them inline)

Useful for embedding in design narratives, narratives docs, or external client portals where PDF doesn't fit.

---

## What never appears

- **Dealer Net column** — redacted server-side for any audience other than `dealer`. The column literally does not leave canoa.supply.
- **Internal notes column** — redacted for `client` and `dealer` audiences
- **Candidate-tier rows in client PDFs** — either dropped or flagged with an inline tier tag, never shipped silently
- **Anthropic / Canoa branding** — these are designer artifacts. Canoa stays out of the visible deliverable. Page footer cites the audit date only, not the platform.

---

## Brand template

The brand template is per-studio. On first export, `canoa.export_spec_book` prompts for:

- Studio name (already in profile)
- Studio logo (designer uploads a PNG/SVG — stored server-side)
- Primary brand color (for headers and rules)
- Footer line text (default: "Specifications subject to change — verify before order placement")

These are stored in the studio profile and reused on every subsequent export. The designer can override per-project.
