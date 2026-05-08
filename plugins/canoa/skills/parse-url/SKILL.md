---
name: parse-url
description: Parse a vendor or manufacturer product URL into the Canoa catalog. Use when the designer pastes a URL with "parse this", "ingest this product", "add this URL to the catalog", "what's at this link", "verify this price", "look up this URL", or any request to turn a manufacturer / dealer / configurator URL into a structured catalog entry. Routes canoa_chat → parse_product_url server-side. Captures manufacturer (canonical, dealer-stripped), product, designer, list price, sale price, dimensions, materials, image URL, and tier=verified.
allowed-tools:
  - mcp__canoa__canoa_chat
---

# /canoa:parse-url — Ingest a Vendor URL

Takes a URL the designer has on hand and converts it into a structured, verified-tier catalog entry. The actual fetch + LLM extraction happens server-side via `parse_product_url`; this skill is a thin relay.

## When to use this skill

- Designer pastes a manufacturer line-card or product-page URL: *"parse this"* / *"ingest this"*
- Designer wants to verify a price they're seeing live (refresh a stale catalog row)
- Designer locked a configuration in a manufacturer's configurator and wants the resulting SKU page parsed
- Dealer-site URLs (DWR, YDesign, etc.) — the parser will canonicalize the manufacturer (e.g., DWR → Hay/Hem/Audo Copenhagen, NOT DWR)

For PDFs (dealer quotes, vendor line cards, trade-show catalogs), use `/canoa:parse-pdf` instead.

## How to invoke

Capture the URL verbatim and relay through `canoa_chat`:

```
canoa_chat("parse this URL: https://www.hermanmiller.com/products/seating/office-chairs/aeron-chairs/")
```

If the designer pasted a URL without instruction, treat it as an implicit parse request and confirm: *"Parsing <host> for <product if recognizable> — give me a few seconds."* Then relay.

## What the server returns

Parse output includes:

- **Manufacturer** (canonical — dealer name stripped if the URL was a dealer site)
- **Product name** + collection if applicable
- **Designer** (e.g., Don Chadwick for Aeron) when on the page
- **List price** (regular catalog price)
- **Sale price** (only if the page shows an active sale — separate column from list)
- **Variants** (size / color / material SKUs when enumerated)
- **Configurable option matrix** (when the page is a configurator, with `valid_when` dependency clauses)
- **Dimensions, materials, image URL**
- **Tier**: verified (manufacturer source retained)

## De-duplication

Parses are de-duplicated server-side by `vendor_url` (the canonical canonical URL). If the URL was already parsed, the catalog refreshes the existing row in place — `last_verified_at` is bumped, list/sale prices update if changed, no duplicate row is created. If the price changed since the last parse, the agent surfaces the diff explicitly: *"List price was $1,235; now $1,345 — updated."*

## Audit-on-touch rule

If the designer is checking, auditing, or verifying a row that's already on their master sheet, **always re-parse** — don't rely on the cached catalog value, even if it looks recent. See `/canoa:audit` for the dedicated audit flow. This skill auto-re-parses when the URL is already in the catalog.

## When parsing fails

If `parse_product_url` returns an error (404, paywall, JS-only render, captcha), surface the error in plain language. Don't fall back to training-data recall ("I think the Aeron is around $1,500…") — that defeats the spec-grade-trust contract Canoa is built on. Instead, suggest:

- Different URL (e.g., manufacturer's canonical product page instead of a dealer's listing)
- A dealer-quote PDF via `/canoa:parse-pdf`
- Manual entry through the master sheet for an unverified placeholder
