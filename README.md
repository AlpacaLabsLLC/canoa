# Canoa

A Claude Code plugin for FF&E specifications. Parse vendor URLs and dealer quotes into a verified catalog, walk configurable products to a locked SKU, keep your master schedule in sync, and produce client-ready spec books — every fact backed by a manufacturer-cited source.

Built for [Claude Cowork](https://claude.com/product/cowork). Also works in [Claude Code](https://claude.com/product/claude-code).

## The Problem

Specification work for furniture, lighting, and materials is a paper-trail mess. Designers juggle:

- Manufacturer pages with hour-old prices and partial specs
- Dealer-quote PDFs with negotiated pricing buried in email threads
- Master schedules in Google Sheets with inconsistent column layouts across projects
- Configurator URLs that resolve to dozens of SKU permutations
- Trade-show catalogs that never make it into a structured library

The cost: hours per project copy-pasting between tools, stale prices at issue, lost provenance on every fact, no clean way to verify a months-old schedule is still current before sending it to a client.

## The Solution

One Google Sheet as the working artifact. One AI agent that parses vendor pages and dealer PDFs into a verified, manufacturer-cited catalog. One conversation interface that turns "spec the Aeron in size B for the executive office" into a row on your sheet, with citations.

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE DESIGNER                             │
│                                                                 │
│   "Find me a walnut     Paste a vendor URL    Drop a dealer-    │
│    credenza under $5k"                        quote PDF         │
└──────────┬───────────────────┬───────────────────┬──────────────┘
           ▼                   ▼                   ▼
   /canoa-find          /canoa-parse-url    /canoa-parse-pdf
           │                   │                   │
           └───────────┬───────┴───────────────────┘
                       ▼
              ┌────────────────────────────────────────┐
              │           CANOA CATALOG                │
              │  Verified · Observed · Candidate       │
              │  manufacturer-cited, dedup'd by URL    │
              └────────────────┬───────────────────────┘
                               ▼
                  /canoa-spec   /canoa-source-room
                               │
                               ▼
              ┌────────────────────────────────────────┐
              │      DESIGNER'S MASTER SPEC BOOK       │
              │      (Google Sheet · 35 columns)       │
              └────────────────┬───────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       /canoa-audit-row  /canoa-build-     /canoa-weekly-
                          spec-book          check
       drift detect     PDF · HTML ·       Monday brief:
                        Sheets · MD        stale rows,
                                           price drift
```

## Data Flow

| Source | How it gets in | Where it lands |
|---|---|---|
| Vendor / manufacturer URL | `/canoa-parse-url` parses + dedupes by canonical URL | Catalog (verified tier) |
| Dealer-quote PDF | `/canoa-parse-pdf` reads pages skill-side; server canonicalizes manufacturer | Catalog (observed tier) |
| Line-card PDF | Same as above | Catalog (verified tier) |
| Natural-language search | `/canoa-find` translates query → filter (Haiku, ~$0.001 / query) | Returns candidates with citations |
| Configurable walkthrough | `/canoa-spec` walks option matrix turn-by-turn (Aeron-class) | Final SKU + price |
| Approved spec | `/canoa-source-room` or direct append | Designer's master sheet |

Every catalog write carries provenance — `[source · YYYY-MM-DD]` tags on every fact (price, lead time, dimension, designer attribution, certifications). The catalog ages: re-running `/canoa-audit-row` re-parses the live vendor URL and surfaces drift.

> **Calibration**: Prices, lead times, dimensions, and embodied carbon values are accurate as of the last parse. Manufacturers change these without notice. Re-run `/canoa-audit-row` for spot checks, or `/canoa-audit-schedule` for a whole project, before any client commitment. Anything older than the last audit is a working estimate.

## Skills

11 skills — 1 router, 1 onboarding, 5 building blocks, 4 commands.

| Skill | Type | Description |
|---|---|---|
| [canoa](skills/canoa/) | Router | Say what you need in plain English; routes to the right command |
| [canoa-onboard](skills/canoa-onboard/) | Onboarding | First-run arc: connect Google, attach a sheet, parse one URL, capture studio profile |
| [canoa-find](skills/canoa-find/) | Building block | Search the catalog by category, brand, dimensions, materials, price, lead time, or NL description |
| [canoa-spec](skills/canoa-spec/) | Building block | Walk a configurable product (Aeron, Steelcase Leap, Swoop) and lock options + SKU |
| [canoa-parse-url](skills/canoa-parse-url/) | Building block | Parse a vendor or manufacturer URL into a verified-tier catalog entry |
| [canoa-parse-pdf](skills/canoa-parse-pdf/) | Building block | Parse a dealer quote, line card, configurator workbook, or trade-show PDF |
| [canoa-audit-row](skills/canoa-audit-row/) | Building block | Re-verify one row against the live vendor source |
| [canoa-source-room](skills/canoa-source-room/) | Command | Brief → cards → spec → add to schedule, with approval gates |
| [canoa-audit-schedule](skills/canoa-audit-schedule/) | Command | Bulk verify every row, run as a server-side queued job |
| [canoa-build-spec-book](skills/canoa-build-spec-book/) | Command | Export the schedule as PDF, HTML, Google Sheets, or Markdown |
| [canoa-weekly-check](skills/canoa-weekly-check/) | Command | Monday brief: stale rows, price drift, lead-time changes |

## Master Schedule Schema

The default sheet template is v1.2 — 35 columns covering identity, dimensions, materials, pricing, logistics, audit metadata, and embodied carbon. Designers with existing sheets can attach those as-is; Canoa runs header-fuzzy-match and shows the mapping before any write.

The schema is adopted from the canonical [skills-for-architects/master-schedule](https://github.com/AlpacaLabsLLC/skills-for-architects/tree/main/plugins/06-materials-research/skills/master-schedule), with three Canoa-specific additions (Thumbnail, Dealer Net `[PRIVATE]`, Embodied Carbon).

## Install

**Claude Cowork**

Install from [claude.com/plugins](https://claude.com/plugins/). Once installed, say **"set me up"** to run `canoa-onboard`.

**Claude Code**

```bash
claude plugin marketplace add AlpacaLabsLLC/canoa
claude plugin install canoa@canoa
```

Then start a session and say **"set me up"**. The onboarding arc takes 10–15 minutes — Google sign-in, sheet attachment, one parse to prove value, and a brief studio-profile capture so future runs are tailored.

## License

Proprietary — © Alpaca Labs LLC. The plugin is open for installation; the catalog data and the Canoa backend service are not open source.

A product of [ALPA](https://alpa.llc).
