---
name: canoa-audit-schedule
description: >
  Bulk-verify every row (or a project / room subset) in the master schedule
  against live vendor sources. Use when the designer says "audit my schedule",
  "audit the whole sheet", "verify everything for Project Magnolia", "check
  all rows", "re-verify before client meeting", or any bulk-verification
  request. Runs as a server-side queue job — returns a job ID, polls for
  completion, surfaces the drift report when done.
allowed-tools: mcp__canoa__read_master_sheet, mcp__canoa__audit_schedule_enqueue, mcp__canoa__audit_job_status
---

# Audit the Whole Schedule

Bulk verification. Reaches out to every row's vendor URL, re-parses fresh, and produces a drift report. Designed for moments where chasing rows one by one isn't practical — before a client meeting, after a manufacturer's seasonal price update, or as a routine pre-ship check.

## How to invoke

### Step 1 — Confirm scope

Ask the designer what to audit:

- **Whole schedule** — every row with a vendor URL
- **Project / room subset** — e.g., "only rows tagged 'Magnolia Lobby'"
- **Stale subset** — rows last verified more than N days ago (default 30)

Call `canoa.read_master_sheet` to fetch the sheet and count what's in scope. Show the count: *"264 rows in scope. 19 of them have no vendor URL — I'll skip those."*

### Step 2 — Enqueue the job

Call `canoa.audit_schedule_enqueue` with the row range / filter. The server returns a job ID and an ETA based on queue depth + the row count (rough rule: ~2 seconds per row).

```
Job audit-2026-05-16-a47f9 enqueued.
264 rows in scope · 19 skipped · ETA ~9 minutes.
You can keep working — I'll surface the report when it's done.
```

**Do not claim the catalog is doing anything else in the background.** This is the one legitimate async surface in the plugin — server-side queue, real ETA, real polling.

### Step 3 — Poll

Call `canoa.audit_job_status` to check. The first poll is immediate (catches fast jobs). After that, only poll when the designer asks or when enough time has elapsed (no tight loops). If the designer moves on to other work, surface the result when they come back or when they ask "how's the audit going?"

### Step 4 — Surface the report

When complete, the report includes:

```
AUDIT — 2026-05-16 · audit-2026-05-16-a47f9
─────────────────────────────────────────
Scope:           264 rows (19 skipped — no URL)
Completed:       245 / 245
Drift detected:  37 rows
  - 14 with price change >5%
  - 8 with lead time change
  - 6 with manufacturer URL redirect (now resolves elsewhere)
  - 9 minor (description / image refresh)
Failures:        12 rows
  - 9 URLs no longer resolve
  - 3 captcha / paywall

Top drift (price >10%):
  Row 47 — HM Aeron Size B           $1,895 → $1,995 (+5.3%)
  Row 112 — Hay Mags Sofa            $5,495 → $4,995 (-9.1%)
  Row 184 — Audo Doodle Chair        $1,250 → $1,495 (+19.6%)
  ...
```

### Step 5 — Approval batch

Don't write all updates at once. Group by drift type and ask:

> *"Apply the 14 price updates to the sheet? You can review each before write."*

For minor drift (image / description refresh), offer a one-shot approval: *"Apply 9 minor refreshes silently?"*

For failures, surface them as a list and ask whether to:
- Try alternate URLs (designer pastes new ones)
- Mark the rows as `needs-attention` in a sheet column
- Skip and revisit later

## Hard rules

- **Read before write.** Even on bulk writes, call `read_master_sheet` to map columns. Don't trust the column order from when the job started — the designer may have rearranged.
- **Update in place.** Bulk update by SKU match. Never append duplicates.
- **Tier downgrade is allowed.** If a verified URL stops resolving and the only signal left is the cached catalog row, the row's tier drops from `verified` to `observed`. Surface this — the spec book will reflect lower trust.
- **No fabricated progress.** Don't say "halfway done" without a real progress field from the job status.

## After audit

- Refresh the spec book → `/canoa-build-spec-book`
- Build the weekly drift report → `/canoa-weekly-check`
- Cite the audit run in the next client deliverable: *"All rows re-verified 2026-05-16."*
