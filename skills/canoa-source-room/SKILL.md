---
name: canoa-source-room
description: >
  Brief → catalog cards → configurable walkthrough → cart review → add to
  schedule, in one approval-gated flow. Use when the designer is starting a
  new space and wants to source multiple items together — "I'm setting up
  a lobby", "source for the new guest room", "spec a conference room",
  "fit out the executive office", "what should go in this restaurant".
  Chains canoa-find + canoa-spec + sheet writes with explicit approvals
  at every step.
allowed-tools: Read, mcp__canoa__read_master_sheet, mcp__canoa__catalog_search, mcp__canoa__spec_walkthrough, mcp__canoa__append_rows
---

# Source a Room

A multi-step sourcing workflow. Takes a designer's brief for a single space and produces a cart of products, walks any configurables, and adds the approved set to the master schedule.

## When to use

- Starting a fresh project space (lobby, guest room, conference room, restaurant)
- Filling out a partly-sourced space (the designer has some products picked, needs the rest)
- Re-doing a space against a tightened budget

For single-product discovery, use `/canoa-find`. For one configurable, use `/canoa-spec`.

## Quick start

```
Designer: "I'm sourcing the lobby for a 60-room boutique hotel — warm wood,
mid-century-leaning, $35k budget for casegoods and seating"
→ Read ## Studio profile from memory
→ Step 1: Brief → search the catalog
→ Step 2: Present cards in groups (seating, tables, lighting, accents)
→ Step 3: Walk any configurables → /canoa-spec inline
→ Step 4: Cart review with running total + embodied carbon
→ APPROVAL → Step 5: Add to schedule
```

## Workflow

### Step 1 — Capture the brief

Ask for what you don't have. Don't drill — three short questions max:

- **Space type and size** (lobby / guest room / conference room / restaurant; rooms count or sqft)
- **Aesthetic direction** (one or two adjectives + a reference brand if the designer has one)
- **Budget** (per-line or whole-space)

Read `## Studio profile` from session memory. Use preferred manufacturers to bias category searches; use sustainability stance to decide whether to surface embodied carbon in the cards.

[reference/room-types.md](reference/room-types.md) has typical product categories per room type.

### Step 2 — Search

For each category the room needs, call `canoa.catalog_search` with structured filters derived from the brief. Present 6–8 cards per category, grouped (seating, tables, lighting, casegoods, accents). Cite tier on every card.

If the catalog is sparse in a category, say so honestly and offer:
- Paste a URL the designer already has → `/canoa-parse-url`
- Skip this category for now

### Step 3 — Pick

For each category, the designer picks N items. Capture the selections. For each pick:

- **Configurable** (Aeron, Leap, Swoop): invoke `canoa.spec_walkthrough` inline. Walk options one per turn, lock the configuration, capture the final SKU + price.
- **Fixed SKU**: just add to the cart.

Don't try to walk five configurables back-to-back — work through them one at a time so the designer doesn't lose track.

### Step 4 — Cart review

Present the consolidated cart:

```
LOBBY — Boutique Hotel
─────────────────────────────────────────
Seating
  - About A Chair AAC 22 × 8     $635   $5,080   (verified · Hay)
  - Mags Soft Sofa × 1           $5,495 $5,495   (verified · Hay)
Tables
  - Pinta Coffee Table × 2       $2,180 $4,360   (verified · Carl Hansen)
Lighting
  - Pao Steel Pendant × 6        $545   $3,270   (verified · Hay)
...
─────────────────────────────────────────
Cart subtotal:                          $32,840
Embodied carbon (where known):         412 kgCO2e
Budget:                                 $35,000  ✓
Items:                                  19
```

If `sustainability stance: required for *` in the profile, surface embodied carbon. If `none`, suppress the column.

### Step 5 — Approval and write

```
"Add 19 items to the master schedule starting at row 47?"
```

On approval, call `canoa.read_master_sheet` to confirm headers, then `canoa.append_rows` with the cart. Apply the canonical column mapping; respect any custom columns in the designer's sheet (read-before-write).

Show the designer the written rows (a count + first/last row numbers + the sheet URL). Don't claim background activity that isn't happening.

## Hard rules

- **Approval before write.** Never append rows without explicit cart approval.
- **One configurable at a time.** No back-to-back walkthroughs without acknowledging each lock.
- **Read before write.** Always call `canoa.read_master_sheet` immediately before `canoa.append_rows`.
- **Respect the existing column layout.** If the designer's sheet has custom columns, fill what you can; don't invent columns.
- **Cite tier on every card and every line in the cart.**
