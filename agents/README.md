# Agents

The Canoa FF&E specialist persona. Unlike skills (single workflow, invoked directly), the agent is the persona Canoa runs server-side via `canoa_chat` — it assesses each designer message, picks the right tool (catalog search, parse, walkthrough, sheet read/write), and exercises judgment about citations, tier disclosures, and capability honesty.

| Agent | Domain | Skills it orchestrates |
|---|---|---|
| [canoa](./canoa.md) | FF&E specifications | start, setup, find, spec, parse-url, parse-pdf, audit, add-to-sheet |

## Where this persona actually runs

The persona file in this directory is **documentation** — it captures the persona's behavior so editors, designers, and contributors can read it. The live persona runs on the Canoa server inside `canoa-site/functions/api/_shared/agent-persona.ts` and is called from `/api/chat`. The two files must stay in sync; treat this one as the canonical source of truth for the persona's voice and rules, and mirror changes into the server-side fixture when you ship them.

When a designer invokes any skill in the canoa plugin, the skill body usually relays the designer's intent to the server-side agent (this persona) via the `canoa_chat` MCP tool. The agent owns: configurable-product walkthroughs, audit/re-verification, parse routing, sheet read-before-write enforcement, and tier-grade trust disclosures.
