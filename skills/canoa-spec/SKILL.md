---
name: canoa-spec
description: >
  Walk through a configurable product (Aeron, Steelcase Leap, Swoop, Aeron Stool)
  or lock a fixed-SKU product. Use when the designer says "spec out the Aeron",
  "configure a Leap", "lock this product", "walk me through the options",
  "what are the options on the Swoop", or any request to step through a
  configurable product's option matrix and produce a final SKU + price.
allowed-tools: mcp__canoa__spec_walkthrough
---

# Spec a Product

Walks the designer through a configurable product turn by turn. The option matrix and `valid_when` cross-option dependency rules live server-side — never reproduce them locally; your training data has stale matrices and missing dependency clauses.

## How to invoke

Call `canoa.spec_walkthrough` with the product reference (catalog ID, SKU prefix, or product name) and the designer's free-text intent:

```
canoa.spec_walkthrough({
  product: "aeron",
  message: "spec out an Aeron Size B for an executive office"
})
```

The tool returns the next prompt for the designer — one option dimension at a time, with a small table (`option | what it does`). Present it unparaphrased. Capture the designer's answer, pass it back via `canoa.spec_walkthrough` again with the session ID it returned. Continue until the tool reports `locked: true`.

## What a finished walkthrough returns

- **Final SKU** (or option string if no canonical SKU resolves)
- **List price** for the locked configuration
- **Lead time** when available
- **Dealer note** when applicable (e.g., MillerKnoll dealer-only items)
- **Tier**

## Closing without a price on file

When the designer locks a configuration but the catalog has no verified SKU or list price for it (common — the catalog has option matrices but few resolved variants), lead with **one bold action**:

> "Paste your locked configuration's URL from the manufacturer's configurator and I'll parse the SKU + list price into the catalog."

That routes to `/canoa-parse-url`. If the designer has a dealer-quote PDF instead, suggest `/canoa-parse-pdf`. Don't menu-list four options — designers don't know which to pick.

## Tier disclosure

Lead the locked-spec presentation with the source tier:

- **verified** — manufacturer line card or canonical vendor URL parsed; trust for spec books
- **observed** — community / dealer-quote derived; partial; cite carefully
- **candidate** — LLM-suggested, not yet validated; don't ship in a spec book without verifying

If the designer locks a candidate-tier configuration, suggest parsing a manufacturer URL or dealer PDF to upgrade the tier.

## Adding to the schedule

Once locked, the designer usually wants the spec in the master sheet. Suggest `/canoa-source-room` if they're sourcing a full space; otherwise call `canoa.append_rows` directly with the locked spec — read the sheet headers first via `canoa.read_master_sheet`.
