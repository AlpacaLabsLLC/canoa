---
name: canoa-audit-row
description: >
  Verify one row in the master schedule against the live vendor source. Use
  when the designer says "audit the Eames chair", "check this row", "is row
  18 still current", "verify the Aeron price", "is the lead time still 6
  weeks", "double-check this", or any single-row verification request.
  Always re-parses the row's vendor URL — never trusts the cached catalog
  or sheet value. Surfaces drift between sheet ↔ catalog ↔ live parse.
allowed-tools: mcp__canoa__read_master_sheet, mcp__canoa__audit_row, mcp__canoa__update_row_by_match
---

# Audit One Row

Re-verifies a single row in the master schedule by re-parsing its vendor URL and surfacing drift. **Always re-parses live.** Never trusts the cached catalog value, even if it looks recent.

## How to invoke

1. Identify the row. The designer may name it by row number (`row 18`), SKU, product name, or general reference (`the Eames`). Call `canoa.read_master_sheet` to fetch the sheet and find the row. If the reference is ambiguous (two Eames rows), ask one clarifying question.

2. Call `canoa.audit_row` with the row's vendor URL + row number. The server:
   - Re-fetches the URL
   - Re-parses fresh (no cache)
   - Compares fields against (a) the catalog row, (b) the sheet row
   - Returns a drift report

3. Present the drift report to the designer:

   ```
   Row 18: HM Aeron Size B, fully loaded
   - List price:    sheet $1,895 → live $1,995 (+$100)
   - Lead time:     sheet 6 wks  → live 8 wks
   - Image URL:     unchanged
   - Dimensions:    unchanged
   - Last verified: 47 days ago
   - Tier: verified (manufacturer source retained)
   ```

4. **Approval gate.** Ask whether to patch the sheet:
   > *"Update list price to $1,995 and lead time to 8 weeks on row 18?"*

   On approval, call `canoa.update_row_by_match` with the row's SKU and the changed fields. Never invent columns; only update fields that exist in the live header set.

## When drift is large

If price or lead-time drift is >15%, surface it more prominently:

> *"Heads up — list price jumped 17% on row 18 (the Aeron). Worth flagging to the client before the spec book ships?"*

Don't auto-update. Let the designer decide.

## When the URL doesn't resolve

If the vendor URL 404s, paywalls, or the page has been redesigned and the parse fails:

- Surface the failure clearly: *"URL on row 18 no longer resolves — looks like Herman Miller restructured their product URLs."*
- Suggest finding the new URL via `/canoa-find` or asking the designer to paste a replacement
- Don't fall back to training data ("I think the Aeron is around $1,895 still…")

## When the row has no URL

Some rows are placeholders the designer added manually without a source. Don't re-parse nothing. Surface this:

> *"Row 18 has no vendor URL — I can't audit without a source. Want to paste a URL so I can verify it going forward?"*

## After audit

Common next steps:

- Audit a whole project at once → `/canoa-audit-schedule`
- Set up a weekly drift report → `/canoa-weekly-check`
- Refresh the spec book to reflect the new prices → `/canoa-build-spec-book`
