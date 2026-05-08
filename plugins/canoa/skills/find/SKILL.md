---
name: find
description: Search the Canoa catalog for products by category, brand, dimensions, materials, price ceiling, lead time, or natural-language description. Use when the designer asks "find me…", "show me…", "what walnut tables under $3k", "any chairs like the Aeron but cheaper", "is there a Hay sofa with COM", "what's in the catalog from Vitra", or any catalog discovery request. Routes to canoa_chat which calls catalog_search server-side (structured filters or NL extraction). Returns manufacturer-cited results with tier (verified / observed / candidate).
allowed-tools:
  - mcp__canoa__canoa_chat
---

# /canoa:find — Catalog Search

Searches the Canoa catalog. The actual search runs server-side via `canoa_chat` → `catalog_search` (D1 SQL filters or Haiku-extracted NL filters when the designer's query is too freeform for structured params).

## Input

The designer can search by:

- **Category / subcategory**: "task chairs", "pendant lighting", "side tables"
- **Brand / manufacturer**: "what does Vitra make", "Hay seating"
- **Price ceiling**: "under $1500", "$2k–$5k"
- **Materials**: "walnut", "powder-coated steel", "COM upholstery"
- **Dimensions / clearances**: "fits under a 30-inch counter"
- **Designer / collection**: "Eames work", "the Tulip series"
- **Natural-language**: "executive chair like the Aeron but cheaper", "compact pendants for low-ceiling residential"

## How to invoke

Capture the designer's full query and relay it through `canoa_chat`. Don't pre-filter or pre-parse on your side — the server-side agent handles both structured and NL routing, and it has the live catalog vocabulary so it picks from real values instead of guessing.

```
canoa_chat("find me walnut tables under 3000")
```

If the designer's request is ambiguous (e.g., "what about Hay" with no prior context), ask one clarifying question before relaying — but err toward relaying.

## What to expect back

Canoa returns a result list with:

- Manufacturer (canonical, dealer-stripped)
- Product name + designer
- Price (list, per variant or "from" for configurables)
- Tier (verified / observed / candidate)
- Lead time when available
- Image URL when enriched
- Vendor URL (manufacturer's canonical page)

Present results unparaphrased. If the catalog is sparse for the query (no hits, or only candidate-tier guesses), Canoa will say so honestly and suggest:

- Pasting a vendor URL to ingest a specific product → `/canoa:parse-url`
- Pasting a dealer-quote PDF → `/canoa:parse-pdf`
- Broadening the query

Don't fabricate alternatives Canoa didn't return. The catalog is small (~80 products today) and growing — false confidence costs designer trust.

## Configurable products

If a result is configurable (Aeron, Steelcase Leap, Swoop, Aeron Stool, etc.), Canoa returns the family + option-matrix metadata but no fixed price. Tell the designer to invoke `/canoa:spec` to walk through the option matrix and lock a configuration.

## Auto-enqueue note

When `catalog_search` returns a product with sparse data (missing description / materials / image_url) and a vendor_url, Canoa auto-enqueues a refresh job for it. Surface this to the designer when relevant: *"I have the basics from the catalog; richer specs are queued for enrichment."* Don't claim it'll appear "in a few minutes" — there's no end-user-visible enrichment timeline. Just note the queue and move on.
