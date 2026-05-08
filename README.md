# Canoa

Your AI specifications manager for FF&E (furniture, fixtures, equipment) and interior design — packaged as a Claude plugin.

This repo is both a **plugin marketplace** and a **single-plugin distribution**. The marketplace lists one plugin (`canoa`), which bundles 8 workflow skills, a server-side FF&E specialist persona, and a Node MCP server that proxies to `canoa.supply/api/*` where the actual catalog work happens.

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

After install, run `/canoa:setup` to onboard (Google OAuth + master Google Sheet attach), then `/canoa:start` to begin a working session — or just say "use canoa" and the skill auto-fires from its description.

## Repo layout

```
canoa/  (this repo)
├── .claude-plugin/
│   └── marketplace.json          # marketplace catalog
├── plugins/
│   └── canoa/                    # the canoa plugin
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── README.md             # per-plugin overview + skill table
│       ├── skills/               # 8 workflow skills
│       │   ├── start/
│       │   ├── setup/
│       │   ├── find/
│       │   ├── spec/
│       │   ├── parse-url/
│       │   ├── parse-pdf/
│       │   ├── audit/
│       │   └── add-to-sheet/
│       ├── .mcp.json             # bundled MCP server config
│       └── mcp/                  # Node MCP server (5 tools)
├── agents/
│   ├── canoa.md                  # FF&E specialist persona (mirrored to canoa-site)
│   └── README.md
├── CHANGELOG.md
├── LICENSE
└── CLAUDE.md
```

## What's where

| Path | Purpose |
|---|---|
| `.claude-plugin/marketplace.json` | Marketplace catalog — single plugin entry pointing at `./plugins/canoa` |
| `plugins/canoa/skills/<verb>/SKILL.md` | One workflow per skill: `/canoa:start`, `/canoa:find`, `/canoa:audit`, etc. |
| `plugins/canoa/.mcp.json` | Wires the bundled MCP server to Claude on plugin enable |
| `plugins/canoa/mcp/` | Node MCP server source + compiled output (`dist/server.js`) |
| `agents/canoa.md` | Server-side FF&E persona — also lives in `canoa-site/_shared/agent-persona.ts`; keep in sync |

## Develop

Test locally without publishing:

```bash
claude --plugin-dir ./plugins/canoa
```

Reload after edits:

```text
/reload-plugins
```

## Status

Pre-alpha. Onboarding Wedges 1+2 (signup + sheet attach), Wedge 3 (sheet read/write), and Tier B (catalog enrichment skills) shipped 2026-05-07. Repackaged as a Claude plugin marketplace 2026-05-08.

## License

MIT — see [LICENSE](./LICENSE).
