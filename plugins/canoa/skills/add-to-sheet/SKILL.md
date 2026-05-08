---
name: add-to-sheet
description: Append a product spec to the designer's master Google Sheet schedule, or update an existing row in place. Use when the designer says "add this to my sheet", "put this in my schedule", "save this spec", "update row 12", "refresh the price on the Eames", or any request to write to the master sheet. Always reads the sheet first to map keys to actual column headers (read-before-write rule). Never appends a new row when an SKU match exists in the sheet — patches in place.
allowed-tools:
  - mcp__canoa__canoa_chat
---

# /canoa:add-to-sheet — Write to Master Schedule

Writes a product spec to the designer's master Google Sheet. The actual write happens server-side through `canoa_chat` → Wedge 3 sheet tools (`read_master_sheet`, `append_to_sheet`, `update_row_by_match`). This skill enforces two hard rules: **read before write**, and **update in place when an SKU match exists** (don't append duplicates).

## When to use this skill

- **Append a new spec**: designer just locked an Aeron config and wants it in the schedule
- **Update an existing row**: refresh price after an audit, change a quantity, swap a finish
- **Bulk append**: ingest multiple parsed rows from a PDF (handled per-row by the server)

For audits, use `/canoa:audit` first — that surfaces the drift; then this skill writes the fix once approved.

## How to invoke

Capture the spec + intent and relay through `canoa_chat`:

```
canoa_chat("add the locked Aeron Size B / graphite / posturefit SR / fully adjustable arms config to row in my schedule")
```

The server-side agent will:

1. Call `read_master_sheet` first to detect the multi-row header (heuristic: row 1 wins if its distinct-non-empty count > 1.5× row 0). Returns `header_row_used` + `raw_first_rows` so the agent can override.
2. Map the spec's keys to actual column headers in the sheet (case-insensitive). Returns `mapped_keys` + `unmapped_keys` so the agent can surface what landed where.
3. Decide append vs update-in-place based on SKU match.
4. Write.
5. Confirm to the designer with the row number written, the cells changed, and any unmapped keys.

## Hard rule 1 — read before write

Never call `append_to_sheet` without first calling `read_master_sheet`. The Norma Jean test 2026-05-07 caught the early bug here: "USD" landed in the wrong column because the agent guessed at headers instead of reading them. Use exact header names verbatim. Don't invent columns.

## Hard rule 2 — update in place when SKU match exists

If the spec being written shares an SKU with an existing row, **patch in place** via `update_row_by_match` (key column = SKU). Never append a duplicate.

The Eames LCW bug 2026-05-07 surfaced this: refreshed pricing got appended as new rows 18 + 19 while stale rows still sat above them — manual de-dup work. Don't repeat. If the agent isn't sure whether a match exists, ask the designer once: *"Row 18 has the same SKU. Update in place or append a new line?"*

## Hard rule 3 — never claim background work

If the write succeeds, state plainly: *"Row 18 updated. List price 1,235 → 1,345; last_verified_at = today."*

If the write partially succeeds (some columns mapped, some keys unmapped), say so:

> "Wrote 9 of 11 fields to row 18. Couldn't map: 'embodied_carbon_kgco2', 'epd_url' (no matching columns in your sheet). Add them to the sheet header and re-run, or skip."

Never say "the rest will be filled in by a background process" — there's no such process in V1.

## Configurable products without a price

If the designer asks to add a configurable product whose spec isn't fully locked (no SKU + price on file), don't write a half-finished row. Tell them: *"Lock the configuration first via `/canoa:spec`, or paste the manufacturer's locked-config URL via `/canoa:parse-url`."* Half-finished rows pollute the schedule.
