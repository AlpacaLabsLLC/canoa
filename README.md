# Canoa — AI specifications manager for FF&E and interior design

Canoa is a Claude plugin for working with furniture, fixtures, and equipment specifications. Connects to your master Google Sheet schedule, parses vendor URLs and dealer-quote PDFs into a verified, manufacturer-cited catalog, and runs an FF&E specialist conversation backed by manufacturer line cards and configurable option matrices.

The plugin ships **one entry point — `/canoa` — that dispatches to seven sub-skills**:

| Slash command | Does | When |
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

### Claude Cowork (desktop)

1. **+** menu → **Add marketplace from GitHub**
2. Enter `AlpacaLabsLLC/canoa`
3. Install the **canoa** plugin
4. Run `/canoa` to start

### Claude Code (terminal)

```bash
claude plugin marketplace add AlpacaLabsLLC/canoa
claude plugin install canoa@canoa
```

Then `/canoa` to start, or any of the sub-skills directly.

### Local development

```bash
git clone https://github.com/AlpacaLabsLLC/canoa.git
claude --plugin-dir ./canoa
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

The MCP server is bundled with the plugin via `.mcp.json` using `${CLAUDE_PLUGIN_ROOT}` — installs auto-wire it; no per-user config required.

## Repo layout

```
canoa/
├── .claude-plugin/
│   ├── marketplace.json     # marketplace catalog (single-plugin)
│   └── plugin.json          # plugin manifest
├── skills/
│   ├── canoa/SKILL.md       # dispatcher
│   ├── canoa-setup/SKILL.md
│   ├── canoa-find/SKILL.md
│   ├── canoa-spec/SKILL.md
│   ├── canoa-parse-url/SKILL.md
│   ├── canoa-parse-pdf/SKILL.md
│   ├── canoa-audit/SKILL.md
│   └── canoa-add-to-sheet/SKILL.md
├── agents/
│   ├── canoa.md             # FF&E specialist persona (mirrored to canoa-site)
│   └── README.md
├── mcp/
│   ├── src/server.ts
│   └── dist/server.js       # committed for fresh-clone-runs-MCP
├── .mcp.json                # bundled MCP config (uses ${CLAUDE_PLUGIN_ROOT})
├── CHANGELOG.md
├── LICENSE
└── CLAUDE.md
```

## Catalog architecture

Three tiers — every product reference cites its tier so designers know the trust level:

- **verified** — manufacturer source retained (line card, vendor URL, parsed configurator); ship-grade
- **observed** — community / dealer-quote derived; partial data; cite carefully
- **candidate** — LLM-suggested, not yet validated; placeholder for designer review

Multi-source ingestion (URL / PDF / SIF / dealer-quote / line-card / Configura). Pricing layered: list price shared across users, dealer-net redacted per-user. Watch is verification-only (catalog refresh, not autonomous spec generation).

## License

MIT — see [LICENSE](./LICENSE).
