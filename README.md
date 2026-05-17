# Canoa

AI specifications manager for FF&E. Parse vendor URLs and dealer quotes into a verified catalog, spec configurable products like the Aeron or Steelcase Leap, keep your master schedule in sync, and build clean spec books — every step backed by manufacturer-cited line cards.

Built for [Claude Cowork](https://claude.com/product/cowork). Also works in [Claude Code](https://claude.com/product/claude-code).

11 skills (1 router, 1 onboarding, 5 building blocks, 4 commands). One remote connector. No local code to install.

> **Important**: Prices, lead times, dimensions, and embodied carbon values come from manufacturer pages and dealer quotes at parse time. These change. Re-run `/canoa-audit-row` (or `/canoa-audit-schedule` for a whole project) before any client commitment, and treat any value older than the last audit as a working estimate.

## Installation

### Cowork

Install from [claude.com/plugins](https://claude.com/plugins/).

### Claude Code

```bash
claude plugin marketplace add AlpacaLabsLLC/canoa
claude plugin install canoa@canoa
```

Once installed, say **"set me up"** to run `canoa-onboard` — it'll connect your Google account, attach your master schedule, and run one parse to prove value. The whole arc takes 10–15 minutes.

## What you'll need to connect

Canoa ships as a single remote connector at `https://canoa.supply/api/mcp`. Installing the plugin registers the connector; the connector itself walks you through:

- **Google account** — for the master schedule sheet
- **A master schedule sheet** — pick one in Drive, or let Canoa start a fresh one from the v1.2 template

Nothing else to install or configure. The catalog, the parser, the persona, and the audit queue all run server-side at canoa.supply.

## How it works

Three layers, mirroring how designers actually work:

1. **Building blocks** — the things you do every day. One job each: `canoa-find`, `canoa-spec`, `canoa-parse-url`, `canoa-parse-pdf`, `canoa-audit-row`.
2. **Commands** — workflows that chain building blocks with approval gates: `canoa-source-room`, `canoa-audit-schedule`, `canoa-build-spec-book`, `canoa-weekly-check`. Plus `canoa-onboard` for first run.
3. **The router** — say what you need in plain English ("find me a walnut credenza under $5k", "audit the Eames row", "build a spec book for Project Magnolia"). The `canoa` skill routes to the right command.

You don't need to memorize anything. Every workflow pauses before it writes to your schedule.

## All commands

| Command | What it does |
|---|---|
| `/canoa-onboard` | Connect Google, attach a sheet, parse one URL, capture your studio profile |
| `/canoa-find` | Search the Canoa catalog by category, brand, dimensions, materials, price, lead time, or natural-language description |
| `/canoa-spec` | Walk through a configurable product (Aeron, Steelcase Leap, Swoop) and lock options + final SKU |
| `/canoa-parse-url` | Parse a vendor or manufacturer URL into a verified-tier catalog entry |
| `/canoa-parse-pdf` | Parse a dealer quote, line card, configurable workbook, or trade-show PDF into catalog entries |
| `/canoa-audit-row` | Re-verify one row in your schedule against the live vendor source |
| `/canoa-source-room` | Brief → cards → spec → add to schedule, in one approval-gated flow |
| `/canoa-audit-schedule` | Bulk verify every row, run as a server-side job |
| `/canoa-build-spec-book` | Turn the schedule into a branded spec book (PDF / Sheets / Markdown) |
| `/canoa-weekly-check` | Monday brief: stale rows, price drift, lead-time changes |

## Conventions Canoa follows

- **Tier on every product.** Verified = manufacturer source retained. Observed = community partial data, less trusted. Candidate = LLM-suggested, not yet validated. Canoa cites the tier whenever it surfaces a product.
- **Manufacturer over dealer.** DWR resells Hay, Hem, and Audo Copenhagen. The manufacturer is Hay / Hem / Audo, never DWR. Canoa enforces this on every parse.
- **Read before write.** Sheet writes always read the live headers first — Canoa never invents columns, never appends a duplicate when an SKU match exists. It patches in place.
- **Audit always re-parses.** Verifying a row hits the live vendor URL again, not the catalog cache.
- **No fabricated work.** Canoa never claims "the catalog is refreshing in the background" or "I'll come back in a few minutes." It states only what just happened.

## License

Proprietary — © Alpaca Labs LLC. The plugin is open for installation; the catalog data and backend service are not open source.

A product of [ALPA](https://alpa.llc).
