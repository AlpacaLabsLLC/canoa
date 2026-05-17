# Studio profile questions

## The five questions

Ask one at a time. Wait for the full answer before moving on. One follow-up is fine if an answer is vague; do not drill further.

1. **Studio type and project mix.** *"What kind of work does the studio do? Commercial, hospitality, residential, or a mix?"*
2. **Team size.** *"How many designers work on FF&E specs, including yourself?"*
3. **Top three headaches.** *"What eats the most time on a spec book? Sourcing, dealer-quote follow-up, audit/verification, embodied carbon, something else?"*
4. **Preferred manufacturers.** *"Which 3–5 manufacturers do you spec most often?"*
5. **Sustainability stance.** *"Do clients require embodied-carbon disclosures? None / nice-to-have / required for some / required for all."*

If the designer is short on time, compress to questions 1, 3, and 4 — those three feed the most downstream skills.

---

## Profile block format

Write to session memory under the heading `## Studio profile`. Use this exact structure (omit fields the designer skipped):

```markdown
## Studio profile

- **Studio type:** commercial / hospitality / residential / mixed
- **Project mix:** <e.g., 60% hospitality, 30% commercial, 10% residential>
- **Team size:** <N>
- **Top headaches:** <comma-separated, in order>
- **Preferred manufacturers:** <comma-separated, 3–5>
- **Sustainability stance:** none / nice-to-have / required for some / required for all
- **Check-in cadence:** <e.g., "Monday weekly check">
```

---

## How downstream skills use the profile

- **`canoa-find`** reads preferred manufacturers and biases NL search results toward them when the query is brand-agnostic.
- **`canoa-source-room`** reads project mix to pick room-type templates (hospitality lobby vs commercial conference room).
- **`canoa-weekly-check`** reads check-in cadence to know when to fire, and headaches to know what to surface.
- **`canoa-build-spec-book`** reads sustainability stance to decide whether to include the embodied-carbon column by default.

---

## When the studio doesn't have a clear answer

For sustainability stance, if the designer says "depends on the client", store `nice-to-have` and note: *"I'll include carbon columns when you tell me a project needs them."*

For preferred manufacturers, if the designer can't name 3–5, ask: *"Last project — who did you spec for the seating? The tables?"* Names that come up twice get stored.
