# Sheet templates

## v1.2 Canoa Master Schedule (default)

35 columns. Designed for FF&E specs that ship to commercial / hospitality clients.

Column highlights:

- **A** — Thumbnail (image, auto-fetched from catalog when available)
- **B–F** — Item identifiers: Item Name, Manufacturer, Designer, Collection, SKU
- **G–L** — Specs: Variant, Dimensions, Materials, Finishes, COM yardage, Lead Time
- **M–S** — Commercial: List Price, Quantity, Extended List, Discount, Dealer Net (private per user), Extended Net, Vendor
- **T–Z** — Project context: Room, Zone, Tag, Status (specified / approved / ordered / received), Approval Notes, RFP Bid #, Punch List
- **AA–AG** — Provenance: Vendor URL, Last Verified, Source Kind, Audit Status, Tier (verified/observed/candidate), Page Ref, Date Added
- **AH** — Dealer Net **[PRIVATE]** (filtered out on exports unless designer is the sheet owner)
- **AI** — Embodied Carbon (kgCO2e — manufacturer-published when available; auto-estimated otherwise)

## How attach detects an existing sheet

`canoa.attach_sheet` reads the active sheet's first row. If headers match the v1.2 schema, it binds 1:1. If headers don't match (designer has their own column layout), Canoa runs header-fuzzy-match and shows the mapping for designer approval before any write.

## Fresh-start path

When the designer has no existing sheet, `canoa.attach_sheet` creates a new Google Sheet in their Drive titled `<Studio> - FF&E Master Schedule (v1.2)`, with the 35 columns above. The designer gets the share URL and can rename / move freely.

## Cross-reference with skills-for-architects

The v1.2 schema is adopted from the canonical [skills-for-architects/master-schedule](https://github.com/AlpacaLabsLLC/skills-for-architects/tree/main/plugins/06-materials-research/skills/master-schedule). Canoa adds three columns (Thumbnail, Dealer Net, Embodied Carbon) that are FF&E-specific and absent from the upstream schema.

## Migration from earlier sheets

If the designer attaches a non-v1.2 sheet, Canoa works against the existing layout — never silently rewrites columns. The designer can run `/canoa-build-spec-book` to export a v1.2 version anytime; their working sheet stays as-is.
