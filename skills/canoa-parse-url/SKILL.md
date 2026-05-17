---
name: canoa-parse-url
description: >
  Parse a vendor or manufacturer product URL into the Canoa catalog. Use when
  the designer pastes a URL with "parse this", "ingest this product", "add
  this URL to the catalog", "what's at this link", "verify this price", "look
  up this URL", or any request to turn a manufacturer / dealer / configurator
  URL into a structured, verified-tier catalog entry.
allowed-tools: mcp__canoa__parse_product_url
---

# Ingest a Vendor URL

Takes a URL the designer has on hand and converts it into a structured, verified-tier catalog entry via `canoa.parse_product_url`.

## When to use

- Manufacturer line-card or product-page URL: *"parse this"*, *"ingest this"*
- Verify a price live (refresh a stale catalog row)
- A locked configurator URL → resulting SKU page
- Dealer-site URLs (DWR, YDesign, Suite NY) — the parser canonicalizes manufacturer (DWR → Hay/Hem/Audo Copenhagen, never DWR)

For PDFs, use `/canoa-parse-pdf` instead.

## How to invoke

```
canoa.parse_product_url({ url: "https://www.hermanmiller.com/products/seating/office-chairs/aeron-chairs/" })
```

If the designer pasted a URL without instruction, treat it as an implicit parse and say one short sentence: *"Parsing hermanmiller.com — give me a few seconds."* Then call the tool.

## What you get back

- **Manufacturer** (canonical, dealer-stripped)
- **Product name** + collection
- **Designer** (e.g., Don Chadwick for Aeron) when on the page
- **List price**
- **Sale price** when the page shows an active sale (separate field)
- **Variants** (size / color / material SKUs when enumerated)
- **Configurable option matrix** when the page is a configurator (with `valid_when` clauses)
- **Dimensions, materials, image URL**
- **Tier**: verified

## De-duplication

Parses are de-duplicated by canonical `vendor_url`. If the URL was already parsed, the row refreshes in place — `last_verified_at` bumps, list/sale prices update if changed, no duplicate row. If the price changed since the last parse, surface the diff: *"List price was $1,235; now $1,345 — updated."*

## Audit-on-touch

If the designer is checking, auditing, or verifying a row already in their schedule, the right skill is `/canoa-audit-row`. This skill auto-re-parses when the URL is already in the catalog, but `/canoa-audit-row` does the sheet-side bookkeeping too.

## When parsing fails

If `parse_product_url` returns an error (404, paywall, JS-only render, captcha), surface the error in plain language. Don't fall back to training-data recall ("I think the Aeron is around $1,500…") — that defeats the spec-grade-trust contract. Offer:

- A different URL (manufacturer canonical instead of dealer listing)
- A dealer-quote PDF via `/canoa-parse-pdf`
- Manual entry through the schedule for an unverified placeholder
