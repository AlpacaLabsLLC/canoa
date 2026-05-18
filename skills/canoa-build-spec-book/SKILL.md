---
name: canoa-build-spec-book
description: >
  Turn the master schedule (or a project / room subset) into a branded spec
  book artifact — PDF, Google Sheets export, or Markdown. Use when the
  designer says "build a spec book for Project Magnolia", "export the
  schedule", "make a PDF for the client", "produce the spec book",
  "package the lobby specs", or any request to produce a client-facing
  deliverable from the schedule. Redacts Dealer Net before export.
allowed-tools: mcp__canoa__read_master_sheet, mcp__canoa__export_spec_book
---

# Build a Spec Book

Produces a client-facing spec book from the master schedule. Four output formats: PDF (default for client delivery — server returns print-ready HTML that auto-opens the designer's browser print dialog), HTML (same render without auto-print), Google Sheets (for collaborative review), Markdown (for embedding in other docs). Native server-rendered PDF lands in v1.1.

## How to invoke

### Step 1 — Confirm scope and format

Ask:

- **Scope:** whole schedule / project / room / selection of rows
- **Format:** PDF / Sheets / Markdown (default PDF if the designer mentioned a client)
- **Audience:** client / internal / dealer (changes what columns appear — see below)
- **Project metadata:** project name, client name, issue date (auto-fills to today)

Read `## Studio profile` for the studio name + sustainability stance. The latter controls whether the embodied-carbon column ships in the export.

[reference/output-formats.md](reference/output-formats.md) covers the per-format details.

### Step 2 — Filter rows

Call `canoa.read_master_sheet` with the scope filter (e.g., `tag = 'Magnolia Lobby'`). Count the rows. Show the designer what's in scope: *"47 rows for Magnolia Lobby. 4 are tier=candidate — I'll surface this in the document but recommend you audit those before sending."*

If any rows are tier=candidate and the audience is `client`, ask: *"Want to run `/canoa-audit-row` on the candidate rows before exporting, or include them with a tier note?"*

### Step 3 — Build

Call `canoa.export_spec_book` with the scope, format, audience, and project metadata. The server:

- Reads the filtered rows
- Redacts the **Dealer Net** column for any audience other than `dealer` (PRIVATE — never ships to clients)
- Applies the brand template (studio logo, project title block, page footer with audit date)
- Generates the artifact and returns a download URL

### Step 4 — Hand off

Present the artifact:

```
Spec Book — Magnolia Lobby
────────────────────────────────────
Format:        PDF
Pages:         18
Items:         47 (4 tier=candidate flagged)
Last audit:    2026-05-16 (whole-schedule)
Dealer Net:    REDACTED (client audience)
Carbon column: INCLUDED (sustainability stance: required for some)
Download:      <signed URL, 24h expiry>
```

## Audience profiles

| Audience | Dealer Net | Internal notes | Audit-status column | Tier column |
|---|---|---|---|---|
| **client** | redacted | hidden | hidden | hidden (verified only ships; candidates flagged) |
| **internal** | shown | shown | shown | shown |
| **dealer** | shown | hidden | hidden | shown |

The audience defaults to **client** if the designer mentions one. Only override when the designer explicitly says "internal" or "for the dealer."

## Hard rules

- **Dealer Net is private.** Never ship to client or dealer audiences. Redaction is a server-side allowlist, not a client-side suppression — the column does not leave canoa.supply when audience != `dealer`.
- **Tier=candidate flagged in client exports.** Either drop the rows or surface them with a clear tag. Never let a candidate-tier row ship silently into a deliverable.
- **Cite the audit date.** The last audit timestamp goes in the footer of every page. Designers and clients should always know how fresh the data is.
- **Don't refresh during build.** This skill exports the current state. To refresh before exporting, run `/canoa-audit-schedule` first.

## After build

- Email the PDF to the client (designer handles this)
- Share the Sheets export with collaborators
- Mark the spec book as issued in the schedule (status column updates by the designer)
