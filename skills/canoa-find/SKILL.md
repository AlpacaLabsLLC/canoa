---
name: canoa-find
description: >
  Search the Canoa catalog by category, brand, dimensions, materials, price,
  lead time, or natural language. Use when the designer says "find me…",
  "show me…", "what walnut tables under $3k", "any chairs like the Aeron but
  cheaper", "is there a Hay sofa with COM", "what's in the catalog from Vitra",
  or any catalog discovery request. Returns manufacturer-cited results with
  tier (verified / observed / candidate).
allowed-tools: mcp__canoa__catalog_search
---

# Catalog Search

Searches the Canoa catalog via `canoa.catalog_search`. The tool accepts structured filters and natural-language queries — it has the live catalog vocabulary, so it picks from real values instead of guessing.

## How to invoke

Capture the designer's full query and call `canoa.catalog_search` with it. The server handles routing between structured filters (price/material/dimension) and NL extraction. Don't pre-filter or pre-parse on your side.

```
canoa.catalog_search({ query: "walnut tables under 3000" })
```

If the designer's request is ambiguous (e.g., "what about Hay" with no prior context), ask one clarifying question before calling — but err toward calling.

## What you get back

A result list with manufacturer (canonical, dealer-stripped), product name + designer, list price (or "from" for configurables), tier, lead time when available, image URL when enriched, and the canonical vendor URL.

Present results unparaphrased. If the catalog is sparse (no hits, or only candidate-tier results), say so honestly and offer the next step:

- Paste a vendor URL to ingest a specific product → `/canoa-parse-url`
- Paste a dealer-quote PDF → `/canoa-parse-pdf`
- Broaden the query

Don't fabricate alternatives. False confidence costs designer trust.

## Configurable results

If a result is configurable (Aeron, Steelcase Leap, Swoop, Aeron Stool), `catalog_search` returns the family + option-matrix metadata but no fixed price. Suggest `/canoa-spec` to walk through options and lock a configuration.

## Auto-enqueue

When a result has sparse data (missing description, materials, image_url) and a vendor_url, Canoa auto-enqueues a refresh job. Surface this only when relevant: *"I have the basics; richer specs are queued for enrichment."* Don't claim it'll appear "in a few minutes" — no end-user-visible timeline exists.

## Tier

Every product carries a tier. Cite it inline when you present the result, especially when the designer is comparison-shopping:

- **verified** — manufacturer source retained
- **observed** — community / dealer-quote derived; partial; cite carefully
- **candidate** — LLM-suggested, not yet validated; don't ship in a spec book without verifying
