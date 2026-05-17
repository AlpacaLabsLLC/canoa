---
name: canoa-weekly-check
description: >
  Monday brief — surfaces stale rows, price drift, lead-time changes, and
  any rows that need attention since the last check-in. Use when the designer
  says "weekly check", "Monday brief", "what should I look at this week",
  "what's changed", "anything urgent", or whatever phrase they stored as
  their check-in trigger during onboarding. Reads the audit history and
  surfaces only what needs designer attention — no daily noise.
allowed-tools: Read, mcp__canoa__read_master_sheet, mcp__canoa__audit_schedule_enqueue, mcp__canoa__audit_job_status, mcp__canoa__catalog_search
---

# Weekly Check

A start-of-week snapshot for the designer. Surfaces what's changed in the catalog since the last check-in, what's gone stale, and which rows need attention before the week's deliverables ship.

## How to invoke

The designer says their stored trigger phrase (default `"weekly check"`, configurable during onboarding).

```
Designer: "weekly check"
→ Read ## Studio profile from memory → check cadence + headaches
→ Read sheet → identify stale rows (last_verified > 14 days)
→ Enqueue audit for stale rows only (not the whole schedule)
→ While that runs, surface what's already known: tier=candidate rows,
  rows with status=ordered awaiting receipt, etc.
→ Present the brief when the audit completes
```

## What goes in the brief

```
WEEKLY CHECK — Monday 2026-05-19
─────────────────────────────────────────
Studio:        Studio Mayfly (4 designers)
Last check:    2026-05-12 (7 days ago)

Drift since last check (3 rows):
  - Row 47 · HM Aeron · list price +5.3% ($1,895 → $1,995)
  - Row 112 · Hay Mags Sofa · lead time 8 → 12 weeks
  - Row 184 · Audo Doodle Chair · list price +19.6% ($1,250 → $1,495)

Stale rows (last verified > 14 days):
  - 22 rows queued for re-audit — ETA 2 minutes

Tier=candidate rows in active projects:
  - 4 rows in Magnolia Lobby — recommend audit before client meeting

In-flight orders awaiting receipt (status=ordered):
  - 6 items, oldest ordered 47 days ago

Nothing urgent. Worth a 15-minute review when you have time.
```

The structure adapts to the designer's headaches (from profile):

- If `sourcing` is a top headache, surface new catalog additions in their preferred manufacturers since the last check.
- If `dealer-quote follow-up` is a top headache, surface rows where dealer quotes are >30 days old (likely needs re-quote).
- If `audit / verification` is a top headache, default to a more aggressive stale threshold (7 days instead of 14).
- If `embodied carbon` is a top headache, surface rows missing kgCO2e values in active projects.

## Hard rules

- **No noise.** If nothing has drifted, nothing is stale, and no items need attention, the brief is one line: *"Nothing urgent this week — schedule is clean as of 2026-05-12."* Don't pad.
- **Read the studio profile first.** A profile-less weekly check is generic — say so and suggest `/canoa-onboard` to set one up.
- **No fabricated alerts.** Don't claim a manufacturer "raised prices industry-wide" or "you should worry about X" without evidence in the audit report. State only what shows up in the data.
- **Don't auto-fix.** Surface drift, list candidates for action, ask before any write. Weekly checks are a read-mostly surface.

## Common follow-ups

- *"Apply the three price updates"* → updates via `canoa.update_row_by_match`
- *"Re-quote the dealer items"* → drafts dealer emails (designer sends manually)
- *"Run the full audit"* → routes to `/canoa-audit-schedule`
- *"Build a fresh spec book for Magnolia"* → routes to `/canoa-build-spec-book`
- *"Set a daily check instead"* → updates the cadence in the studio profile
