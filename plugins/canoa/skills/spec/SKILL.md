---
name: spec
description: Spec out a product — configurable walkthrough (Aeron, Steelcase Leap, Swoop, Aeron Stool, etc.) or fixed-SKU lock. Use when the designer says "spec out the Aeron", "configure a Leap", "lock this product", "walk me through the options", "spec this", "what are the options on the Swoop", or any request to step through a configurable product's option matrix and produce a final SKU + price. Routes through canoa_chat to the server-side agent which owns the option matrix and dependency rules.
allowed-tools:
  - mcp__canoa__canoa_chat
---

# /canoa:spec — Spec a Product

Walks the designer through a configurable product (or locks a fixed-SKU product). The option matrix and `valid_when` cross-option dependency rules live server-side, so this skill relays each turn through `canoa_chat` and presents the response unparaphrased.

## When to use this skill

- Configurable products with multiple option dimensions (chair: size + frame + back + arms + casters + etc.)
- Fixed-SKU products where the designer wants to "lock in" a final spec line for the schedule
- Substitution requests ("what if I want the Aeron with leather instead?")

For pure catalog discovery ("what task chairs do you have?"), use `/canoa:find` instead.

## How to invoke

Relay the designer's intent verbatim through `canoa_chat`. Don't try to walk the option matrix on your side — your training data has stale option matrices and missing `valid_when` rules.

```
canoa_chat("spec out an Aeron Size B for an executive office")
```

The server-side agent will:

1. Confirm the product family.
2. Walk **one option per turn**, presenting a small table (option | what it does), ask, lock, advance.
3. Catch cross-option dependency conflicts (e.g., Forward Seat Angle requires Forward Tilt) and offer resolution.
4. At the end, return: final SKU (or option string if no SKU resolves), list price, lead time, dealer note where applicable.

## Closing without a price on file

When the designer locks a configuration but Canoa reports "no verified SKU or list price on file" (common today — the catalog has option matrices but few resolved variants), the server-side agent will lead with **one bold action**, not a menu:

> "Paste your locked configuration's URL from the manufacturer's configurator and I'll parse the SKU + list price into the catalog."

That routes through `parse_product_url` server-side. If the designer has a dealer quote PDF instead, the agent suggests `/canoa:parse-pdf`.

Don't menu-list four options — designers don't know which to pick. The agent picks the right one for context and offers it as a single concrete next step.

## Tier disclosure

Every spec result includes the source's tier:

- **verified** — manufacturer line card or canonical vendor URL parsed; trust for spec books
- **observed** — community / dealer-quote derived; partial; cite carefully
- **candidate** — LLM-suggested, not yet validated; do not ship in a spec book without verification

If the designer locks a candidate-tier configuration, the agent surfaces this and suggests parsing a manufacturer URL or dealer PDF to upgrade the tier.

## Add to schedule

Once a spec is locked, the designer typically wants it in their master sheet. Suggest `/canoa:add-to-sheet` for the explicit append flow. Or, if the designer says "add it" in plain language, just relay through `canoa_chat` — the server-side agent will route to the sheet write tools (Wedge 3) with read-before-write enforced.
