# Changelog

All notable changes to **Canoa** (`AlpacaLabsLLC/canoa`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Repackaged as a Claude plugin marketplace.** Repo restructured to follow the `skills-for-architects` pattern: `.claude-plugin/marketplace.json` at the root, plugins under `plugins/<name>/`, top-level `agents/` for orchestration personas. The single `canoa` plugin replaces the prior flat `skill/canoa/SKILL.md` + standalone MCP layout.
- **Skill decomposition.** The monolithic `SKILL.md` was split into 8 workflow skills: `start`, `setup`, `find`, `spec`, `parse-url`, `parse-pdf`, `audit`, `add-to-sheet`. Each skill is one verb, with `allowed-tools` scoped to that workflow.
- **MCP server bundled with the plugin.** `plugins/canoa/.mcp.json` declares the canoa MCP server using `${CLAUDE_PLUGIN_ROOT}/mcp/dist/server.js`, so installing the plugin auto-wires the 5 MCP tools — no per-user wrangler config required.

### Added

- `LICENSE` (MIT, copyright 2026 Alpaca Design Lab LLC).
- `agents/canoa.md` (hoisted from `agent/canoa.md`) and `agents/README.md` documenting the FF&E specialist persona that runs server-side via `canoa_chat`.
- Per-plugin `plugins/canoa/README.md` with problem statement, skill table, and install instructions for Claude Cowork + Claude Code.

### Removed

- Old flat layout: `skill/canoa/`, `agent/`, top-level `mcp/`. All content migrated into `plugins/canoa/` or `agents/`.

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
