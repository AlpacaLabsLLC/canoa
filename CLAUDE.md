# canoa-skill

The Claude-side bundle for Canoa: the **`/canoa` Anthropic Agent Skill** (`skill/canoa/SKILL.md`) plus the underlying **MCP server** (`mcp/`) the skill calls. The skill orchestrates onboarding + the FF&E specialist conversation; the MCP server proxies to `canoa.supply/api/*` where the actual catalog work happens.

## What this repo is (vs. what it isn't)

| | This repo (`canoa-skill`) | `canoa-site` repo |
|---|---|---|
| What | Claude Agent Skill + MCP server | canoa.supply Pages project (marketing + `/api/*`) |
| Runtime | Skill loaded by Claude Desktop / Claude Code; MCP server spawned per session | Cloudflare Pages + Functions + D1 |
| Distribution | Skill: claude.ai Skills (Desktop) + `~/.claude/skills/` (Code). MCP: per-user wrangler config. | Cloudflare Pages deploy |
| Iteration cadence | High (every UX change touches the skill body or MCP) | Lower (API endpoints stabilize once cached) |

## Folder structure

```
canoa-skill/
├── agent/
│   └── canoa.md           # FF&E specialist persona — server-side reference (mirrored in canoa-site/_shared/agent-persona.ts)
├── skill/
│   └── canoa/
│       └── SKILL.md       # the /canoa Agent Skill the user invokes (orchestration + onboarding)
└── mcp/
    ├── src/server.ts      # MCP server source
    ├── dist/              # compiled output
    └── README.md          # install steps + Google Cloud setup
```

The `/canoa` skill is the user-facing entry point. The MCP server is the underlying tool surface (`canoa_status`, `canoa_signup`, `canoa_signout`, `canoa_attach_sheet`, `canoa_chat`). The skill body tells Claude when to call which MCP tool; the agent persona on the server side governs how `canoa_chat` actually responds.

## Hard rules

- **The skill (`skill/canoa/SKILL.md`) is the orchestration layer.** It owns onboarding, when-to-defer-to-canoa_chat, capability constraints. Edit it for behavioral changes.
- **The MCP server (`mcp/`) is thin.** Its tools are dumb proxies to `canoa.supply/api/*`. No business logic lives in the MCP server.
- **The agent persona (`agent/canoa.md`)** is the FF&E specialist's voice/conventions; it lives in two places (here + `canoa-site/_shared/agent-persona.ts`) — keep them in sync.
- **All catalog/inference work runs on Canoa's Anthropic key**, server-side, via `canoa_chat`. Never run skill-side inference on the designer's tokens.
- **`canoa-skill/skills/` is intentionally absent.** Pre-V1 design seeded 21 SKILL.md files copied from `skills-for-architects`; deleted 2026-05-07 because (a) their invocation mechanism was wrong for the V1 architecture and (b) they all live in `~/Documents/code/skills-for-architects/` already, so when we need a future capability (image processing, EPD parsing, spec writing) we mine the relevant body from there as starting material for a new V1 server-side tool. Don't recreate the directory here.
