---
name: canoa-onboard
description: >
  Canoa as the trainer. Walks a designer through Google sign-in, attaches a
  master schedule, runs one parse to prove value, interviews them about their
  studio (project types, headaches, preferred manufacturers, sustainability
  priorities), stores that context persistently so every other skill benefits,
  and sets a weekly check-in cadence. Use when the designer is getting started
  or says any of: "set me up", "setup", "help me get set up", "get started",
  "get me started", "sign me in", "connect my sheet", "I'm new to this", or
  is in their first session. Also use to recover from a wiped credentials file
  ("canoa says I'm not signed in").
allowed-tools: Read, Edit, Write, mcp__canoa__status, mcp__canoa__attach_sheet, mcp__canoa__parse_product_url
---

# Canoa Onboard

## Quick start

Four moves: sign in → attach a sheet → parse one URL → capture studio context → set a weekly rhythm. The whole arc takes 10–15 minutes and ends with Canoa knowing enough about the studio to be immediately useful.

```
Designer: "set me up"
→ canoa.status → if not signed in, send the designer to Cowork's connector
  menu to complete OAuth, then resume
→ canoa.attach_sheet → pick a sheet in Drive (or start fresh from template)
→ Ask designer to paste one product URL → canoa.parse_product_url → show the card
→ Ask 5 studio questions one at a time; store answers to session memory
→ "Each Monday, say 'weekly check' — I'll flag stale rows, price drift, and
   lead-time changes."
```

## Tone

Calm, designer-fluent. Never markety. Never overclaim. Describe **what Canoa will be able to do once connected**, not what the platform itself is. The designer knows what a sheet is — don't pitch it. One short sentence per step.

## Workflow

1. **Check state.** Call `canoa.status`. If a `## Studio profile` block already exists in session memory, read it first — then skip to the return-session path: show the existing profile, ask what's changed, update only the fields that changed. Don't re-interview from scratch.

2. **Confirm connection.** If `signed_in` is false, the OAuth handshake didn't complete during install. Cowork handles the connector OAuth flow directly (canoa is a remote HTTP MCP — sign-in is not a tool call). Tell the designer: *"Open Cowork's connector menu, find Canoa, click Connect — it'll walk you through Google sign-in. Come back and re-run `/canoa-onboard` once you're connected."* Stop here. Don't try to recover transparently — sign-in is owner-initiated by design.

3. **Attach a sheet.** Call `canoa.attach_sheet`. Two paths:
   - **Existing sheet:** the designer picks a master schedule from Drive. Canoa reads the headers and shows them back: *"I see columns A–AI: Thumbnail, Item Name, Manufacturer, ..., Embodied Carbon. Looks like a 35-column v1.2 schedule."*
   - **Fresh start:** if the designer has no sheet, offer to create one from the v1.2 Canoa Master Schedule template. See [reference/sheet-templates.md](reference/sheet-templates.md).

4. **Prove value.** Ask: *"Paste one product URL you have on hand — a manufacturer page, a dealer listing, or a configurator. I'll parse it now so you can see what Canoa returns."* Call `canoa.parse_product_url` with whatever they paste. Show the structured card — manufacturer, list price, dimensions, materials, tier. **This is the "aha" moment.** Don't skip it.

5. **Interview.** Ask the five questions from [reference/studio-profile-questions.md](reference/studio-profile-questions.md), one at a time, conversationally. Wait for the full answer before moving on. One follow-up is fine if vague; don't drill further. If the designer is pressed for time, compress to three: studio type, headaches, preferred manufacturers — never fewer.

6. **Store context.** Show the designer the full profile before writing. Wait for explicit approval. Write the block to session memory under the heading `## Studio profile` using the exact format in [reference/studio-profile-questions.md](reference/studio-profile-questions.md). If a memory file already exists, update only the `## Studio profile` section — don't touch other content. Confirm: *"Saved. Every Canoa command from here will know your studio."*

7. **Set rhythm.** Propose: *"Each Monday, just say 'weekly check' and I'll pull a snapshot — stale rows, price drift, lead-time changes. Sound right?"* If the designer prefers a different phrase or cadence, store it in the profile. Then name one command they can try right now (`/canoa-find`, `/canoa-parse-url`, or `/canoa-source-room` depending on what they said in the interview).

## Approval gates

- **Show profile before writing.** Display the full draft before storing.
- **Don't write to the schedule during onboarding.** This skill never appends or updates rows. Sheet writes happen in `/canoa-source-room`, `/canoa-spec`, and `/canoa-audit-*` — always with read-before-write and update-in-place enforced.

## Recovery

If `canoa.status` reports signed-in but a later call fails with "no designer found" (rare — usually means the bearer token expired or the credentials row got wiped server-side), tell the designer to disconnect Canoa in Cowork's connector menu and reconnect. Don't try to patch around it — sign-in is owner-initiated by design.

## What success looks like

By the end of onboarding, the designer has:

- A signed-in Canoa session bound to their Google account
- A master schedule attached
- One real parse cached in the catalog
- A `## Studio profile` block in session memory
- A weekly check-in commitment
- A concrete next command to try
