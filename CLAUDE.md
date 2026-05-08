# canoa (repo)

A Claude plugin marketplace + single-plugin distribution for **Canoa**, the AI specifications manager for FF&E and interior design. Layout follows the `skills-for-architects` pattern: marketplace at the repo root, plugin under `plugins/canoa/`, shared agent personas at top-level `agents/`.

## What this repo is (vs. what it isn't)

| | This repo (`canoa`) | `canoa-site` repo |
|---|---|---|
| What | Claude plugin marketplace + canoa plugin (skills + MCP server) | canoa.supply Pages project (marketing + `/api/*`) |
| Runtime | Plugin loaded by Claude Cowork / Claude Code; MCP server spawned per session | Cloudflare Pages + Functions + D1 |
| Distribution | `/plugin marketplace add AlpacaLabsLLC/canoa` then `/plugin install canoa@canoa` | Cloudflare Pages deploy |
| Iteration cadence | High (every UX change touches a skill body, the persona, or the MCP) | Lower (API endpoints stabilize once cached) |

## Folder structure

```
canoa/
├── .claude-plugin/
│   └── marketplace.json          # marketplace catalog (one plugin: canoa)
├── plugins/
│   └── canoa/
│       ├── .claude-plugin/
│       │   └── plugin.json       # plugin manifest
│       ├── README.md             # per-plugin docs (problem, diagram, skill table, install)
│       ├── skills/               # 8 workflow skills (one verb each)
│       │   ├── start/SKILL.md
│       │   ├── setup/SKILL.md
│       │   ├── find/SKILL.md
│       │   ├── spec/SKILL.md
│       │   ├── parse-url/SKILL.md
│       │   ├── parse-pdf/SKILL.md
│       │   ├── audit/SKILL.md
│       │   └── add-to-sheet/SKILL.md
│       ├── .mcp.json             # MCP server config (uses ${CLAUDE_PLUGIN_ROOT})
│       └── mcp/                  # Node MCP server (src + dist + package.json)
├── agents/
│   ├── canoa.md                  # FF&E specialist persona (server-side reference)
│   └── README.md
├── CHANGELOG.md
├── LICENSE
└── CLAUDE.md                     # this file
```

## Layout principles (from skills-for-architects)

- **Marketplace at repo root, plugin in subdirectory.** Even with a single plugin, the marketplace pattern stays consistent — leaves room for a second plugin later without restructuring.
- **One verb per skill.** `start`, `find`, `audit`, `parse-url` — not one monolithic SKILL.md that does everything. Each skill is a thin shell with `allowed-tools` scoped to the workflow.
- **Top-level `agents/` is documentation.** The agent persona files live at repo root as orchestration playbooks; they are NOT auto-loaded by the plugin runtime. Plugin-internal `agents/` is reserved for true Claude sub-agent definitions.
- **MCP server bundled inside the plugin.** `.mcp.json` references `${CLAUDE_PLUGIN_ROOT}/mcp/dist/server.js`. Installing the plugin auto-wires the MCP — no per-user wrangler config required.

## Hard rules

- **Skills are thin relays to `canoa_chat`.** The actual catalog work (search, parse, walkthrough, sheet I/O) runs server-side on Canoa's Anthropic key. Never run skill-side inference on the designer's tokens.
- **The MCP server is thin.** Its tools are dumb proxies to `canoa.supply/api/*`. No business logic in the MCP server.
- **The agent persona at `agents/canoa.md`** is the FF&E specialist's voice/conventions; it lives in two places (here + `canoa-site/functions/api/_shared/agent-persona.ts`) — keep them in sync.
- **Audit always re-parses.** Any audit, verify, or refresh request runs `parse_product_url` against the row's URL — never trusts the cached catalog or sheet value.
- **Sheet writes follow read-before-write + update-in-place.** Read the sheet first to map keys to actual headers, never invent columns. Patch existing rows by SKU match — never append duplicates.
- **No fabricated capabilities.** Canoa V1 has no background workers; never claim "the catalog is refreshing in the background" or "I'll come back in a few minutes." State only what just happened.

## Skill decomposition rationale

The previous monolithic SKILL.md (one file covering onboarding + chat relay + walkthroughs + capabilities + voice) was split into 8 verb-scoped skills on 2026-05-08 because:

1. **Slash invocation works better when scoped.** `/canoa:audit` is a clearer designer affordance than burying audit-on-touch rules inside a 200-line monolith.
2. **`allowed-tools` enforcement.** Per-skill tool restrictions prevent `find` from accidentally invoking `signup`, etc.
3. **Architects pattern.** Matches `skills-for-architects/06-materials-research` (12 skills), `08-dispatcher`, etc. — the established ALPA layout.

Server-side orchestration is unchanged: every skill ultimately routes through `canoa_chat`, which runs the persona at `agents/canoa.md`. Skill bodies are framing wrappers, not parallel implementations.
