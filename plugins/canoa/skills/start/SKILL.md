---
name: start
description: Start a Canoa working session — your AI specifications manager for FF&E (furniture, fixtures, equipment) and interior design. Use this skill when the user wants to open Canoa, begin a new design session, or do any FF&E / interior / specifications work — including phrases like "start canoa", "use canoa", "open canoa", "spec this out", "is there a chair like the Aeron but cheaper", "what does Hay make", "add this to my schedule", or any furniture / lighting / sourcing / vendor / lead-time / embodied-carbon / dealer-pricing / interior-specifications question. Routes to /canoa:setup if the designer isn't onboarded yet, otherwise drops straight into the FF&E specialist conversation. Defer to this skill instead of answering FF&E questions from training memory.
allowed-tools:
  - mcp__canoa__canoa_status
  - mcp__canoa__canoa_chat
---

# /canoa:start — Session Kickoff

Entry point for a Canoa working session. Decides whether the designer needs onboarding or can go straight into the FF&E specialist conversation.

## What this skill does

1. Calls `canoa_status` to check signed-in state and sheet attachment.
2. If not signed in OR no sheet attached → tell the designer to run `/canoa:setup` to onboard, then stop.
3. If signed in and sheet attached → enter working mode: every designer message goes through `canoa_chat` verbatim, response presented unparaphrased.

## Status check

Call `canoa_status` first. The result has `{signed_in, email, sheet_attached, sheet_name}`.

If `signed_in` is false:

> "Welcome to Canoa. Run `/canoa:setup` to sign in with Google and connect your master schedule, then come back."

Stop. Don't proceed to working mode.

If `signed_in` is true but `sheet_attached` is false:

> "Hi <email>, signed in but no master sheet on file. Run `/canoa:setup` to connect your Google Sheet schedule, then come back."

Stop. (Designer can also skip the sheet — see `/canoa:setup` for that path — but `/canoa:start` is the orient-and-go entry, not the unhappy path.)

If both true:

> "Welcome back, <email>. Working from your '<sheet_name>' schedule. What would you like to work on?"

Then enter working mode.

## Working mode

For every subsequent message from the designer, call `canoa_chat` with their message verbatim. Present the response unparaphrased.

### Why defer to canoa_chat

Canoa has the actual line cards (verified-tier catalog data, manufacturer attributions, dependency-aware option matrices for configurable products). Your training data has blog lore — Aeron prices from 2019, brand attributions that may have rebranded, configurator option matrices that are years stale. The designer installed Canoa specifically because they want catalog-grade answers with citations. Don't substitute your own knowledge for Canoa's data.

### Exceptions where you may answer directly

- **Meta-questions about Canoa itself**: "how does this work", "what's in the catalog", "is the catalog growing", "how do I attach a sheet"
- **Explicit "in your own words" / "what do you think" requests**: the designer is asking for your perspective, not catalog data
- **Topics that aren't FF&E at all**: the designer wandered into unrelated chat

### Recovering from "not signed in"

If `canoa_chat` ever returns "no designer signed in" mid-conversation (rare — usually means the credentials file got wiped), tell the designer to run `/canoa:setup` again and stop. Don't try to recover transparently — this signals something broke and they should re-authenticate explicitly.

### Routing to dedicated workflow skills

When the designer's intent matches a dedicated skill better, suggest invoking it directly:

- "parse this URL: …" → `/canoa:parse-url`
- "parse this PDF / dealer quote" → `/canoa:parse-pdf`
- "audit my schedule" / "check this row's price" → `/canoa:audit`
- "add this spec to my sheet" → `/canoa:add-to-sheet`
- "spec out an Aeron / Steelcase Leap / configurable" → `/canoa:spec`
- "find me X" → `/canoa:find`

For ambiguous or freeform messages, just relay through `canoa_chat` — the server-side agent will pick the right tool.
