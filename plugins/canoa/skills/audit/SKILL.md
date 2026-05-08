---
name: audit
description: Audit rows in the master schedule against the catalog and the live vendor source. Use when the designer says "audit my schedule", "check the Eames chairs", "verify this row's price", "is this still current", "are these specs up to date", "double-check the lead times", or any verification request on existing schedule rows. Always re-parses the row's vendor URL — never trusts the cached catalog or sheet value, even if it looks recent. Surfaces drift between sheet ↔ catalog ↔ live parse with provenance, and asks before writing fixes back to the sheet.
allowed-tools:
  - mcp__canoa__canoa_chat
---

# /canoa:audit — Verify Schedule Rows

Audits rows in the designer's master schedule for staleness. Every audit doubles as a re-verification event — the skill always re-parses the row's vendor URL through `canoa_chat` → `parse_product_url`, never trusts the catalog cache or the sheet value alone.

## Why always re-parse

A bug we caught 2026-05-07: agent listed a sheet row at $1,235, called it "verified-tier from Herman Miller," reported "current — no changes needed." Catalog actually held $1,345. The designer had to nudge ("the price on the website is different"). The re-parse rule prevents this.

Stale data reported as verified erodes the spec-grade-trust contract Canoa is built on. Audit = re-verify, period.

## How to invoke

Capture the designer's audit scope and relay through `canoa_chat` with explicit re-parse intent:

- **Whole-schedule audit**: *"audit my schedule"* → relay verbatim. Server-side agent reads the sheet, picks rows older than a threshold (or the full sheet for small schedules), re-parses each row's vendor URL, surfaces drift.
- **Row-specific audit**: *"check the Eames LCW row"* → relay verbatim. Agent locates the row, re-parses the URL, compares.
- **SKU/product audit**: *"verify the Aeron in row 12 is current"* → relay verbatim. Agent re-parses by URL, not by SKU lookup.

```
canoa_chat("audit my schedule")
```

## What the server returns

For each audited row, the agent returns one of three states:

1. **Clean** — sheet ↔ catalog ↔ live parse all agree. Note `last_verified_at` updated to today; no further action.
2. **Drift** — values diverge. Surface the diff explicitly with provenance:

   > "Row 18 (Eames LCW): sheet has $1,235 list, catalog had $1,235, live parse returned $1,345 list. Source: hermanmiller.com/products/eames-lcw, parsed today. Refresh sheet to $1,345?"

   Wait for designer's approval before triggering a sheet write. Don't auto-write.
3. **Discontinued / 404** — vendor URL returns 404 or page no longer lists the product. Don't fall back to training-data recall ("I think it was still in production…"). Tell the designer plainly: *"hermanmiller.com no longer lists this URL. Confirm with the vendor before specifying."*

## Things this skill never does

- **Never claim background work.** No "the catalog is refreshing in the background," no "I'll come back with an answer in a few minutes." Canoa V1 has no background workers; state only what just happened.
- **Never recall from training data.** If a re-parse fails, say so honestly. Don't invent a price, lead time, or status.
- **Never silently fix the sheet.** Surface the drift; let the designer approve the write.

## After audit

If the designer approves a fix, the next step is a sheet update through `/canoa:add-to-sheet` (or directly via `canoa_chat` which routes to the Wedge 3 sheet write tools). Use `update_row_by_match` semantics — patch in place by SKU match — never append a new row. The append-instead-of-edit bug from 2026-05-07 (Eames LCW dupes) was the trigger for adding this rule.
