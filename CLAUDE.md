# canoa (repo)

A single-plugin Claude marketplace for **Canoa**, the AI specifications manager for FF&E and interior design. Layout follows the **`Estudio-Local/normativa` pattern**: flat repo where the marketplace and the plugin share `.claude-plugin/`, the plugin's source is `"./"`, and a single dispatcher skill (`canoa`, matching the plugin name) routes by intent to seven sub-skills (`canoa-setup`, `canoa-find`, `canoa-spec`, `canoa-parse-url`, `canoa-parse-pdf`, `canoa-audit`, `canoa-add-to-sheet`).

## What this repo is (vs. what it isn't)

| | This repo (`canoa`) | `canoa-site` repo |
|---|---|---|
| What | Claude plugin marketplace + canoa plugin (skills + bundled MCP server) | canoa.supply Pages project (marketing + `/api/*`) |
| Runtime | Plugin loaded by Claude Cowork / Claude Code; MCP server spawned per session | Cloudflare Pages + Functions + D1 |
| Distribution | `/plugin marketplace add AlpacaLabsLLC/canoa` then `/plugin install canoa@canoa` | Cloudflare Pages deploy (V1 not yet deployed; production canoa.supply still serves legacy site) |
| Iteration cadence | High (every UX change touches a skill body, the persona, or the MCP) | Lower (API endpoints stabilize once cached) |

## Folder structure

```
canoa/
├── .claude-plugin/
│   ├── marketplace.json     # single-plugin marketplace; plugin source "./"
│   └── plugin.json          # plugin manifest (name=canoa)
├── skills/
│   ├── canoa/SKILL.md       # /canoa dispatcher (matches plugin name)
│   ├── canoa-setup/SKILL.md
│   ├── canoa-find/SKILL.md
│   ├── canoa-spec/SKILL.md
│   ├── canoa-parse-url/SKILL.md
│   ├── canoa-parse-pdf/SKILL.md
│   ├── canoa-audit/SKILL.md
│   └── canoa-add-to-sheet/SKILL.md
├── agents/
│   ├── canoa.md             # FF&E specialist persona (server-side reference)
│   └── README.md
├── mcp/
│   ├── src/server.ts
│   └── dist/server.js       # committed
├── .mcp.json                # ${CLAUDE_PLUGIN_ROOT}/mcp/dist/server.js
├── CHANGELOG.md
├── LICENSE
└── CLAUDE.md                # this file
```

## Layout principles (from Estudio-Local/normativa)

- **Flat single-plugin marketplace.** Plugin source is `"./"` — the plugin lives at the repo root, not in `plugins/<name>/`. Used when the marketplace is shipping one plugin. Multi-plugin marketplaces (e.g., `skills-for-architects`) use `plugins/<name>/` instead.
- **Dispatcher skill matches plugin name.** The `canoa` skill is the entry point; sub-skills carry the `canoa-` prefix to make the family obvious in Cowork's UI. Mirrors `norma` / `norma-analyze` / `norma-informe`.
- **Sub-skills are thin shells over `canoa_chat`.** Each skill frames the designer's intent for the server-side persona and relays through the MCP. Skill bodies enforce hard rules (audit-on-touch, read-before-write, update-in-place, no fabricated capabilities) but don't reproduce server-side logic.
- **`agents/` is documentation.** The agent persona files at repo root are orchestration playbooks; they are NOT auto-loaded by the plugin runtime. The live persona runs server-side via `canoa-site/functions/api/_shared/agent-persona.ts`. Keep both in sync.
- **MCP server bundled.** `.mcp.json` references `${CLAUDE_PLUGIN_ROOT}/mcp/dist/server.js`. Installing the plugin auto-wires the MCP — no per-user wrangler config required.

## Hard rules

- **Skills are thin relays to `canoa_chat`.** The actual catalog work (search, parse, walkthrough, sheet I/O) runs server-side on Canoa's Anthropic key. Never run skill-side inference on the designer's tokens.
- **The MCP server is thin.** Its tools are dumb proxies to `canoa.supply/api/*`. No business logic in the MCP server.
- **The agent persona at `agents/canoa.md`** is the FF&E specialist's voice/conventions; it lives in two places (here + `canoa-site/functions/api/_shared/agent-persona.ts`) — keep them in sync.
- **Audit always re-parses.** Any audit, verify, or refresh request runs `parse_product_url` against the row's URL — never trusts the cached catalog or sheet value.
- **Sheet writes follow read-before-write + update-in-place.** Read the sheet first to map keys to actual headers, never invent columns. Patch existing rows by SKU match — never append duplicates.
- **No fabricated capabilities.** Canoa V1 has no background workers; never claim "the catalog is refreshing in the background" or "I'll come back in a few minutes." State only what just happened.

## Why this layout (vs. earlier iterations this session)

This session went through three layouts in sequence:

1. **Flat skill + standalone MCP** (pre-2026-05-08): `skill/canoa/SKILL.md` + per-user MCP config in `claude_desktop_config.json`. Not a plugin; not Cowork-installable.
2. **Multi-plugin marketplace nesting** (early 2026-05-08): `plugins/canoa/skills/<verb>/SKILL.md` with verb-only skill names (`start`, `find`, `audit`, etc.). Followed `skills-for-architects` pattern. Worked, but `/canoa:start` is awkward UX for a single-plugin distribution.
3. **Flat single-plugin with dispatcher** (current): `skills/canoa/SKILL.md` (dispatcher) + `skills/canoa-<verb>/SKILL.md` (sub-skills). Matches `Estudio-Local/normativa`. Slash UX surfaces as `/canoa`, `/canoa-find`, `/canoa-audit`, etc.

Pattern selection: `skills-for-architects` style (`plugins/<name>/`) is right for **multi-plugin** marketplaces with shared agents/rules/hooks across many plugins. `normativa` style (flat with dispatcher) is right for **single-plugin** marketplaces. Canoa is single-plugin.
