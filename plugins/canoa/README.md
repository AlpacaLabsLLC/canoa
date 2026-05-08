# Canoa

A Claude plugin that turns Claude into your AI specifications manager for FF&E (furniture, fixtures, equipment) and interior design. Connects to your master Google Sheet schedule, maintains a verified, manufacturer-cited catalog, and runs an FF&E specialist conversation backed by parsed line cards, dealer-quote PDFs, and configurable option matrices.

## The Problem

Interior designers and architects spend hours stitching FF&E specs together — clicking through manufacturer sites, parsing dealer-quote PDFs, normalizing inconsistent column schemas across spreadsheets, manually re-checking prices and lead times that go stale a week later. Configurable products (Aeron, Steelcase Leap, Vitra Citizen) require walking through option matrices with cross-option dependency rules that are easy to misremember. Trade-show catalogs and printed line cards never make it back into a queryable system.

## The Solution

One persistent FF&E specialist conversation in Claude. One Google Sheet for the master schedule. A growing verified catalog that's manufacturer-cited and dealer-aware, fed by parsing the URLs and PDFs the designer already has on hand. Configurable walkthroughs that respect `valid_when` dependency clauses. Audits that always re-verify against the live source. Sheet writes that read first, patch in place, and never duplicate.

```
                          ┌──────────────────────┐
                          │    THE DESIGNER      │
                          │  master Google Sheet │
                          └──────────┬───────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
          │ /canoa:start │   │ /canoa:setup │   │ /canoa:find  │
          │   session    │   │  Google +    │   │  catalog     │
          │   kickoff    │   │  sheet       │   │  search      │
          └──────────────┘   └──────────────┘   └──────────────┘
                  │                  │                  │
                  ▼                  ▼                  ▼
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
          │ /canoa:spec  │   │/canoa:parse- │   │/canoa:parse- │
          │ configurable │   │     url      │   │     pdf      │
          │  walkthrough │   │ ingest URL   │   │ ingest PDF   │
          └──────────────┘   └──────────────┘   └──────────────┘
                  │                  │                  │
                  └──────────────────┼──────────────────┘
                                     ▼
                          ┌──────────────────────┐
                          │  CANOA CATALOG       │
                          │  3 tiers, multi-     │
                          │  source, redacted    │
                          │  per-user prices     │
                          └──────────┬───────────┘
                                     │
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
          ┌──────────────┐                     ┌──────────────────┐
          │ /canoa:audit │                     │/canoa:add-to-    │
          │ verify rows  │                     │     sheet        │
          │ vs catalog   │                     │ append/update    │
          │ vs live      │                     │ in place         │
          └──────────────┘                     └──────────────────┘
```

## Skills

| Skill | Description |
|---|---|
| [start](skills/start/SKILL.md) | Session kickoff — status check + working-mode entry |
| [setup](skills/setup/SKILL.md) | Onboarding — Google OAuth + master sheet attach |
| [find](skills/find/SKILL.md) | Catalog search — structured filters or natural-language query |
| [spec](skills/spec/SKILL.md) | Configurable walkthrough or fixed-SKU lock |
| [parse-url](skills/parse-url/SKILL.md) | Ingest a vendor URL into the catalog |
| [parse-pdf](skills/parse-pdf/SKILL.md) | Ingest a dealer-quote, line-card, or trade-show PDF |
| [audit](skills/audit/SKILL.md) | Verify schedule rows against catalog + live re-parse |
| [add-to-sheet](skills/add-to-sheet/SKILL.md) | Write spec to master schedule (read-before-write, update-in-place) |

## Agent

For the underlying FF&E specialist persona that the server-side `canoa_chat` runs — voice, tier disclosures, no-fabricated-capabilities, audit-on-touch — see the [Canoa agent](../../agents/canoa.md). The persona file in this repo mirrors `canoa-site/functions/api/_shared/agent-persona.ts`; both must stay in sync.

## MCP server

This plugin bundles a Node MCP server at `mcp/dist/server.js`, declared in `.mcp.json`. The server exposes 5 tools (`canoa_status`, `canoa_signup`, `canoa_signout`, `canoa_attach_sheet`, `canoa_chat`) — all of them thin proxies to `canoa.supply/api/*` where the actual catalog work happens. When users install this plugin, the MCP server is wired automatically; no separate config required.

## Catalog architecture

Three tiers — every product reference cites its tier so designers know the trust level:

- **verified** — manufacturer source retained (line card, vendor URL, parsed configurator); ship-grade
- **observed** — community / dealer-quote derived; partial data; cite carefully, don't ship without verification
- **candidate** — LLM-suggested, not yet validated; placeholder for designer review

Multi-source ingestion (URL / PDF / SIF / dealer-quote / line-card / Configura). Pricing layered: list price shared across users, dealer-net redacted per-user. Watch is verification-only (catalog refresh, not autonomous spec generation).

## Install

**Claude Cowork (desktop):**

1. Open the **+** menu → **Add marketplace from GitHub**
2. Enter `AlpacaLabsLLC/canoa`
3. Install the **canoa** plugin

**Claude Code (terminal):**

```bash
claude plugin marketplace add AlpacaLabsLLC/canoa
claude plugin install canoa@canoa
```

**Local development:**

```bash
git clone https://github.com/AlpacaLabsLLC/canoa.git
cd canoa
claude --plugin-dir ./plugins/canoa
```

After install, run `/canoa:setup` to onboard, then `/canoa:start` to begin a working session — or just say "use canoa" and the skill auto-fires from its description.

## License

MIT
