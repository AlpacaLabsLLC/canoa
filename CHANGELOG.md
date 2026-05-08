# Changelog

All notable changes to **Canoa** (`AlpacaLabsLLC/canoa`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Switched to flat single-plugin layout (Estudio-Local/normativa pattern).** Plugin source is `"./"` — repo root holds `.claude-plugin/`, `skills/`, `agents/`, `mcp/`, `.mcp.json`. The earlier nested `plugins/canoa/` layout (skills-for-architects pattern) was right for multi-plugin marketplaces but added unnecessary nesting for canoa's single-plugin distribution.
- **Skills renamed under a `canoa-` family with a dispatcher.** The dispatcher is `skills/canoa/SKILL.md` (matches plugin name → surfaces as `/canoa`); sub-skills are `canoa-setup`, `canoa-find`, `canoa-spec`, `canoa-parse-url`, `canoa-parse-pdf`, `canoa-audit`, `canoa-add-to-sheet`. Slash UX is `/canoa`, `/canoa-find`, `/canoa-audit`, etc. — no `:` namespace separator from the user's perspective. Mirrors `norma` / `norma-analyze` / `norma-informe`.
- **Dispatcher rewritten as a real router.** `skills/canoa/SKILL.md` now reads the designer's intent against a routing table and hands off to the right sub-skill, with a working-mode fallback that relays through `canoa_chat` for ambiguous freeform messages.

### Repackaged as a Claude plugin marketplace (earlier 2026-05-08)

- **`.claude-plugin/marketplace.json`** at the root, **`.claude-plugin/plugin.json`** alongside it.
- **MCP server bundled with the plugin.** `.mcp.json` declares the canoa MCP server using `${CLAUDE_PLUGIN_ROOT}/mcp/dist/server.js`, so installing the plugin auto-wires the 5 MCP tools — no per-user wrangler config required.
- **Repo renamed `canoa-skill` → `canoa`** at AlpacaLabsLLC. Repo made public for zero-auth Cowork/Code install.

### Added

- `LICENSE` (MIT, copyright 2026 Alpaca Design Lab LLC).
- `agents/canoa.md` (hoisted from `agent/canoa.md`) and `agents/README.md` documenting the FF&E specialist persona that runs server-side via `canoa_chat`.
- `.gitignore` covers `**/node_modules/`, `.canoa/`, `.wrangler/`, and `.DS_Store`.

### Removed

- Old flat skill layout: `skill/canoa/`, `agent/`, top-level `mcp/`. All content migrated into the new structure.
- Intermediate `plugins/canoa/` nesting from the earlier same-day iteration. Replaced by flat repo-root layout.

## [0.1.0-pre] - 2026-05-07

Pre-restructure milestone (development snapshot, not released).

### Added

- **Onboarding Wedges 1+2** (signup + sheet attach) — verified end-to-end with real Google OAuth client `canoa-mcp-dev` and signin from `f@alpacalabs.co`.
- **Wedge 3** — server-side sheet read/append agent tools (`read_master_sheet`, `append_to_sheet`) with multi-row header detection and read-before-write enforcement.
- **Tier B catalog enrichment pipeline** — skill-per-task architecture, per-skill provenance with full LLM trace (fine-tune-ready). 3 V1 skills shipped: `extract_product_description`, `extract_product_materials`, `extract_image_url`.
- **5 MCP tools**: `canoa_status`, `canoa_signup`, `canoa_signout`, `canoa_attach_sheet`, `canoa_chat`.
- **Anthropic Agent Skill** at `skill/canoa/SKILL.md` (later migrated into the plugin layout).

### Notes

- Both repos pushed to `AlpacaLabsLLC` GitHub org as private 2026-05-07: `canoa-site` (canoa.supply Pages project) and `canoa-skill` (this repo, since renamed to `canoa`).
