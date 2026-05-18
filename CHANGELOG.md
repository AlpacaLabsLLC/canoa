# Changelog

All notable changes to **Canoa** (`AlpacaLabsLLC/canoa`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-05-18

### Changed

- **`canoa-build-spec-book` SKILL clarified on PDF rendering.** The server returns print-ready HTML with `window.print()` triggered on load — the designer's browser produces the PDF via Cmd+P → Save as PDF. Native server-rendered PDF (Cloudflare Browser Rendering) lands in v1.1. The skill body and `reference/output-formats.md` now reflect this; no behavioral change vs v1.0.0, only documentation alignment with what the backend ships.

## [1.0.0] - 2026-05-16

Full rewrite to match the Anthropic `knowledge-work-plugins/small-business` pattern: remote HTTP MCP, skills-only payload, workflow-shaped skills instead of `canoa_chat` relays.

### Changed

- **`.mcp.json` is now a single remote HTTP entry** — `canoa` → `https://canoa.supply/api/mcp`. No bundled local Node server, no `${CLAUDE_PLUGIN_ROOT}` path. Fixes the two V0.x install-path failures: Cowork no longer needs to auto-load a plugin `.mcp.json` containing a local-command spec, and hotfixes don't require existing users to re-pull from a cache-locked marketplace.
- **Skills no longer relay through `canoa_chat`.** Each skill calls granular MCP tools directly (`catalog_search`, `parse_product_url`, `parse_pdf`, `spec_walkthrough`, `read_master_sheet`, `append_rows`, `update_row_by_match`, `audit_row`, `audit_schedule_enqueue`, `audit_job_status`, `export_spec_book`). The router (`skills/canoa/SKILL.md`) is now purely a dispatcher; there is no working-mode fallback that paraphrases through one mega-tool.
- **`marketplace.json` carries `metadata.version`** (1.0.0). PATTERNS.md rule #6 (three-artifact discipline) now applies in full to canoa.
- **License** changed from MIT to Proprietary. The plugin remains free to install; the catalog data and backend service are not open source.

### Added

- **`canoa-onboard`** — replaces `canoa-setup`. Adds the Anthropic-pattern onboarding arc: sign in → attach sheet → parse one URL to prove value → 5-question studio interview → `## Studio profile` block written to session memory → weekly check-in cadence. Includes `reference/studio-profile-questions.md`, `reference/sheet-templates.md`, and a worked transcript at `reference/examples/happy-path.md`.
- **`canoa-audit-row`** — single-row verification (replaces the per-row half of the old `canoa-audit`).
- **`canoa-audit-schedule`** — bulk verification with a server-side queue (replaces the bulk half of the old `canoa-audit`; requires the `audit_schedule_enqueue` + `audit_job_status` MCP tools).
- **`canoa-source-room`** — multi-step sourcing workflow: brief → catalog cards → configurable walkthroughs → cart review → approval-gated append. Includes `reference/room-types.md`.
- **`canoa-build-spec-book`** — schedule → branded artifact (PDF / Sheets / Markdown), with server-side Dealer Net redaction and audience-aware column profiles. Includes `reference/output-formats.md`.
- **`canoa-weekly-check`** — Monday brief. Surfaces drift, stale rows, in-flight orders, and tier=candidate rows in active projects. Adapts to designer's headaches from the studio profile.

### Removed

- **`mcp/` directory** — bundled Node MCP server deleted. The connector lives at canoa-site.
- **`agents/` directory** — persona documentation no longer ships in the plugin. Lives in canoa-site only.
- **`CLAUDE.md`** — Anthropic plugin pattern doesn't ship one.
- **`canoa-setup` skill** — folded into `canoa-onboard`.
- **`canoa-add-to-sheet` skill** — folded into `canoa-source-room` and direct sheet-tool calls from other skills.
- **`canoa-audit` skill** — split into `canoa-audit-row` (single) and `canoa-audit-schedule` (bulk).
- **Working-mode fallback in the router** — the old `canoa_chat`-relay path for ambiguous messages. The router now always picks a command or asks one clarifying question.

### Backend dependency

This plugin assumes `canoa.supply/api/mcp` exposes the granular tool surface listed above (12 tools). As of 2026-05-16, the live MCP exposes the original 5 (`status`, `signup`, `signout`, `attach_sheet`, `chat`). The `canoa_chat` orchestrator needs to be refactored into the granular tools before the plugin is functional end-to-end. See plan in conversation log.

---

## [0.2.1] - 2026-05-10

### Fixed

- **MCP failed to start on a fresh install.** Persona path resolved to `agent/canoa.md` (singular); the file is at `agents/canoa.md` (plural — renamed in 0.2.0). The server logged `ENOENT` and `process.exit(1)` immediately. Path now correctly resolves to `agents/canoa.md`.
- **Default `CANOA_API_BASE` pointed at the legacy site.** Was `https://canoa.supply/api`, which still serves the old Webflow content (DNS not yet cut over). Defaults to `https://canoa-site.pages.dev/api` so installs work today; will move back to `canoa.supply/api` once DNS flips.
- **Removed `CANOA_USER_ID` env fallback.** It could let `canoa_status` report signed-in for a user with no oauth_tokens row, then `/api/chat` would 401 with a confusing error. Real OAuth via `canoa_signup` is now the only path to a `user_id`.

## [0.2.0] - 2026-05-08

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
