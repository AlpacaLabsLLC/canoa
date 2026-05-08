---
name: parse-pdf
description: Parse a dealer-quote PDF or manufacturer line-card PDF into the Canoa catalog. Use when the designer wants to ingest a quote, line card, trade-show catalog, configurable workbook, or any PDF with product specs and pricing. Phrases include "parse this PDF", "ingest this dealer quote", "extract products from this catalog", "add this line card", "I have a quote from <dealer>", or any PDF attachment with FF&E content. Routes canoa_chat → parse_pdf server-side. Auto-detects source kind (dealer_quote_pdf, vendor_pdf, line_card) and synthesizes variant SKUs (`:attr-<hash>`) for products without enumerated SKUs.
allowed-tools:
  - mcp__canoa__canoa_chat
---

# /canoa:parse-pdf — Ingest a PDF

Takes a PDF (dealer quote, vendor line card, configurable workbook, trade-show catalog) and converts it into structured catalog entries. Server-side `parse_pdf` does the actual extraction with Haiku-first parsing and a $1.50 per-job cap.

## When to use this skill

- **Dealer quote PDF** (e.g., from Suite NY, MillerKnoll dealer, Vitra dealer): products with negotiated prices specific to this designer / project
- **Vendor line-card PDF**: manufacturer's official multi-product catalog (e.g., Hay 2026 line card, Vitra public catalog)
- **Trade-show catalog**: aggregate brochure with multiple products
- **Configurable workbook**: option-matrix PDFs (e.g., Steelcase Leap configurator workbook)

For single product pages on the web, use `/canoa:parse-url` instead.

## How to invoke

The designer must attach the PDF to the conversation (drag-and-drop or file path). Capture intent + path and relay through `canoa_chat`:

```
canoa_chat("parse this dealer quote: ./quotes/suite-ny-2026-05-08.pdf")
```

If the designer attaches without context, ask once: *"Is this a dealer quote (project-specific pricing), a vendor line card (public catalog), or something else?"* Then relay with the source kind in the message.

## What the server returns

Per-product extraction includes:

- **Manufacturer** (canonical — dealer name from the PDF header is stripped)
- **Product name + collection**
- **Variants** (size / color / material SKUs from the PDF)
- **List price** (manufacturer list, even when a dealer-net is also shown)
- **Dealer-net price** (per-user, never shared across users — redaction is allowlist-driven)
- **Lead time** (when the PDF surfaces it)
- **Page reference** (for citation: "Hay 2026 Line Card, p.34")
- **Tier**: verified for vendor PDFs / line cards; observed for dealer quotes (community-observed pricing)

### Variant SKU synthesis

For products in the PDF without enumerated SKUs (e.g., a configurable workbook with options but no variant codes), the parser synthesizes a placeholder SKU with a `:attr-<hash>` prefix. The designer can later upgrade these to canonical SKUs by parsing a manufacturer URL of the locked configuration.

## Manufacturer canonicalization

The parser uses a 50-mfr canonical reference + 24-dealer exclusion list to ensure manufacturer attribution is correct:

- **Stool 60** → Artek (not Vitra, even though Vitra distributes)
- **Gather Tables** → Hem (not DWR)
- **Menu** products → Audo Copenhagen (post-2021 rebrand)
- DWR / YDesign / 2Modern / Suite NY / etc. → manufacturer detected from product, dealer name dropped

If the PDF is ambiguous (no clear manufacturer markers), the agent surfaces this and asks before assigning.

## Cost cap and resilience

Each PDF job is capped at $1.50 of Anthropic spend. Long PDFs (50+ pages) may parse partially under the cap and return a "continued" flag — the designer can re-invoke with a page range to finish.

The parser uses retry-with-backoff on rate limits and transient extraction errors. If parsing fully fails, surface the error and the page count attempted; suggest the designer try a smaller page range or a higher-resolution version of the PDF.

## After parse

Once products are ingested, the designer often wants to spec one out (`/canoa:spec`), audit existing rows against the new prices (`/canoa:audit`), or add a parsed product to the master schedule (`/canoa:add-to-sheet`).
