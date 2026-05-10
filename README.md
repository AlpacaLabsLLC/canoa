# Canoa — AI specifications manager for FF&E and interior design

Canoa is a Claude plugin for working with furniture, fixtures, and equipment specifications. Connects to your master Google Sheet schedule, parses vendor URLs and dealer-quote PDFs into a verified, manufacturer-cited catalog, and runs an FF&E specialist conversation backed by manufacturer line cards and configurable option matrices.

A product of [ALPA](https://alpa.llc).

The plugin ships **one entry point — `/canoa` — that dispatches to seven sub-skills**:

| Slash command | Does | When to use |
|---|---|---|
| **`/canoa`** | Dispatcher — reads your task, routes to the right sub-skill, falls back to working mode for freeform | Always start here |
| `/canoa-setup` | Google OAuth + master sheet attach | First run, or to switch accounts / re-attach |
| `/canoa-find` | Catalog search (structured filters or NL) | "find me…", "show me…", "any X under $Y" |
| `/canoa-spec` | Configurable walkthrough or fixed-SKU lock | "spec out the Aeron", option-matrix flows |
| `/canoa-parse-url` | Ingest a vendor URL into the catalog | Designer pasted a manufacturer / dealer / configurator URL |
| `/canoa-parse-pdf` | Ingest a dealer quote, line card, or trade-show PDF | Designer attached a PDF |
| `/canoa-audit` | Verify schedule rows vs catalog vs live re-parse | "audit my schedule", "is this still current" |
| `/canoa-add-to-sheet` | Append spec to master schedule (read-before-write, update-in-place) | "add this to my sheet", "update row 12" |

## Install

### Claude Desktop / Cowork

1. **+** menu → **Add marketplace from GitHub**
2. Enter `AlpacaLabsLLC/canoa`
3. Install the **canoa** plugin
4. Run `/canoa` to start

### Claude Code (terminal)

```bash
claude plugin marketplace add AlpacaLabsLLC/canoa
claude plugin install canoa@canoa
```

Then `/canoa` to start, or invoke any sub-skill directly.

### Local development

```bash
git clone https://github.com/AlpacaLabsLLC/canoa.git
cd canoa
claude --plugin-dir .
```

## Architecture

```
                ┌─────────────────┐
                │     /canoa      │
                │   (dispatcher)  │
                └────────┬────────┘
                         │
   ┌────────┬────────┬───┴────┬────────┬──────────┬──────────────────┐
   ▼        ▼        ▼        ▼        ▼          ▼                  ▼
/canoa-  /canoa-  /canoa-  /canoa-  /canoa-    /canoa-           /canoa-
 setup    find     spec    parse-   parse-      audit             add-to-
                            url      pdf                          sheet
   │        │        │        │        │          │                  │
   └────────┴────────┴────────┴────────┴──────────┴──────────────────┘
                                │
                       canoa MCP server
                    (5 tools: status, signup,
                     signout, attach_sheet, chat)
                                │
                                ▼
                       canoa.supply/api/*
                  (Cloudflare Pages + Functions
                   + D1 catalog cache + R2)
```

**Three layers:**

1. **Sub-skills** (`skills/canoa-*/SKILL.md`) — one Markdown skill per task, narrow and verb-shaped. The dispatcher (`skills/canoa/SKILL.md`) routes user intent to the right sub-skill or falls back to working mode for freeform conversation. **Skills are thin relays** that frame designer intent and proxy through the MCP — they do NOT run inference skill-side.
2. **MCP server** (`mcp/`) — bundled with the plugin via `.mcp.json` using `${CLAUDE_PLUGIN_ROOT}`. Installs auto-wire it; no per-user config required. The MCP itself is **thin proxies** to the backend — no business logic. Five tools:
   - `status` — current OAuth + sheet attachment state for the user
   - `signup` — start the Google OAuth flow
   - `signout` — clear stored credentials
   - `attach_sheet` — connect a master Google Sheet to the user's catalog
   - `chat` — multi-turn agent orchestrator (proxies to `canoa.supply/api/chat`)
3. **Backend API** at `canoa.supply/api/*` — lives in [`AlpacaLabsLLC/canoa-site`](https://github.com/AlpacaLabsLLC/canoa-site). Cloudflare Pages Functions + D1 + R2 + Anthropic. Holds the actual catalog (8K products, 6K variants, 9K vendor offerings, 35K observations as of 2026-05-09), parses URLs and PDFs, runs the chat agent, manages OAuth tokens.

**Why this split?** The plugin can ship updates to skills + MCP independently of the backend, and the backend can iterate on parsing / catalog logic without re-publishing the plugin. Same pattern as Norma (Estudio Local) and the architecture-studio plugin family.

## Repo layout

```
canoa/
├── .claude-plugin/
│   ├── marketplace.json         # single-plugin marketplace; plugin source "./"
│   └── plugin.json              # plugin manifest (current: v0.2.0)
├── skills/
│   ├── canoa/SKILL.md           # dispatcher — routes to sub-skills
│   ├── canoa-setup/SKILL.md     # Google OAuth + sheet attach
│   ├── canoa-find/SKILL.md      # catalog search (structured + NL)
│   ├── canoa-spec/SKILL.md      # configurable walkthrough + lock
│   ├── canoa-parse-url/SKILL.md # URL → catalog ingest
│   ├── canoa-parse-pdf/SKILL.md # PDF → catalog or per-user quote ingest
│   ├── canoa-audit/SKILL.md     # schedule vs catalog vs live re-parse
│   └── canoa-add-to-sheet/SKILL.md  # spec → master schedule write-back
├── agents/
│   ├── canoa.md                 # FF&E specialist persona (mirrored to canoa-site)
│   └── README.md
├── mcp/
│   ├── src/server.ts            # MCP server source
│   └── dist/server.js           # COMMITTED — fresh-clone-runs-MCP without npm install
├── .mcp.json                    # bundled MCP config; resolves with ${CLAUDE_PLUGIN_ROOT}
├── CHANGELOG.md                 # release notes per version
├── LICENSE
└── CLAUDE.md                    # working notes for Claude Code (layout principles + hard rules)
```

**Layout convention** — flat single-plugin marketplace (the `Estudio-Local/normativa` pattern):
- The marketplace and the plugin share `.claude-plugin/`; plugin source is `"./"` (not nested under `plugins/<name>/`)
- The dispatcher skill matches the plugin name (`canoa`); sub-skills follow `<plugin>-<verb>` naming so the family is obvious in Cowork's UI
- `mcp/dist/` IS committed so a fresh clone runs without `npm install` — the plugin install path doesn't ship a build step
- `${CLAUDE_PLUGIN_ROOT}` in `.mcp.json` makes the resolved path work regardless of where the plugin is installed on the user's machine

Multi-plugin marketplaces (e.g., `skills-for-architects`) use `plugins/<name>/` instead. Canoa is single-plugin.

## Hard rules

These are enforced in skill bodies and the MCP server. They protect the user-cost ceiling and catalog correctness.

- **Skills are thin relays to `canoa_chat`.** Actual catalog work (search, parse, walkthrough, sheet I/O) runs server-side on Canoa's Anthropic key. **Never run skill-side inference on the designer's tokens.**
- **MCP server has no business logic.** Tools are dumb proxies to `canoa.supply/api/*`.
- **Persona lives in two places** (`agents/canoa.md` here + `canoa-site/functions/api/_shared/agent-persona.ts`) — keep them in sync.
- **Audit always re-parses.** Any audit / verify / refresh request runs `parse_product_url` against the row's URL — never trusts the cached catalog or sheet value.
- **Sheet writes follow read-before-write + update-in-place.** Read the sheet first to map keys to actual headers; never invent columns. Patch existing rows by SKU match — never append duplicates.
- **No fabricated capabilities.** Canoa V1 has no background workers. Never claim "the catalog is refreshing in the background" or "I'll come back in a few minutes." State only what just happened.

## Catalog architecture

Every product in the catalog is labeled with a **trust tier** so the agent can hedge appropriately:

- **`verified`** — manufacturer source retained (line card PDF, vendor URL, parsed configurator). Ship-grade. Cite directly.
- **`observed`** — community / dealer-quote derived. Partial data. Cite carefully ("seen on a DWR quote, but not confirmed against Hem's line card").
- **`candidate`** — LLM-suggested, not yet validated. Placeholder for designer review; never auto-spec'd.

**Multi-source ingestion** — URL / PDF / SIF / dealer-quote / line-card / Configura. Each lands with full provenance (originating source artifact + per-field append-only audit + LLM trace). The catalog cache is the moat — every product enriched once is shared (anonymized) across all users.

**Pricing layered** — list price shared across users (catalog-cached); dealer-net + negotiated discounts stay per-user in `dealer_quote_documents` / `dealer_quote_lines`. Redaction at write-time enforces the boundary.

**Watch loop is verification-only** — the always-on watch refreshes catalog rows the user has touched (parse-product-url re-run on a schedule); it never autonomously generates new specs.

## Pricing model

- **Free trial**: ~$3 of Canoa-side Anthropic spend per user (the CAC ceiling)
- **Metered** (post-trial): $4 / M tokens billed via Stripe — 100% margin over Anthropic's blended rate
- **Catalog cache hits are free**: when a designer queries a product already in the cache, no Anthropic call happens; no metering

## Versioning + releases

- `plugin.json` carries the version (current: **v0.2.0**)
- Releases follow the **three-artifacts-move-together** pattern: bump `plugin.json`, tag git, publish a GitHub release. Plus a `CHANGELOG.md` entry under `[X.Y.Z] - YYYY-MM-DD`
- `marketplace.json` `metadata.version` bumps for marketplace-wide changes (docs / lint / hooks); `plugin.json` bumps for plugin behavior changes; both if a change touches both

## Telemetry

Per ALPA's open-source plugin convention: **default-on, README-disclosed, env-var opt-out**. Anonymized usage signals to inform plugin development.

Opt out via:
```bash
export CANOA_TELEMETRY_DISABLED=1
```

## Reference

- [`AlpacaLabsLLC/canoa-site`](https://github.com/AlpacaLabsLLC/canoa-site) — Marketing site + product API + D1 catalog + import pipeline. The backend this plugin talks to.
- `CLAUDE.md` (in this repo) — layout principles, hard rules, history of layout iterations
- ALPA plugin marketplace conventions documented in claude-memory `feedback_plugin_marketplace_patterns.md`
- ALPA plugin version-bump pattern documented in claude-memory `feedback_plugin_version_bump.md`

## License

MIT — see [LICENSE](./LICENSE).
