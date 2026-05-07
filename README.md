# Canoa

The Claude-side bundle for Canoa — your AI specifications manager.

Designers install Canoa from canoa.supply. The bundle contains:

- **Skill** (`skill/canoa/SKILL.md`) — the `/canoa` Anthropic Agent Skill: onboarding + orchestration. The user-facing entry point.
- **Agent persona** (`agent/canoa.md`) — the FF&E specialist persona reference (mirrored server-side in `canoa-site/_shared/agent-persona.ts`)
- **MCP server** (`mcp/`) — thin proxy to `canoa.supply/api/*` exposing 5 tools (`canoa_status`, `canoa_signup`, `canoa_signout`, `canoa_attach_sheet`, `canoa_chat`). All inference + sheet I/O runs server-side on Canoa's key.

## Status

Pre-alpha — repo scaffolded 2026-05-05. Onboarding Wedges 1+2 (signup + sheet attach) shipped + verified end-to-end on 2026-05-07. Wedge 3 (server-side sheet read/append agent tools) shipped same day.

## Project structure

See `CLAUDE.md`.

## Distribution

Will publish to Anthropic's Skills directory once V1 stabilizes. Until then: drop `skill/canoa/SKILL.md` into `~/.claude/skills/canoa/` for Claude Code; package via skill-creator (`python -m scripts.package_skill skill/canoa`) for Claude Desktop.
