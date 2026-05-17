---
name: canoa-parse-pdf
description: >
  Parse a dealer-quote PDF or manufacturer line-card PDF into the Canoa catalog.
  Use when the designer wants to ingest a quote, line card, trade-show catalog,
  configurable workbook, or any PDF with FF&E product specs and pricing.
  Phrases include "parse this PDF", "ingest this dealer quote", "extract
  products from this catalog", "add this line card", "I have a quote from
  <dealer>", or any PDF attachment with FF&E content.
allowed-tools: Read, mcp__canoa__ingest_parsed_products
---

# Ingest a PDF

Reads a PDF the designer attached, extracts product candidates from the rendered pages, and stores them in the Canoa catalog with provenance. Parsing happens client-side via Claude's native `Read` tool; the canoa MCP only ingests already-extracted structured data.

## When to use

- **Dealer quote PDF** — products with negotiated, project-specific prices
- **Vendor line-card PDF** — manufacturer's official multi-product catalog
- **Trade-show catalog** — aggregate brochure with multiple products
- **Configurable workbook** — option-matrix PDFs (Steelcase Leap configurator workbook)

For single product pages on the web, use `/canoa-parse-url`.

## Workflow

### Step 1 — Identify source kind

The designer attaches the PDF (drag-and-drop into chat). If context is missing, ask once:

> *"Is this a dealer quote (project-specific pricing), a vendor line card (public catalog), or something else?"*

Pick the right `source_kind` (`dealer_quote_pdf`, `vendor_pdf`, or `line_card`). The choice affects tier and dealer-net handling on ingestion.

### Step 2 — Read the PDF

Call the native `Read` tool on the attached file path. `Read` returns the rendered pages as multimodal content (visual + text), 20 pages per call. For PDFs longer than 20 pages:

- First call: pages 1–20
- Subsequent calls: pages 21–40, 41–60, etc.
- Concatenate extractions across calls before ingestion

### Step 3 — Extract product candidates

From the rendered pages, build a structured product array. For each product:

- **manufacturer** — the brand that makes the product, not the dealer (DWR resells Hay → manufacturer is Hay)
- **product_name** + collection if applicable
- **variants** — size / color / material SKUs when the page enumerates them
- **list_price_cents** — manufacturer list price (even when dealer-net is also shown)
- **dealer_net_cents** — only when the PDF shows a dealer-specific quoted price (server stores per-user)
- **page_reference** — string like `"p.34"` or `"pp.12–14"` for citation
- **dimensions, materials, image_url** — when surfaced

For configurable products without enumerated SKUs, leave `variants: []` — the server will synthesize placeholder SKUs with `:attr-<hash>` prefixes during ingestion.

### Step 4 — Confirm before ingestion

Show the designer the extracted product list (5–10 line summary, manufacturer + product + price + page ref). Ask:

> *"Ingest these N products into the catalog? Dealer-net pricing will be stored privately to your account."*

Wait for explicit approval. Don't ingest silently.

### Step 5 — Ingest

Call:

```
canoa.ingest_parsed_products({
  source_kind: "dealer_quote_pdf" | "vendor_pdf" | "line_card",
  source_metadata: {
    filename: "suite-ny-2026-05-08.pdf",
    designer_provided_dealer: "Suite NY",     // optional, for dealer quotes
    page_count: 12
  },
  products: [ ...extracted product candidates ]
})
```

The server:

- Canonicalizes manufacturers against the 50-mfr reference + 24-dealer exclusion list
- Synthesizes `:attr-<hash>` SKUs for variant-less configurables
- Applies dealer-net redaction (allowlist-driven, server-side only)
- Returns ingested IDs, rejected products with reasons, and warnings (e.g., "Heuristic-matched 'DWR' → 'Hay' on row 3")

Surface warnings to the designer in plain language. Don't bury them.

## Tier assignment (server-side)

- `vendor_pdf` / `line_card` → tier `verified` (manufacturer source retained)
- `dealer_quote_pdf` → tier `observed` (community-observed pricing)

## Manufacturer canonicalization examples

The server canonicalizes; the skill body shouldn't pre-guess. Examples surfaced in `warnings`:

- **Stool 60** → Artek (not Vitra, even though Vitra distributes)
- **Gather Tables** → Hem (not DWR)
- **Menu** products → Audo Copenhagen (post-2021 rebrand)
- DWR / YDesign / 2Modern / Suite NY → manufacturer detected from product; dealer name dropped

If the PDF is ambiguous (no clear manufacturer markers), the server returns the row in `rejected` with `reason: "ambiguous_manufacturer"`. Show the designer the row and ask which manufacturer to assign before re-submitting.

## Long PDFs (>20 pages)

Chunked Read calls may split a product across page boundaries (header on p.20, specs on p.21). Catch this in Step 4 cart review: if a product's spec block looks incomplete, prompt the designer:

> *"Row 7 (Hay Mags Sofa) is missing dimensions — looks like the spec sheet continues on the next page. Want me to re-read pages 20–22 and re-extract?"*

For very long line cards (100+ pages), recommend the designer split the PDF or ingest in passes by section.

## After ingest

Common next steps:

- Spec out a parsed configurable → `/canoa-spec`
- Audit existing schedule rows against the new prices → `/canoa-audit-row` or `/canoa-audit-schedule`
- Source a room using newly-ingested products → `/canoa-source-room`
