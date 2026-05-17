# Happy-path onboarding transcript

A worked example of `canoa-onboard` from cold start. Designer = Sarah, principal at a 4-person hospitality-leaning studio.

---

**Sarah:** set me up

**Canoa:** I'll get you connected and then run one parse so you can see what I do with a product URL. Two minutes.

*[calls canoa.status → not_signed_in]*

**Canoa:** First, Google sign-in — I need this to read and write your master schedule. Opening a browser popup now.

*[calls canoa.signup → designer completes OAuth in browser]*

**Canoa:** Signed in as sarah@studiomayfly.com. Now your master schedule — do you have an existing FF&E sheet you'd like me to attach, or should I start a fresh one from the v1.2 template?

**Sarah:** fresh one

*[calls canoa.attach_sheet with create_new=true → returns sheet URL]*

**Canoa:** Done — your new sheet is here: drive.google.com/<...>. 35 columns, includes Thumbnail (col A), Dealer Net private (col AH), Embodied Carbon (col AI).

Now let me prove I can be useful. Paste one product URL you have on hand — a manufacturer page, a dealer listing, anything. I'll parse it.

**Sarah:** https://www.hay.com/us/en-us/about-a-chair-aac-22-soft-duo-upholstery

*[calls canoa.parse_product_url → returns Hay AAC 22 with full structured data]*

**Canoa:**

| | |
|---|---|
| Manufacturer | **Hay** (verified) |
| Product | About A Chair AAC 22 Soft Duo Upholstery |
| Designer | Hee Welling |
| List price | $635 |
| Lead time | 8–10 weeks |
| Frame | Black powder-coated steel |
| Shell | Polypropylene with Soft Duo upholstery |
| Image | <thumbnail> |
| Tier | verified |

Cached. Five quick questions so I can tune what I do for you — one at a time.

**Canoa:** What kind of work does the studio do? Commercial, hospitality, residential, or a mix?

**Sarah:** hospitality mostly, some commercial

**Canoa:** How many designers work on FF&E specs, including yourself?

**Sarah:** 4

**Canoa:** What eats the most time on a spec book — sourcing, dealer-quote follow-up, audits, embodied carbon, something else?

**Sarah:** sourcing and chasing dealer quotes

**Canoa:** Which 3–5 manufacturers do you spec most often?

**Sarah:** Hay, Vitra, Carl Hansen, Muuto, sometimes Audo Copenhagen

**Canoa:** Last one — do clients require embodied-carbon disclosures? None / nice-to-have / required for some / required for all.

**Sarah:** required for some

**Canoa:** Here's what I'll save:

```
## Studio profile
- Studio type: hospitality / commercial mix
- Project mix: ~70% hospitality, ~30% commercial
- Team size: 4
- Top headaches: sourcing, dealer-quote follow-up
- Preferred manufacturers: Hay, Vitra, Carl Hansen, Muuto, Audo Copenhagen
- Sustainability stance: required for some
- Check-in cadence: Monday weekly check
```

Save it?

**Sarah:** yes

*[writes to session memory]*

**Canoa:** Saved. Every Canoa command from here will know your studio.

Each Monday, say **"weekly check"** and I'll surface stale rows, price drift, and lead-time changes. Today, since you mentioned sourcing as a headache — try `/canoa-source-room` next time you're starting a new hospitality lobby or guest room. Brief me on the space and I'll search, walk configurables, and stage everything for your approval before it lands in the schedule.

---

Time elapsed: 11 minutes. Designer leaves with one cached product, a profile in memory, and a concrete next command.
