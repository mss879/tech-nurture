> **STATUS — updated 2026-08-08.** Workstreams A (content pivot), B (new
> /services page), the SEO/perf blockers and the branded 404/error pages are
> DONE on branch `launch-readiness`. Migration `018_water_services_pivot.sql`
> is written but **has NOT been run** — the live blog still shows the washing
> machine article until someone runs it in the Supabase SQL editor.
> Decisions taken (differ from the recommendations below where noted):
> **D-1** Option A, one combined home card. **D-3** slugs
> `inline-water-purifiers` / `bottle-water-dispensers`; `/services/washing-machine`
> is NOT retired — it stays live via `listed: false`, so no redirects were added.
> **D-4** union of the client's three AMC bullet lists, plus a `note` field
> carrying the exclusions. **D-5** one h1, everything else demoted.
> **D-6** preloader cut 4.0s -> 1.6s, first visit per session, reduced-motion
> aware, no longer gates the hero.
> **LATER DECISION (supersedes workstream B): there is NO /services index
> page.** The header's Services drop-down goes straight to a service, the
> same way Products already works; `/services` is a landing-pad redirect to
> the first service. The cross-cutting content from the client's services
> brief ("We Service All Major Brands", on-site vs walk-in, the walk-in
> highlight box) now renders on EVERY service page via
> `components/sections/ServiceAssurance.tsx`. Nav drop-down triggers are
> buttons, not links, so a tap opens the menu instead of navigating. Still outstanding: workstreams D, E (partial),
> F (video re-encode), G (a11y, rate limits, legal pages, notifications) and H.

---

# TechNurture — Final Implementation Plan (Launch-Readiness Release)

**Repo:** `/Users/shahidshamir/Desktop/technature/technature-web`
**Stack:** Next.js 16.2.9 (Turbopack), React 19, Tailwind v4, GSAP, Supabase
**Source of truth for content:** `lib/site.ts` (697 lines) + `lib/blog.ts` (DB-backed with `lib/site.ts` fallback)
**Client change doc (parsed):** `/private/tmp/claude-501/-Users-shahidshamir-Desktop-technature/510d2c64-c9ea-47b5-a5df-87d5e08e70a7/scratchpad/docx/changes.txt` (231 lines)
**Supporting docs:** `About TechNurture.docx`, `Annual Maintenance Contracts (AMC).docx`, `Frequently Asked Questions (FAQs).docx`, `General Suggestions.docx`, `TechNurture Web.docx`, `Website Structure.docx` — all in `/Users/shahidshamir/Desktop/technature/`

Current build state: `next build` exits 0, `tsc --noEmit` is silent. Nothing in this plan is a compile fix — everything is content, correctness, SEO, performance, a11y or operational readiness.

---

## 1. What the client asked for

### (a) Explicit red/green edits — apply exactly as marked

The change doc's legend (changes.txt:3) is `[[RED]]…[[/]]` = delete, `[[GREEN]]…[[/]]` = add, **at that instance only** — not a global find/replace.

**The business pivot.** "Washing Machine" stops being a service pillar. Two new pillars replace it: **Inline Water Purifiers** and **Bottle Water Dispensers**. Resulting line-up: Air Conditioners · Refrigerators & Freezers · Inline Water Purifiers · Bottle Water Dispensers · Maintenance & AMC.

| # | Doc line | Current | Required |
|---|---|---|---|
| 1 | changes.txt:6 | `lib/site.ts:133` hero.sub — "…air conditioners, refrigerators and washing machines — keeping homes…" | "…air conditioners, refrigerators, Inline water purifiers and bottle water dispensers — keeping homes…" |
| 2 | changes.txt:7 (Home) and :88 (About) | `lib/site.ts:153` `{ value: 500, suffix: "+", label: "Appliances serviced & repaired" }` | `{ value: 5000, suffix: "+", … }` — one edit, both pages (`components/sections/Industries.tsx:58`, `app/(site)/about/page.tsx:60`) |
| 3 | changes.txt:9 | `lib/site.ts:177` about.body — "…depend on your air conditioners, refrigerators and washing machines." | "…your air conditioners, refrigerators, Inline water purifiers and bottle water dispensers." |
| 4 | changes.txt:15-18 | `components/sections/AboutIntro.tsx:60` `{["AC Service", "Fridge Repair", "Washer Repair", "AMC Plans"].map(` | `{["AC Service", "Fridge Repair", "Water Filter Replace", "Tank Clean"].map(` (note: drops "AMC Plans") |
| 5 | changes.txt:19-25 | `lib/site.ts:212-217` home card 03 `icon: "washer"`, title "Washing Machine" | title "Inline Water purifiers and bottle water dispensers"; body "Installation, preventive maintenance, repairs, sanitization, filter replacement, and annual service contracts for water purifiers and bottle water dispensers."; points `["Tank Chlorination & Steam Sanitization","Bacterial Disinfection","Filter Replacements","Water Tests"]` |
| 6 | changes.txt:28 | `lib/site.ts:645` servicePlans.sub — "…refrigerators and washing machines performing at their best…" | "…refrigerators, Inline water purifiers and bottle water dispensers performing at their best…" |
| 7 | changes.txt:29-51 | `lib/site.ts:653/671/685` — three 5-bullet AMC plans | Three new bullet lists (see §2 D-4 for the reconciliation) |
| 8 | changes.txt:53-69 | `lib/site.ts:496-506` `process` — 5 steps | 7 steps, verbatim copy supplied; eyebrow "How We Work" and heading "A simple, transparent service journey" unchanged |
| 9 | changes.txt:73-77 | `lib/site.ts:487` "…across air conditioning, refrigeration and laundry appliances." | "…in air conditioning, refrigeration, water purification systems, and clean water dispensing equipment." |
| 10 | changes.txt:74-76 | Blog: remove the washing-machine article; add an Inline Water Purification article **and a separate** Bottle Water Dispenser article | Two new posts, one deletion |
| 11 | changes.txt:78 | `components/layout/Footer.tsx:61-63` "…air conditioners, refrigerators and washing machines — a subsidiary of {site.parent}." | "…air conditioners, refrigerators, Inline water purifiers and bottle water dispensers — a subsidiary of {site.parent}." |
| 12 | changes.txt:80-86 | Footer Services menu (derived from `serviceCatalog`) currently AC / Fridge / Washing Machine / AMC / All Services | AC / Refrigerator & Freezer / Inline water purifiers / Bottle water dispensers / Maintenance & AMC / All Services |
| 13 | changes.txt:228-229 | `lib/site.ts:599` FAQ answer "…and washing machines whenever performance drops." | Client-supplied replacement naming both water pillars at 3–6 months |

### (b) The new /services page spec (changes.txt:91-215)

The client supplied a **complete heading-by-heading page**, which the current 101-line `app/(site)/services/page.tsx` (PageHero + one 4-card grid + one CTA band) does not resemble at all. Nine sections:

1. **Professional Installation, Maintenance & Repair Services** (page title) + **Complete Solutions for Your Essential Appliances** + two intro paragraphs
2. **Our Services** — 6 capability items: Installation / Preventive Maintenance / Breakdown Repairs / Annual Maintenance Contracts (AMC) / **Equipment Relocation & Reinstallation** / **Inspection & Technical Assessment** (the last two are revenue lines the site has never mentioned)
3. **Appliances We Service** — 4 blocks with 6–7 bullets each (❄ Air Conditioners, 🧊 Refrigerators & Freezers, 💧 Inline Water Purifiers, 🚰 Bottle Water Dispensers). New service lines inside: "Relocation & Reinstallation", "Component Replacement", "Water Quality Inspection"
4. **We Service All Major Brands** — the doc's strongest objection-handler; currently invisible on /services
5. **Annual Maintenance Contracts (AMC)** — three tiers with full bullet lists
6. **Why Choose TechNurture?** — 10 bullets (site currently has a *different* 6-card `whyChoose`)
7. **How We Work** — the same 7 steps as the home page (services page has no such section today)
8. **Walk-In Service Centre** highlight box (changes.txt:207-209)
9. **Choose the Service That Suits You** — 🚐 On-Site Service vs 🏢 Walk-In Service Centre (changes.txt:213-215)

### (c) The client's three Special Notes (changes.txt:217-220)

The literal label `Special Note:` is RED-marked (it's an instruction to us, never site copy). The three items stand:

1. *"Feel free to Add or edit any info if its important and update me so i can confirm, and service page is AI generated so do what u need to do to make it humanize content for SEO."* — the supplied /services copy is a **starting point to be rewritten**, unlike the home/footer/FAQ edits which are precise find-and-replace.
2. *"Add required pictures"*
3. *"Add our service team picture and description if u think its important."*

### (d) Open questions the client asked us

- **"Product page as i request earlier."** (changes.txt:222) — references a request outside all six supplied .docx. **Unanswerable from the material at hand.** `Website Structure.docx` §13 does supply a full Products page spec (Water Purifiers / Air Conditioning Systems / Genuine Filters & Consumables / Spare Parts & Accessories), which may or may not be what they mean.
- **"[[RED]]Do we need a customer portfolio page?[[/]]"** (changes.txt:231, final line) — red = remove, so the client appears to be answering their own question "no". **Recommend confirming that reading in one line, then do not build it.** Note this does *not* cancel Client Logos (`Website Structure.docx` §9) or Testimonials (§8), which are separate live requirements.

---

## 2. Decisions that need the owner's sign-off

### D-1. One combined water card on the home page, or two? **(blocks all of Workstream A)**

The client is internally inconsistent. The **home page** spec keeps a single card still numbered `**03**`, titled "Inline Water purifiers and bottle water dispensers" (changes.txt:19-25). The **footer menu** (changes.txt:83-85) and the **/services spec** (changes.txt:132, :141) treat them as **two** separate items with distinct bullet lists. The blog instruction says "separate article for bottle water dispenser".

- **Option A:** 2 catalog entries + 2 service pages + 2 nav/footer links, **1 combined home card**. AMC stays card 04, so `components/sections/Services.tsx` keeps `slice(0, 3)` + `cards[3]` + the hard-coded `"04"` label and needs no structural refactor.
- **Option B:** 2 of everything, including 2 home cards. Requires a real refactor of `Services.tsx` (the component silently drops a 5th card and the wide AMC band would render the wrong content).

**RECOMMENDATION: Option A.** It is exactly what the client wrote, it matches the doc's own `**03**` numbering, and it avoids a component refactor with no client mandate behind it. Consequence: the combined card 03 needs an explicit destination — see D-2.

### D-2. Where does the combined home card 03 link?

`components/sections/Services.tsx:14-19` derives the href from a `slugMap` keyed on the icon (`washer: "washing-machine"`). A 1:1 icon-key→slug map cannot express "one card, two pages".

**RECOMMENDATION:** Add an explicit `href` field to each object in `services.cards` (`lib/site.ts:202-220`), delete `slugMap` entirely, and point card 03 at `/services/inline-water-purifiers`. Note `Services.tsx:103` also reads `slugMap[services.cards[3].icon]` for the wide AMC card and must be updated in the same edit.

### D-3. Slug naming + retirement of `/services/washing-machine` **(highest-risk ordering decision)**

Three slug candidates are in play across the audits: `inline-water-purifiers` / `bottle-water-dispensers` (new), or reviving `water-purification` (the pre-pivot slug deleted in commit `1bef6d4`). The string `"washing-machine"` is hard-coded in **nine** places; only `lib/site.ts:362` is the source of truth.

**RECOMMENDATION:**
- Use **`inline-water-purifiers`** and **`bottle-water-dispensers`** (plural, matching the client's own labels). Before committing, check Search Console for residual impressions/backlinks on `/services/water-purification` — if it has real equity, use that as the purifier slug instead. This must be decided **once, first**, and written into the keyword-map comment at `lib/site.ts:229-243` before any file is touched.
- **Retire the two dead URLs with 301s**, appended to the existing array in `next.config.ts:26-32`:
  ```ts
  { source: "/services/washing-machine", destination: "/services", permanent: true },
  { source: "/blog/washing-machine-not-spinning-or-draining", destination: "/blog", permanent: true },
  ```
  No pattern conflict with the `/shop` rules, so ordering is irrelevant. Rationale: both URLs are currently advertised to AI crawlers in `public/llms.txt:9` and `public/llms-full.txt:26`, and both are in the live sitemap. Google may treat a redirect-to-hub as a soft 404 — that is a non-penalty outcome and strictly better UX than a dead end. The alternative (clean 404 into the new branded not-found page) is defensible but throws away any accrued equity. **Check Search Console before launch; if either URL has real backlinks, keep the redirect.**

### D-4. AMC plan names and bullets — the client contradicts himself three ways

| Surface | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| changes.txt:29/38/45 (home) | "Comprehensive Service Contract" | "Non-Comprehensive Service Contract" — **omits** "Priority Service Support" | "On-Call Service" — **has** "No Annual Service Contract Required" |
| changes.txt:157/165/173 (services) | "Comprehensive AMC" | "Non-Comprehensive AMC" — **has** "Priority Service Support" | "On-Call Service" — **omits** "No Annual Service Contract Required" |
| `AMC.docx` | "AMC Comprehensive" | "AMC Non-Comprehensive" | "On-Call Service" |

One `name` field (`lib/site.ts:649` etc.) feeds both pages *and* the AI system prompt (`lib/ai/context.ts:21`).

**RECOMMENDATION:** Single source of truth, take the **union** of bullets (the fuller list wins in each case, since neither omission looks deliberate), and name them **"Comprehensive AMC" / "Non-Comprehensive AMC" / "On-Call Service"**. Flag to the client in one line. Also decide whether `badge: "MOST POPULAR"` stays on Non-Comprehensive — it is an unsubstantiated claim the client has never made, and their own doc presents Comprehensive first.

### D-5. The client's `<Heading1>` × 7 on /services

The doc uses `<Heading1>` seven times. Implemented literally that is seven `<h1>` tags — a Lighthouse SEO/a11y failure and a destroyed document outline. `components/layout/PageHero.tsx:31` already emits the page's only `<h1>`.

**RECOMMENDATION:** Keep **one** h1 ("Professional Installation, Maintenance & Repair Services", via PageHero), demote every `<Heading1>` to `h2` and every nested `<Heading2>`/`<Heading3>` accordingly. Also: `### <Heading2> **Add a Highlight Box**` (changes.txt:207) is a **build instruction to us, not page copy** — do not render it. Confirm the demotion with the client, since Special Note 1 asks to be consulted.

### D-6. The 4-second WebGL preloader vs the mobile PageSpeed target

`components/ui/Preloader.tsx` runs 8,000 Three.js particles with hard-coded `duration: 4.0` tweens (lines 266, 277) plus a 1.46s exit, locks `document.body.style.overflow = "hidden"` (line 42), and gates the entire hero: `components/sections/Hero.tsx:43` is `if (!isLoaded) return;` while the `<h1>` ships as `<span className="inline-block opacity-0">`. **Measured: the headline reaches opacity 1 at ~7.0s from first paint.** Good LCP is 2.5s. `TechNurture Web.docx` asks for mobile PageSpeed >85 contractually.

These two requirements are mutually exclusive.

**RECOMMENDATION:** Keep a **short** brand intro (≤800ms), gate it to first visit per session via `sessionStorage`, and — non-negotiably — **stop it gating the hero's opacity** (remove the static `opacity-0` at Hero.tsx:135/146/159/166/172/182 and set the hidden baseline from GSAP instead). If the client insists on the full 4-second sequence, the >85 mobile target must be renegotiated in writing.

### D-7. Review schema — push back

`TechNurture Web.docx` lists "Review Schema" under required Schema Markup. There is **no review data anywhere** in the repo and no `reviews` table in any of the 17 migrations. Marking up the agency-written `trustCards` (`lib/site.ts:627-640`) as customer reviews violates Google's self-serving-review policy.

**RECOMMENDATION:** Build the **mechanism** (a `reviews` table + admin screen, or a Google Reviews embed), ship `Review`/`AggregateRating` markup only once real attributable reviews exist. Same blocker gates the Testimonials section (`Website Structure.docx` §8: *"Collect genuine testimonials from existing clients"*). Say this to the client explicitly rather than silently skipping it.

### D-8. The Walk-In Service Centre is a business-model change, not copy

Three places in the new spec (How We Work step 2, the highlight box, the on-site/walk-in chooser) assume an **authorized service centre customers can drop appliances at**. The site has no such concept; `/book` has no on-site/walk-in field; `site.address` (`lib/site.ts:22`, "19A, 1st Lane, Gothami Road, Colombo 08") may or may not be that centre.

**RECOMMENDATION:** Confirm the service-centre address and hours **before** publishing any of it. This is also what the `LocalBusiness` schema should point at, and it is coupled to the real-coordinates blocker (`lib/site.ts:25` is flagged `// TODO: real coordinates (currently central Colombo)`).

### D-9. Province/city landing pages — pilot, don't matrix

`TechNurture Web.docx` calls this the highest-yield SEO tactic ("Water Purifier Colombo / Kandy / Galle"). `districts` (`lib/site.ts:94-120`, all 25) already exists.

**RECOMMENDATION:** Do **not** generate 5 services × 25 districts = 125 templated pages — that is a textbook doorway-page pattern. Ship **3 pilot districts** (Colombo, Gampaha, Kandy) × the 5 services with genuinely district-specific copy (250+ words each), measure, then extend. Only one `LocalBusiness` entity may exist (single physical address) — per-district pages use `Service` with `areaServed: AdministrativeArea` and `provider: { "@id": ".../#localbusiness" }`. **Phase 2.**

### D-10. Marketing automation — split Phase 1 / Phase 2

`TechNurture Web.docx` "Marketing Automation / **Missing completely**" asks for welcome/registration/birthday/order-confirmation/service-reminder emails plus SMS.

**RECOMMENDATION:** Phase 1 = **owner notification on every enquiry/booking/order** (currently nothing notifies anybody — see A-7/G-4) and **customer order/booking acknowledgement**. Everything else (birthday offers, review requests, SMS/OTP) = Phase 2. Note this is *not* greenfield: `app/api/chat/route.ts:98-133` already POSTs to `https://api.resend.com/emails` and `.env.example:34-41` already documents `RESEND_API_KEY` / `OWNER_NOTIFICATION_EMAIL` / `RESEND_FROM`.

---

## 3. Workstreams

> **W0 — Slug freeze (do this before touching any file).** Decide D-1, D-2, D-3, D-4, D-5 and record the two slugs in the keyword-map comment at `lib/site.ts:229-243`. Several steps below are silent no-ops or hard build failures out of order.

---

### A. Content pivot — washing machine → inline water purifiers + bottle water dispensers

**Effort: L (~2–3 days).** Blocks B, C, E. Depends on W0.

#### A-0. Mandatory ordering (violating this = build failure or live 404)

1. Decide the two slugs (W0).
2. **Add** the two `serviceCatalog` entries *while the washing-machine entry is still present*, so all `related` arrays stay resolvable.
3. Repoint `related` arrays and give the new entries their own.
4. Add the new icon keys to **all three** iconMaps + fix `Services.tsx` slugMap/href.
5. **Only now** delete `lib/site.ts:361-418`.
6. Add the `next.config.ts` redirects **in the same commit** as the deletion.
7. Update nav, blog category map, `llms.txt`, `llms-full.txt`.

Doing (5) before (4) is a TypeScript build failure. Doing (5) before (6) ships a live 404.

#### A-1. `lib/site.ts` — the two new `serviceCatalog` entries

Each entry must carry **all 14 fields** the air-conditioning entry has (`lib/site.ts:246-302`): `slug, icon, title, h1, tagline, summary, metaTitle, metaDescription, keywords[], image, intro{heading, body[], highlights[]}, offerings[{title,body}], steps[{n,title,body}], related[]`. `app/(site)/services/[slug]/page.tsx` dereferences every one unguarded — `:61 service.h1 ?? service.title`, `:77 service.intro.heading`, `:81 service.intro.body.map`, `:88 service.intro.highlights.map`, `:102 service.image`, `:128 service.offerings.map`, `:155 service.steps.map`. **A partial entry fails `next build`; it does not degrade.**

Content sources:
- `offerings` ← changes.txt:134-139 (purifiers) and :143-147 (dispensers)
- `intro.highlights` ← changes.txt:21-24
- `steps` — **no client source**; write 4 steps per service (the client's 7-step journey at changes.txt:56-69 is the global `process` export, a different shape)
- `image` — `public/services/water-purification.png` already exists on disk (survivor of `1bef6d4`) and is reusable for the purifier. **No asset exists for bottle water dispensers — hard blocker on entry 2** (see §5).

Consider adding `type Service` in `lib/site.ts` so the next omission is caught at the definition site.

Delete `lib/site.ts:361-418` (line 361 `{`, 362 `slug: "washing-machine",`, 418 `},`).

#### A-2. `lib/site.ts` — the five `related` arrays

Post-pivot there are 5 services; grid is `sm:grid-cols-2`, so 4 tiles as 2×2:

| Entry | Current | Required |
|---|---|---|
| `:301` air-conditioning | `["refrigerator", "washing-machine", "maintenance-amc"]` | `["refrigerator","inline-water-purifiers","bottle-water-dispensers","maintenance-amc"]` |
| `:359` refrigerator | `["air-conditioning", "washing-machine", "maintenance-amc"]` | `["air-conditioning","inline-water-purifiers","bottle-water-dispensers","maintenance-amc"]` |
| `:417` washing-machine | `["air-conditioning", "refrigerator", "maintenance-amc"]` | *(removed with the entry)* |
| `:475` maintenance-amc | `["air-conditioning", "refrigerator", "washing-machine"]` | `["air-conditioning","refrigerator","inline-water-purifiers","bottle-water-dispensers"]` |
| *(new)* purifiers | — | `["air-conditioning","refrigerator","bottle-water-dispensers","maintenance-amc"]` |
| *(new)* dispensers | — | `["air-conditioning","refrigerator","inline-water-purifiers","maintenance-amc"]` |

`getService()` (`lib/site.ts:479-481`) returns `undefined` for a dead slug — a silent tile drop, not an error.

#### A-3. Icon plumbing — three maps + one slug map

`droplets` and `glass-water` both ship in the installed lucide-react (verified in `node_modules/lucide-react/dist/esm/icons/`).

- `app/(site)/services/page.tsx:3` — drop `WashingMachine` from the import; `:15-20` drop `washer: WashingMachine`, add `purifier: Droplets, dispenser: GlassWater`; `:34` change `lg:grid-cols-4` → `lg:grid-cols-3` (3+2) or `xl:grid-cols-5` so the 5th card isn't orphaned
- `app/(site)/services/[slug]/page.tsx:5` and `:10-15` — identical change
- `components/sections/Services.tsx:2` and `:6-11` — identical change; **also** delete `slugMap` (`:14-19`) per D-2 and fix `:58` (`const slug = slugMap[card.icon] ?? ""`) and `:103` (`href={\`/services/${slugMap[services.cards[3].icon] ?? ""}\`}`)
- `lib/site.ts:213` `icon: "washer"` → the new water icon key

**Extract one shared icon module** so the three maps cannot drift again. Silent failure mode today: `iconMap[s.icon] ?? Wrench` means both new services would render the same wrench glyph as the AMC card with no build error.

#### A-4. `lib/site.ts` — copy edits (each individually client-marked)

| Line | Current | Required |
|---|---|---|
| `:3-4` | `Home-appliance service business: Air Conditioning, Refrigerator\n   & Freezer, Washing Machine, and Maintenance & AMC.` | `…Refrigerator & Freezer, Inline Water Purifiers, Bottle Water Dispensers, and Maintenance & AMC.` |
| `:38-40` (nav children) | `{ label: "Washing Machine", href: "/services/washing-machine" },` | Two entries: `{ label: "Inline Water Purifiers", href: "/services/inline-water-purifiers" }`, `{ label: "Bottle Water Dispensers", href: "/services/bottle-water-dispensers" }` |
| `:80` | `"Washing Machine — Repair",` | `"Inline Water Purifier — Service / Filter Replacement",` + `"Bottle Water Dispenser — Service / Repair",` |
| `:133` | hero.sub | see §1(a) row 1 |
| `:153` | `value: 500` | `value: 5000` |
| `:177` | about.body | see §1(a) row 3 |
| `:212-217` | home card 03 | see §1(a) row 5 + explicit `href` |
| `:238` | `· /services/washing-machine  → "washing machine repair Sri Lanka"` | Two lines for the new slugs — see E-5 |
| `:425-426, :428-429, :441` | maintenance-amc summary/metaDescription/intro.body — "air conditioners, refrigerators and washing machines" | "air conditioners, refrigerators, inline water purifiers and bottle water dispensers" |
| `:487` | whyChoose "Experienced Technical Team" | see §1(a) row 9 |
| `:499-506` | 5-step `process` | 7 steps verbatim (changes.txt:56-69). `components/sections/Process.tsx` is length-agnostic (`:14 process.steps.length`, `:74 process.steps.map`) — **no component change** |
| `:599` | FAQ servicing frequency | Client text, grammar tidied: `"As a guide: air conditioners every 3–6 months, refrigerators once a year, inline water purifiers depending on the water source and consumption — generally every 3–6 months — and bottle water dispensers every 3–6 months. Regular maintenance keeps appliances efficient and prevents breakdowns."` |
| `:603` | FAQ brands — "…freezers and washing machines…" | "…freezers, inline water purifiers and bottle water dispensers…" |
| `:645` | servicePlans.sub | see §1(a) row 6 |
| `:653/671/685` | AMC `points` | Per D-4 |

`lib/site.ts:599` and `:603` propagate automatically to the FAQ accordion (`app/(site)/contact/page.tsx:128`), the `FAQPage` JSON-LD (`:150`) and the AI prompt (`lib/ai/context.ts:24`).

#### A-5. Components with hard-coded appliance names

- `components/layout/Footer.tsx:61-63` — the tagline paragraph (the Services list at `:87` is derived from `serviceCatalog` and self-heals; **order matters**)
- `components/sections/AboutIntro.tsx:60` — the chip array
- `components/sections/Statement.tsx:13-22` — `text="…air conditioning, refrigeration and laundry appliance repairs…"` → "…and water purification repairs…". **`laundry` is the only washing-machine word a plain grep misses.** Also fix the highlight array: per `WordReveal.tsx:54-55` (`w.replace(/[.,]/g,"").toLowerCase()`), the tokens `"conditioning,"` and `"confidence"` currently match **nothing** — write `"conditioning"` (no comma), drop the dead `"confidence"`, replace `"laundry"` with `"water"`/`"purification"`
- `components/shop/ContactForm.tsx:7-14` — an independent hard-coded `serviceOptions` array that has **already drifted** from `bookingServices` (it lacks "Air Conditioning — Gas Charging"). Replace `:11 "Washing Machine — Repair",` and either import `bookingServices` from `@/lib/site` (accepting the Gas Charging addition) or fix in place. `provinces` (`:16-26`, duplicated at `CheckoutClient.tsx:19-29`) has **no** `lib/site.ts` export — `districts` is a different taxonomy; a `provinces` export must be added first if deduping.

#### A-6. AI agent — the three hard-coded strings that do **not** self-heal

`lib/ai/context.ts` regenerates `servicesBlock`/`faqBlock`/booking enum from `lib/site.ts`. These three do not:

- `:31` `- We service ALL major brands of air conditioners, refrigerators/freezers and washing machines — regardless of who installed them.`
- `:71` `Start by greeting the customer warmly and asking how you can help with their air conditioner, refrigerator or washing machine.\`;`
- `:73-74` `export const GREETING = "Hi! 👋 I'm the TechNurture assistant. I can help with your air conditioner, refrigerator or washing machine — …"`

Plus an **independent duplicate** at `components/ai/ChatWidget.tsx:21-22`. Best fix: delete the local constant and `import { GREETING } from "@/lib/ai/context";` (safe — no server-only code in that module).

**Also (missed by every audit):** `lib/ai/context.ts:20-22` `amcBlock` passes only `p.name` + `p.priceLabel` — the plan `points` are **never** given to the model. Extend it to include the bullets and (once D-4 / D-11 land) the exclusions, and add the walk-in/on-site channel to the behaviour block. Otherwise the live agent will quote AMC coverage it has never seen and will only ever offer an on-site visit.

#### A-7. Booking / enquiry data

`lib/site.ts:80` and `components/shop/ContactForm.tsx:11` (above). No migration needed: no `CHECK` constraint on `bookings.service` (`supabase/migrations/005_bookings.sql:22` constrains `status` only) or `enquiries.service`. **Decide** whether to backfill existing rows storing "Washing Machine — Repair" — harmless, but the admin board will show a value absent from the dropdown.

#### A-8. Static machine-readable files (hand-maintained, nothing generates them)

- `public/llms.txt:3` (summary sentence), `:9` (the whole `- [Washing Machine](…/services/washing-machine)` line → two new entries)
- `public/llms-full.txt:3`, `:26-33` (delete the whole `## Washing Machine` section + 4 bullets), `:37`, `:46` (adopt the client's new FAQ answer, grammar-tidied), `:47`

**Strongly consider generating both from `lib/site.ts` at build time**, as `app/sitemap.ts` does — otherwise they will go stale again on the next content change.

#### A-9. Orphaned assets

Delete `public/services/washing-machine.png` (189,368 B, referenced only at `lib/site.ts:379`) and `public/blog/washing-machine-repair.png` (886,209 B, referenced at `lib/site.ts:551` and `011_seed_blog.sql:71`). Adopt `public/services/water-purification.png` and `public/blog/water-purifier-service.png` (both already on disk, zero references). Also delete `public/.DS_Store` (8,196 B — **currently a live public URL leaking a directory listing**) and the create-next-app default SVGs (`next.svg`, `globe.svg`, `file.svg`, `window.svg`, `vercel.svg`). `public/brand/` is 3.47 MB of unreferenced masters including `guidelines.png` — an internal document served publicly; move to design storage.

---

### B. New /services page (full client spec, humanized for SEO)

**Effort: L (~3–4 days).** Depends on A (icon maps, catalog entries), D-5.

**File:** `app/(site)/services/page.tsx` (currently 101 lines: PageHero `:25-30`, one `serviceCatalog.map` grid `:32-77`, one CTA band `:79-98`).

Build the nine sections from §1(b). Concrete requirements:

- **Heading semantics per D-5:** one h1 via PageHero, everything else h2/h3/h4.
- **Metadata:** `:10-11` currently reads *"…air conditioning, refrigerator and washing machine repair, plus annual maintenance contracts…"* — rewrite for the new pillars.
- **Appliance blocks:** `:58` caps bullets at `s.intro.highlights.slice(0, 4)`; the client's lists are 6–7 bullets. **Lift the cap.**
- **Grid:** `:34` `lg:grid-cols-4` breaks with 5 services (see A-3).
- **"We Service All Major Brands"** (changes.txt:149-151) — insert between the card grid (`</section>` at `:77`) and the CTA (`{/* CTA */}` at `:79`). Body: *"No matter where your appliance was purchased or who installed it, our experienced technicians are equipped to service **all leading brands**."* + emphasised *"Your equipment doesn't have to be our product to receive our professional support."*
- **AMC three-tier section** — reuse the `servicePlans` data (`lib/site.ts:642-693`) rendered by `components/sections/ServicePlans.tsx`, currently used only on the homepage (`app/(site)/page.tsx:33`), respecting the D-4 reconciliation.
- **"Why Choose TechNurture?"** 10 bullets — a **new block**, distinct from the 6-card home `whyChoose` (`lib/site.ts:483-494`). Two items have no existing copy anywhere: "24/7 Emergency Assistance" and "Digital Service & Breakdown History".
- **"How We Work"** — render `components/sections/Process.tsx` on /services too (it is currently imported only by `app/(site)/page.tsx:7`).
- **Walk-In highlight box + "Choose the Service That Suits You"** — one section: h2 "Choose the Service That Suits You" with h3 "On-Site Service" / h3 "Walk-In Service Centre". Do **not** render the literal "Add a Highlight Box" label.
- **Humanize (Special Note 1):** the supplied copy is self-declared AI boilerplate — e.g. changes.txt:97 *"…maximize performance, improve efficiency, and extend equipment life."* Near-identical phrasing has already leaked into `lib/site.ts:441` (*"Preventive maintenance is the key to maximizing performance, reducing downtime and extending the life of your appliances."*). Rewrite both.
- **Images (Special Notes 2 & 3):** the page currently renders **zero** images — only lucide icons. Add section imagery + optional team photo. See §5.
- **JSON-LD:** /services has priority 0.9 in the sitemap and emits **no page-level structured data at all**. Add `BreadcrumbList` (Home → Services) and an `ItemList` mapping `serviceCatalog` — mirror the pattern at `app/(site)/services/[slug]/page.tsx:238-303`. Map over `serviceCatalog`; never hard-code a count.

---

### C. Blog — delete one article, add two, keep three surfaces in sync

**Effort: L (~2 days, mostly writing).** Depends on A (slugs, categories).

**The blog has THREE independent sources, not two.** All three must agree:

1. **`lib/site.ts` `posts`** (fallback + build-time consistency) — delete `:543-558` (slug `washing-machine-not-spinning-or-draining`, category `"Washing Machine"`, image `/blog/washing-machine-repair.png`); add two posts.
2. **Supabase (live)** — `supabase/migrations/011_seed_blog.sql` ends `on conflict (slug) do nothing;` (line 124), so **editing 011 is a no-op against an already-seeded project**. Write a **new forward migration `018_pivot_water_services.sql`** (017 is taken by `017_products.sql`) that:
   - `delete from public.blog_posts where slug = 'washing-machine-not-spinning-or-draining';`
   - inserts the two new posts
   - `update`s the AMC article body (`011:84` — *"…automatic for your air conditioners, refrigerators and washing machines."*)
   - `update`s the "7 Habits" article (`011:105`, `:106`, `:108`, `:110`, `:119`) — swap the washing-machine drain-filter example for a purifier filter-cartridge tip, the drum-overloading tip for a dispenser sanitization tip, and the excerpt to *"…keep your AC, fridge and water systems running longer…"*
   - Mirror every one of those `update`s in `lib/site.ts:569, 580, 586-588`
3. **`components/sections/BlogPreview.tsx`** — **no audit caught this.** `:5 import { posts } from "@/lib/site";` and `:18 const list = posts.slice(0, 3);`. This is the homepage "Latest insights" section (`app/(site)/page.tsx:37`) and it is the **only** blog surface not going through `lib/blog.ts`. Two consequences: (a) the homepage keeps advertising the washing-machine article regardless of the migration; (b) **pre-existing bug** — `lib/blog.ts:110-116` returns `null` (404) for any static slug once the DB has ≥1 published post, so the moment the client publishes anything via `/admin/blog` the three homepage cards link to 404s. **Fix:** make `BlogPreview` an `async` server component awaiting `getPublishedPosts()` (it has no `"use client"` and no hooks; only its `<Reveal>` child is client-side).

Also:
- `app/(site)/blog/[slug]/page.tsx:15-20` `categoryToService` — drop `"Washing Machine": "washing-machine"`, add one key per new pillar. **Key strings must exactly match the `category` written in both `lib/site.ts` and migration 018**; values must match the new `serviceCatalog` slugs. Categories are free text in the DB (`007_blog.sql:18`) and free text in the admin editor (`components/admin/BlogView.tsx:373-378`) — nothing enforces the match. A mismatch silently kills the article's keyword-anchored internal link **and** its CTA (`:128-139`, `:157-164`).
- `app/(site)/blog/page.tsx:15` metadata — *"…air conditioning, refrigerator and washing machine repair…"* → new pillars.
- `supabase/README.md` — the migration table **stops at 016**; `017_products.sql` is missing and the pivot migration must be added, or the client will never run it and every blog change silently fails in production. Also correct the 011 description (it will seed 6 posts, not 5) and warn that 011 is `on conflict do nothing`.

---

### D. Content additions from the supporting docs

**Effort: M–L (~3 days).** Depends on B for placement.

| ID | Item | Source | Where |
|---|---|---|---|
| D-a | **AMC comparison table** (8 rows × 3 plans + footnote) | `AMC.docx` "Additional High-Converting Feature" — *"usually increases AMC inquiries and conversions"* | `/services/maintenance-amc`. Columns: Feature / Comprehensive AMC / Non-Comprehensive AMC / On-Call Service. Rows: Scheduled Preventive Maintenance · Labour Charges Included · Spare Parts Included (✓*/✗/✗) · Breakdown Support · Priority Response · Fixed Annual Cost · Inspection Charges · Best For. Footnote: *"*Excluding major components such as compressors, condensers, pressure pumps, and other specified exclusions."* Wrap in `overflow-x-auto`. |
| D-b | **AMC exclusions** | `AMC.docx` "Exclusions" | **Zero occurrences** of "exclusion"/"excluding"/"pressure pump"/"consumable" exist anywhere in the codebase. Comprehensive: compressors, condensers, pressure pumps, anything else excluded in the agreement. Non-Comprehensive: spare parts, consumables, major component replacements. **Undisclosed exclusions on a contract product are a dispute risk.** |
| D-c | **On-Call inspection policy** | `AMC.docx` "Inspection Requirement" | `lib/site.ts:688` compresses it to `"Inspection fee deductible"`. Publish in full: *"For reported breakdowns, an inspection may be required before repairs are carried out. The inspection charge will be communicated in advance and can be deducted from the final repair invoice if repair work proceeds through TechNurture."* |
| D-d | **"Why Choose an AMC?" 7 benefits** | `AMC.docx` | `lib/site.ts:444` has 4 highlights; add the 7 (incl. "Maintain water quality and cooling performance", newly relevant post-pivot) |
| D-e | **FAQ expansion** | `FAQs.docx` supplies 20; site has 7 | 5 water FAQs are genuinely missing (docx #1 purifier types RO/UV/UF, #2 servicing interval, #3 signs it needs servicing, #4 filter replacements, #8 water quality testing), plus AC #11/#13 and General #16/#20. **Use 3–6 months** (changes.txt:229), not the docx's "4 to 6 months" — the change doc is newer. Every entry lands in the `FAQPage` JSON-LD automatically via `contact/page.tsx:150`. |
| D-f | **Homepage trust statement** | `General Suggestions.docx` "Homepage Trust Statement" | `lib/site.ts:26-27` `trustLine` already holds the exact copy but renders **only** on /about (`app/(site)/about/page.tsx:27`). Surface it on the homepage. |
| D-g | **"Single Most Powerful Statement"** | `Website Structure.docx` | Rewrite `components/sections/Statement.tsx` around the Lusako-subsidiary + banks/hospitals framing, adapted to four pillars (the docx names only two — flag as an editorial adaptation). Doc says *"Place this near the top of the homepage"* — move Statement to ~position 2-3 in `app/(site)/page.tsx`; it need not displace the Hero. |
| D-h | **"By the Numbers" / Customer Confidence / trust cards on home** | `General Suggestions.docx`, `Website Structure.docx` §2 | `stats` renders only on /about — put the band on `/` too. `trustCards` (`lib/site.ts:627-640`) renders only at `about/page.tsx:129` — surface on home and/or /services. Note the client's "Long-Term Support" body opens *"Professional installation is just the beginning"* vs the site's *"A one-time repair is just the beginning"* — restore the installation framing now that installation is a headline service. |
| D-i | **Guarantee + Commitment statements** | `Website Structure.docx` | Guarantee: *"Every project is backed by professional workmanship, quality materials, and dedicated after-sales support."* Commitment: *"We don't just install and maintain equipment—we build long-term relationships…"* — `Statement.tsx:9` already says eyebrow "Our Commitment" but carries different copy. |
| D-j | **Emergency banner** | `Website Structure.docx` | `components/layout/Footer.tsx:16` already has the client's exact wording (*"Need urgent technical assistance?"*) but buried in the footer. Elevate to a real banner with a `tel:` link, consistent with the new "24/7 Emergency Assistance" claim. |
| D-k | **Google Map on /contact** | `Website Structure.docx` §12 — the **only** unimplemented item on its six-item "Must include" list | `app/(site)/contact/page.tsx:89-99` has a lucide `MapPin` and `{site.address}` and nothing else. Repo-wide grep for `iframe`/`maps.google` returns **zero**. Add a lazy-loaded embed; the pin **must agree with** the `LocalBusiness` `geo` node (see G-2). |
| D-l | **Lead-gen: three distinct forms + hero CTAs** | `Website Structure.docx` §1 + "Lead Generation Features" | Today one `<ContactForm />` serves every intent. Header `Book Inspection` (`Header.tsx:126`, `:185`), Footer `Book a Site Inspection` (`:27`) and `services/[slug]/page.tsx:220` all point at `/contact`. Doc wants: Request a Quotation (exists) / Book a Site Inspection / Request a Maintenance Visit, and hero CTAs *"Request a Free Site Inspection" / "Get a Quotation" / "Call Now"* replacing `lib/site.ts:134-135` (`"Explore Services"` / `"Contact Us"`). |
| D-m | **Testimonials + Client Logos** | `Website Structure.docx` §8, §9 | **Blocked on client assets.** Build the mechanism (a `testimonials` export or Supabase table + a logo grid), never ship the docx example quote as a real customer. See D-7 and §5. |
| D-n | **Products page spec** | changes.txt:222 + `Website Structure.docx` §13 | **Ask the client what "as i request earlier" means** — it is the one line in the change doc unanswerable from the supplied material. If §13 is in scope, note "Genuine Filters & Consumables" and "Spare Parts & Accessories" overlap the new purifier service page and must be intent-separated (see E-5). Answer it explicitly either way. |

---

### E. SEO

**Effort: M (~2 days).** Depends on A (slugs) and B.

#### E-1. Metadata — 15 stale strings

`app/layout.tsx`:
- `:24` `title.default: "TechNurture — AC, Refrigerator & Washing Machine Repair in Sri Lanka"` → `"TechNurture — AC, Fridge & Water Purifier Repair in Sri Lanka"` (61 chars)
- `:28` description → swap the pillar list only, keep the "fast, reliable" wording
- `:33` keywords: `"washing machine repair Sri Lanka"` → `"inline water purifier service Sri Lanka"` + `"water dispenser repair Sri Lanka"`
- `:47` `openGraph.description`, `:61` `twitter.description`, `:125` Organization JSON-LD description
- **Leave `:45`, `:53`, `:59` alone** — already pillar-neutral ("Appliance Repair & Maintenance")

Route metadata: `app/(site)/page.tsx:15`, `:21`, `:50`; `about/page.tsx:12`; `services/page.tsx:11`; `blog/page.tsx:15`; `book/page.tsx:11`; `contact/page.tsx:11`; `app/manifest.ts:9`. Note `page.tsx:19` `openGraph.title` and `:92` `hasOfferCatalog` need **no** change (the latter self-heals from `serviceCatalog`).

`app/opengraph-image.png` (1200×630) — subtitle text reads *"AC · Refrigerator · Washing Machine — across Sri Lanka"*. **Confirmed by inspection: must be regenerated.**

#### E-2. Sitemap — three fixes, one commit

`app/sitemap.ts`:
```ts
// line 2
import { serviceCatalog, site } from "@/lib/site";
import { getPublishedPosts } from "@/lib/blog";
// line 26
const blog = (await getPublishedPosts()).map((p) => ({ … }));
```
`sitemap()` is already `async` (it awaits `getProducts()` at `:34`), and `getPublishedPosts()` falls back to the same static array when Supabase is unconfigured — behaviour is unchanged on a fresh install.

**Add `export const revalidate = 3600;`** — the file declares no revalidation (unlike `app/(site)/layout.tsx:12`, `blog/page.tsx:10`, `blog/[slug]/page.tsx:11`, `products/page.tsx:5`, all `= 60`). Without it the swap above is **cosmetic**: sitemap.xml renders once at build and never again, so CMS-authored posts and admin-added products stay invisible until the next deploy.

**Add `/book`** to `routes` (`:7-13`) **and extend the priority ternary**, or it silently lands at 0.7:
```ts
priority: path === "" ? 1 : path === "/services" || path === "/book" ? 0.9 : 0.7,
```
Also add `{ label: "Book a Service", href: "/book" }` to `nav` (`lib/site.ts:30-49`) — verified: `grep href="/book"` over the built homepage returns **zero** matches; the only internal link in the whole codebase is `app/(site)/blog/[slug]/page.tsx:152`.

Consider `lastModified`: every static route reports `new Date()`, i.e. build time. Define one `CONTENT_UPDATED` constant and use the product row's `updated_at` for products; drop `changeFrequency` (Google has ignored it since 2023).

#### E-3. Missing route files

- **`app/not-found.tsx`** (root, per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md:131`). It renders under `app/layout.tsx`, **not** `app/(site)/layout.tsx`, so it must explicitly import `Header`, `Footer` and `PageHero`. Today the built `_not-found.html` has **two `<title>` tags** and both an `<h1>404</h1>` and an `<h2>`, with zero nav. Do **not** add `robots: { index: false }` — metadata export is documented for `global-not-found.js` only, and Next auto-injects noindex on 404-status pages.
- **`app/(site)/error.tsx`** + **`app/global-error.tsx`** (both `"use client"`, with `reset()`), branded, with phone/WhatsApp fallback.

#### E-4. Structured data

- `app/(site)/page.tsx:87-88` — `sameAs: []` with a stale TODO, while `lib/site.ts:54-67` already holds real TikTok/Facebook/Instagram URLs and `app/layout.tsx:134` already does `sameAs: social.map((s) => s.href)`. **Free win:** add `social` to the import at `:11` and use it.
- `app/(site)/page.tsx:57-63` — `PostalAddress` omits `streetAddress` though `lib/site.ts:22` holds it. Add `streetAddress: "19A, 1st Lane, Gothami Road"`, `addressLocality: "Colombo 08"`. **Do not invent a `postalCode`** — confirm with the client first.
- `app/(site)/services/[slug]/page.tsx:248` — `provider` mints a fresh anonymous `LocalBusiness` per service page. Replace with `provider: { "@id": \`https://${site.domain}/#localbusiness\` }` (the homepage node already declares that `@id` at `page.tsx:46`). Same for the Article `publisher` at `blog/[slug]/page.tsx:231` → `/#organization`.
- `app/(site)/blog/[slug]/page.tsx:230` — add `dateModified` (requires surfacing `updated_at` through `lib/blog.ts` `BlogRow`/`toView`), and `mainEntityOfPage` as a `WebPage` object.
- `app/(site)/(cart)/products/[slug]/page.tsx:224` — add `priceValidUntil` to each `Offer` and wrap in `AggregateOffer` (multiple priced variants, one URL, currently reads as duplicate offers).
- `generateMetadata` not-found stubs: `services/[slug]/page.tsx:28`, `blog/[slug]/page.tsx:34`, `products/[slug]/page.tsx:25` (`return {}` — inherits the homepage title/description/OG on a 404). Return `robots: { index: false, follow: true }` in all three.
- **FAQ schema scope:** `FAQPage` is emitted only on `/contact`. Add per-service `faqs?: {q,a}[]` to `serviceCatalog` and emit a scoped `FAQPage` next to the existing `Service` JSON-LD on `/services/[slug]` (only for questions actually rendered).

#### E-5. Keyword map — the cannibalization guard

`lib/site.ts:229-243` is the anti-cannibalization contract for the whole site. Replace the washing-machine line with:
```
· /services/inline-water-purifiers  → "inline water purifier installation & filter replacement Sri Lanka" (SERVICE intent)
· /services/bottle-water-dispensers → "water dispenser repair & sanitization Sri Lanka" (SERVICE intent)
· /products/[slug]                  → "Lusako inline water purifier price Sri Lanka" (TRANSACTIONAL intent)
```
plus the rule: **service pages never contain "price"/"buy"; product pages never contain "repair"/"service".**

**The comment alone cannot enforce it.** `app/(site)/(cart)/products/[slug]/page.tsx:36-42` hard-codes `"water purifier Sri Lanka"` and `"Lusako inline water purifier price"` for **every** product row, whatever its category — while `lib/products.ts:22-40` shows `Product` already carries `category`/`categorySlug`. Derive the category term from the product instead. This gets worse with every product the client adds.

#### E-6. Heading skip on blog articles

`app/(site)/blog/[slug]/page.tsx` — `:92 <h1>{post.title}</h1>`, then `:143 <h3>Need help with your system?</h3>` with no intervening h2 (the body maps to `<Reveal as="p">` only), then `:184 <h2>Keep reading</h2>`. Change `:143`/`:145` from `h3` to `h2`.

#### E-7. Alt text quality

`app/(site)/services/[slug]/page.tsx:103` uses `alt={service.title}` — duplicates the adjacent heading, worthless for image search. Add an `imageAlt` field per catalog entry. (Alt **coverage** is complete site-wide; only `ProductGallery.tsx:42`'s `alt=""` is intentional and correct, since the wrapping button has `aria-label` at `:33`.)

---

### F. Performance

**Effort: M–L (~3 days).** Independent of A–E; can run in parallel. **The contractual targets (mobile >85, desktop >90) are unreachable without F-1 through F-4.**

All numbers below were **measured** against a real production build served with `next start`, driven at a 375×812 viewport reading the Resource Timing API.

#### F-1. The 8.26 MB video downloaded on mobile — **blocker, trivial fix**

`components/ui/Preloader.tsx:44-48`:
```js
// Preload video in the background
const videoReq = new XMLHttpRequest();
videoReq.open("GET", "/hero-particles.mp4", true);
videoReq.responseType = "blob";
videoReq.send();
```
`Hero.tsx:94` gates the `<video>` behind `isDesktop`, so phones render only a CSS poster — but this XHR has no gate. **Measured mobile homepage: `totalTransfer: 8,262,324` bytes, of which `hero-particles.mp4` is `8,261,413`, starting at t=83ms (before the LCP image).** The blob is never read.

**Delete lines 44-48.** The `<video>` self-loads with `preload="metadata"`.

#### F-2. Preloader gates LCP for ~5.6s and deadlocks in background tabs — **blocker**

- `components/ui/Preloader.tsx:266` `value: 2.0`, `:267 duration: 4.0` + a 1.46s exit ⇒ `preloaderComplete` fires at ~5.46s; the hero headline reaches opacity 1 at ~7.0s. Chrome excludes `opacity:0` elements from LCP.
- **Reproduced deadlock:** loaded in a tab with `document.visibilityState === "hidden"`, at t=42,403ms the state was still `{preloaderInDom:true, overflow:"hidden", h1op:"0", done:false}`. Chrome pauses `requestAnimationFrame` in hidden tabs, so the exit `onComplete` (`:235-238`) never runs, `document.body.style.overflow = "hidden"` (`:42`) is never released, and the user gets a **permanent black screen with scroll locked**. Fires on cmd-click, open-in-new-tab, session restore, link prerender, and every headless audit. This is a correctness bug independent of performance.

**Fixes:** (a) add a `visibilitychange` listener + a `setTimeout` ceiling that force-completes idempotently; (b) restore `overflow` in the effect cleanup and move the cleanup `return` out of the `if (canvasContainerRef.current)` block at `:60`; (c) gate to first visit per session; (d) cap the sequence per D-6; (e) remove the static `opacity-0` from `Hero.tsx:135, 146, 159, 166, 172, 182` and set the hidden baseline via `gsap.set(..., { autoAlpha: 0 })` inside the existing `useGSAP` scope; (f) add a `prefers-reduced-motion` early return (`SmoothScroll.tsx:24` and `LiquidBackground.tsx:23` already do this — the most motion-heavy element on the site does not).

#### F-3. three.js ships to every public route — **blocker**

`app/(site)/layout.tsx:4 import Preloader from "@/components/ui/Preloader";` (static). **Measured:** chunk `0511brl5b6vek.js` = 559,988 B raw / **139,935 B gzip**, fingerprinted as three.js + ogl + lenis, referenced by `/`, `/about`, `/contact`, `/blog`, `/services`, `/book` **and `/checkout`**.

**Fix:** a thin `"use client"` `components/ui/PreloaderGate.tsx` doing `dynamic(() => import("./Preloader"), { ssr: false })`, rendered only when `usePathname() === "/"`. **The wrapper must still fire `preloaderComplete` when it renders nothing**, or the hero entrance never starts.

#### F-4. Total bundle ~4× budget

**Measured per route (excluding the `noModule` legacy chunk):** `/` = 1,487,456 raw / 407,981 gz; `/about` = 1,522,605 / 418,302; `/contact` = 1,527,574 / 420,159; `/blog` = `/services` = 1,522,065 / 418,173; `/checkout` = 1,488,441 / 408,609. **Zero `next/dynamic` usage anywhere in the repo.**

- `components/ai/ChatWidget.tsx:4-5` drags `react-markdown` + `remark-gfm` (**141,994 B / 42,365 B gz**) into first load on every route, for a component whose markdown only renders after an assistant reply (`:293-296`). Split into a launcher (stays static) + `ChatPanel.tsx` (`dynamic(..., { ssr: false })`). The `dynamic()` call must live in the **client** launcher — `ssr: false` is not allowed in Server Components (`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md:94-95`).
- `components/webgl/LiquidBackground.tsx` (ogl, **50,635 / 15,156 gz**) is imported by `components/layout/PageHero.tsx:2` and bails out at runtime on mobile (`:29-39`) after being downloaded and parsed. Lazy-load behind the same low-power check; render the brand gradient as plain CSS by default.
- `components/sections/Industries.tsx:1` and `components/sections/ServicePlans.tsx:1` carry `"use client"` with no hooks, handlers or browser APIs — delete the directive (I audited all 43 `"use client"` files; these are the only false positives).

#### F-5. Caching and images

- **`next.config.ts` `headers()`** covers only `/hero-particles.mp4`. **Measured:** `/hero-poster.jpg` → `Cache-Control: public, max-age=0` (55,078 B); `/tech-nature-side.png` → `max-age=0` (460,833 B); `/arclogo.webp` → `max-age=0`. `/_next/static/*` is **already correct** (`max-age=31536000, immutable`) — no change needed there. Add a rule for public assets; Next 16 requires regex wrapped in parentheses after a parameter. **Caveat:** `public/` files are not content-hashed, so prefer `max-age=86400, stale-while-revalidate=604800` over `immutable`, or move the assets into the app tree for static import + hashing.
- **`next.config.ts` `images`:** add `minimumCacheTTL: 31536000` (default is 14400 = 4 hours; measured `max-age=14400, must-revalidate`), `qualities: [75]`, and trim `deviceSizes`/`imageSizes` — no source image exceeds 1476px, and w=3840 and w=1080 return **byte-identical** 53,122 B responses.
- **`components/layout/Header.tsx:49-56`:** preloads the logo at 1080px (**38,154 B AVIF measured**) for a 131 CSS-px slot; the w=256 variant is 10,381 B. Add `sizes="(min-width: 1024px) 184px, (min-width: 640px) 157px, 131px"`, set `width={183} height={56}`, and re-master `public/tech-nature-side.png` (1476×452, 460,833 B).
- **`app/(site)/services/[slug]/page.tsx:101-108`:** no `sizes`, so mobile fetches the 1920px variant for a ~343px slot — a 31× areal over-fetch on the **LCP element of every service page**. Add `sizes="(max-width: 1024px) 100vw, 50vw"` (matching `ProductGallery.tsx:24`'s existing convention).
- **`components/sections/Hero.tsx:106-112`:** the mobile LCP is a CSS `backgroundImage` the preload scanner cannot discover, served raw (55,078 B, `max-age=0`, never converted to AVIF). Convert to `next/image` with `fill` + `sizes="100vw"` + **`preload`** — in Next 16 only `preload` inserts the `<link rel="preload">`; `priority` is deprecated (`image.md:265-293`, v16.0.0 changelog:1402). Replace `priority` with `loading="eager" fetchPriority="high"` at the five public call sites (`Header.tsx:55`, `blog/page.tsx:71` — **drop it entirely here**, it is below a full PageHero — `blog/[slug]/page.tsx:110`, `services/[slug]/page.tsx:107`, `ProductGallery.tsx:23`).
- **`public/hero-particles.mp4`:** `ffprobe` — 1920×1080, 24fps, 6,456,760 bps video + a **pointless 140kbps AAC track on a `muted` element**. Re-encode to 1280-wide H.264 CRF 30 + a VP9/WebM alternate, `-an`. Target <1.5 MB. Write to a **new path** then swap (ffmpeg aborts when input == output).
- **Fonts:** `app/layout.tsx:9-14` preloads 8 woff2 = 86,080 B. Measured usage across `app/` + `components/`: 145 `font-semibold`, 123 `font-medium`, 12 `font-bold`, 8 `font-normal`, 1 `font-black`, **0 `font-light`**. Drop weights `300` and `900` (15,444 B and two fewer preloads racing the LCP) — the single `font-black` is in the Preloader, which is being reworked anyway. Better: drop `weight` entirely and ship the variable font.
- **`components/ui/Reveal.tsx:44`** `gsap.fromTo(targets, { autoAlpha: 0, y }, …)` hides already-painted above-the-fold content after hydration and re-fades it over 1s — including the `priority` hero image on every service page (`services/[slug]/page.tsx:99-100`). Skip the reveal for elements already in the initial viewport, or animate transform only. (Costs LCP, not CLS — `visibility:hidden` keeps the box.)
- **`components/layout/Footer.tsx:150`** raw `<img>` with no dimensions — React 19 hoists `<link rel="preload" href="/arclogo.webp" as="image">` into the head of **every** route. Convert to `next/image` with `width={70} height={36} loading="lazy"`.
- **`components/ui/CountUp.tsx:41`** renders `0{suffix}` in the server HTML. If ScrollTrigger never fires the homepage reads *"0+ Years of industry experience"*. Render the final value and animate from 0.
- **Query duplication:** `app/(site)/layout.tsx:18 await getProducts()` runs a 4-table nested join (`PRODUCT_SELECT`) on **every** public page just to build `{label, href}` for the header. Add a narrow `getProductNav()` selecting `slug, name`, and wrap `getProducts`/`getProduct`/`getPublishedPost(s)` in React `cache()` (already imported at `lib/admin/permissions.ts:1`) — `products/[slug]` fires 4 queries, `blog/[slug]` fires 3.
- **Evaluate** `experimental: { inlineCss: true }` (one 105,300 B / 17,581 B gz render-blocking stylesheet). Flagged experimental in this version's docs — A/B it, don't assume.

---

### G. Launch blockers

**Effort: M (~2 days + client input).** Mostly independent; G-1 gates nothing but must be done before launch.

#### G-1. Placeholder contact data (client input required — send as **one** question, see §5)

| File:line | Current | Blast radius |
|---|---|---|
| `lib/site.ts:20` | `whatsapp: "94771234567", // TODO` | `whatsappLink()` (`:695-697`) feeds **13 call sites** — `Footer.tsx:30`, `contact/page.tsx:26`, `services/[slug]/page.tsx:223`, `blog/[slug]/page.tsx:166`, `ServicePlans.tsx:107`, `BookingForm.tsx:253/281`, `ContactForm.tsx:211/240`, `CheckoutClient.tsx:50/289`, `ChatWidget.tsx:203` — **plus** raw `wa.me` strings in `app/api/chat/route.ts:17-18` and `lib/ai/context.ts:41`, so **the AI agent actively tells customers to message a stranger.** |
| `lib/site.ts:21` | `email: "hello@technurture.lk", // TODO` | Footer mailto, /contact card, Organization JSON-LD (`layout.tsx:127`), LocalBusiness JSON-LD (`page.tsx:53`), **and the default recipient of the only email the app sends** (`chat/route.ts:103 process.env.OWNER_NOTIFICATION_EMAIL \|\| site.email`) |
| `lib/site.ts:24` | `hours: "Mon – Sat · 8:30am – 6:00pm", // TODO` | `/contact:96`, `/book:92`, AI prompt (`context.ts:44`), **and a separately hard-coded `openingHoursSpecification` at `app/(site)/page.tsx:70-84`** that will drift. Derive the schema from `site.hours`. |
| `lib/site.ts:25` | `geo: { lat: 6.9271, lng: 79.8612 }, // TODO` | `GeoCoordinates` in the LocalBusiness JSON-LD — ~3 km off Gothami Road. Drives local-pack distance ranking and the map pin (D-k). |

`.env.local` is missing **`OWNER_NOTIFICATION_EMAIL`** and **`RESEND_FROM`** (both documented in `.env.example:34-41`). Set `RESEND_FROM` to a sender on a domain with SPF/DKIM verified in Resend, or the one email the app sends will be rejected.

#### G-2. Legal pages (no client doc requests these — this is our recommendation)

No `/privacy`, no `/terms`, no consent notice, while the site collects: name/phone/email/**home address**/city/province (`api/orders/route.ts:66-78`, `api/bookings/route.ts:69-79`), logs **every AI chat message** to `ai_messages` (`api/chat/route.ts` `logMessage`, called at `:205`, `:216`, `:413`), and stores a **persistent localStorage visitor id** with `user_agent`, country, region and city per page view (`Tracker.tsx:37-38`, `api/track/route.ts:52-70`). (Note: the tracker sets no **cookie** today — `Tracker.tsx:6` documents it as "cookie-free" — so phrase the notice as tracking/consent.) Sri Lanka's PDPA No. 9 of 2022 plus any EU visitor makes this table stakes. **Must ship before Workstream H.**

#### G-3. Public POST endpoints have no rate limit, honeypot or bot check

`app/api/enquiries/route.ts:3-5`, `app/api/bookings/route.ts:6-8`, `app/api/orders/route.ts:6-8` — all unauthenticated, all writing via `lib/supabase/server.ts:11` which **prefers `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)**. `app/api/chat/route.ts:20-40` already has a limiter (`rateLimited()`, applied at `:166`) precisely because of this. Port it to a shared `lib/rate-limit.ts`, add a honeypot field to the contact and booking forms. `/api/track` is fine — it already filters bots (`BOT_RE`, `:8-9`, enforced at `:50`).

#### G-4. Nobody is told a lead arrived (see D-10)

`api/enquiries/route.ts:45`, `api/bookings/route.ts:89`, `api/orders/route.ts:102` all `return Response.json({ ok: true }, …)` and stop. Meanwhile `BookingForm.tsx:90-91` promises *"Our team will call you shortly to confirm."* and `CheckoutClient.tsx:103` promises *"An agent will call you as soon as possible"*. Extract `notifyOwnerHandoff` + `escapeHtml` from `app/api/chat/route.ts:84-133` into `lib/notify.ts`, call it from all three, keep the no-op-if-unconfigured guard and the try/catch so a mail failure never turns a saved lead into a 500.

#### G-5. Accessibility

- **Contrast:** `app/globals.css:15 --color-green: #1f9243` measures **4.0:1 on white / ~3.87:1 on the `bg-mist` sections** — below AA for normal text, and `.eyebrow` is 0.72rem (`globals.css:70-76`). Used for small text in ≥12 public components (`Services.tsx:28/90`, `AboutIntro.tsx:14`, `WhyChoose.tsx:20`, `BlogPreview.tsx:25/73`, `ServicePlans.tsx:15`, `Header.tsx:73/105`, `ContactForm.tsx:214/243`, `BookingForm.tsx:98/256/284`, `contact/page.tsx:118`). **Switch those to the existing `--color-green-600` (#18803a, 5.01:1)** rather than retuning the brand green, which stays correct for icons, dots and large display type. Also `blog/[slug]/page.tsx:96 text-mist/45` on the dark hero → `/70`, and `Footer.tsx:157 text-white/30` → `/60`. **Confirm with the client** — this touches brand colour usage.
- **Hidden menus stay tabbable:** `Header.tsx:144-151` (closed mobile menu, `pointer-events-none scale-95 opacity-0`) and `CartDrawer.tsx:22-25` (closed drawer, `translate-x-full`) are both rendered unconditionally. On any viewport <1280px a keyboard user tabs through 6 invisible nav links, 6 sub-links, a Book button and a phone link with no visible focus. Add `inert` when closed, Escape-to-close, and `role="dialog" aria-modal="true"` on the drawer. Follow the pattern in `components/admin/ui.tsx:195/212-213`.
- **No skip link, no global `:focus-visible`** — `app/globals.css` defines no focus rule at all, and form fields set `outline-none`. Add a skip link as the first focusable element in `app/(site)/layout.tsx` targeting the `<main>` at `:28`, and a focus token visible on both the light and dark surfaces the site alternates between.
- **Header drop-downs:** `Header.tsx:67+` — no `aria-haspopup`/`aria-expanded`, no Escape handler, and the trigger is a `<Link>`, so on touch a tap navigates instead of opening.

#### G-6. Admin access model

`supabase/migrations/009_admin_auth.sql:7-13` documents *"ANY authenticated Supabase user may access /admin"* and *"IMPORTANT: disable public sign-ups"* — an instruction in a SQL comment, enforced nowhere. `lib/admin/permissions.ts:33` `syntheticSuperAdmin()` is returned at `:105` whenever the `admin_users` schema is missing. **Before go-live verify:** (a) `014_admin_users.sql` is applied to production, (b) Auth → Providers → Email → *Enable sign ups* is **OFF**, (c) each team member has an `admin_users` row. Consider failing closed instead of synthesising a super-admin.

#### G-7. Tooling

No linter: `package.json` has no `lint` script, no `eslint`/`eslint-config-next`, no config file. `jsx-a11y` would have caught the drop-down ARIA; `@next/next/no-img-element` the raw `<img>` at `Footer.tsx:150`; `no-explicit-any` the `(window as any).__preloaderComplete` at `Preloader.tsx:237`. Add it and fix what it reports.

Also: `@types/three` sits in `dependencies` — move to `devDependencies`.

---

### H. Analytics & tracking (client asked for it)

**Effort: M (~1.5 days).** **Must land after G-2 (consent).** Client input required for IDs.

`TechNurture Web.docx` → *"Google Analytics + Tag Manager / Proposal only states 'basic analytics.' / **Required:** Google Analytics 4, Google Tag Manager, Meta Pixel, Conversion Tracking, Event Tracking / **Track:** Purchases, Quote requests, WhatsApp clicks, Phone calls, Form submissions."*

**Current state — verified:** `grep -rnE "gtag|googletagmanager|GTM-|fbq|connect\.facebook"` over `app/`, `components/`, `lib/`, `next.config.ts` and `.env.example` returns **zero matches**. The entire analytics surface is `components/analytics/Tracker.tsx` — a first-party page-view beacon POSTing `{visitorId, sessionId, path, referrer}` to `/api/track`, mounted at `app/(site)/layout.tsx:31`.

Two steps:

1. **Install the base tags** behind env vars (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`) via `next/script` in `app/(site)/layout.tsx` **only**, so `/admin` is never tagged. Keep the existing `/api/track` beacon alongside. **Verify the correct `strategy` semantics against `node_modules/next/dist/docs/` for 16.2.9 — do not assume `afterInteractive` behaviour from memory.**
2. **Emit the five events** from the real call sites:
   - Purchases → `components/shop/CheckoutClient.tsx:62` (`fetch("/api/orders")`) → `:78 setStatus("success")`
   - Quote requests / form submissions → `components/shop/ContactForm.tsx:58` → `:69`; `components/booking/BookingForm.tsx:58` → `:69`
   - WhatsApp clicks → the 13 `whatsappLink(...)` anchors (currently plain `<a>` with no handler)
   - Phone calls → `components/layout/Header.tsx:188 href={site.phoneHref}`

Gate the Meta Pixel behind the consent notice from G-2.

**Performance guard:** `TechNurture Web.docx` also makes mobile PageSpeed >85 contractual. Measure before and after adding three third-party tags.

---

## 4. Explicitly out of scope

| Item | Why |
|---|---|
| **WhatsApp Commerce integration** | The client deferred it in writing: `TechNurture Web.docx` — *"You said it is possible after you register the company, so let's keep this for Phase 2."* Click-to-WhatsApp already ships. (The **fake number** in G-1 is Phase 1 regardless.) |
| **Customer portfolio page** | changes.txt:231 `[[RED]]Do we need a customer portfolio page?[[/]]` — the client struck their own suggestion. Confirm the reading, then do not build. Does **not** cancel Client Logos or Testimonials. |
| **Province/city landing pages** | Large, and materially safer built once the two new service pages exist to template from. Ship as a **3-district pilot in Phase 2** (D-9). A 125-page templated matrix is a doorway-page risk. |
| **Review / AggregateRating schema** | No review data exists; self-authored review markup violates Google policy (D-7). Build the mechanism, ship the markup when real reviews exist. |
| **Testimonials content, client logos** | Blocked on client-supplied quotes and logo files + written permission. Build the components, leave the data empty. |
| **Marketing automation beyond order/booking confirmation** | Birthday offers, welcome/registration series, review requests, SMS/OTP → Phase 2 (D-10). |
| **Products page rebuild (`Website Structure.docx` §13)** | Blocked on clarifying "Product page as i request earlier." (D-n). Do **not** silently drop it — answer the client explicitly. |
| **Admin dashboard a11y/UX audit** | 20+ components, outside the public-site scope of this release. |
| **Backfilling existing `bookings`/`enquiries` rows** storing "Washing Machine — Repair" | Harmless history; no constraint. Owner's call (A-7). |

---

## 5. Assets and inputs needed from the client

**Send as one consolidated request, not piecemeal.**

**Blocking Phase 1 launch:**
1. **Real WhatsApp mobile number** (wa.me format, country code, no `+`/spaces) — confirm it is WhatsApp-enabled. `lib/site.ts:20`
2. **Real monitored contact inbox** — plus a Resend-verified sending domain for `RESEND_FROM`. `lib/site.ts:21`
3. **Confirmed business hours.** `lib/site.ts:24` + `app/(site)/page.tsx:70-84`
4. **Exact map coordinates / Google Maps pin** for the office. `lib/site.ts:25`, needed for D-k
5. **Postal code** for 19A, 1st Lane, Gothami Road, Colombo 08 (do not guess)
6. **Walk-in service centre: address + hours** — is it the same as the office? (D-8)
7. **A photo of a bottle water dispenser service/installation** — no asset exists on disk; hard blocker on the second `serviceCatalog` entry and the second blog article cover
8. **GA4 measurement ID, GTM container ID, Meta Pixel ID** (Workstream H)
9. **Google Business Profile** — claimed? URL for the `sameAs` link, and it must match the site's name/address/phone exactly

**Blocking specific sections (not the whole launch):**
10. **Service-team photograph + short team description** (Special Note 3)
11. **Appliance / on-site photography** for the four `Appliances We Service` blocks (Special Note 2). Note four `WhatsApp Image *.jpeg` files sit unreviewed in `/Users/shahidshamir/Desktop/technature/` — check whether these are the intended team/site photos.
12. **Genuine customer testimonials** (names + permission) — gates D-m and the Review schema
13. **Client logos** (banks / hospitals / corporates / hotels / education) **+ written permission** — `Website Structure.docx` §9

**Decisions to confirm in writing:**
14. D-1 (one or two water cards), D-4 (AMC plan names + bullets), D-5 (heading demotion), D-6 (preloader vs PageSpeed), D-7 (review schema), the customer-portfolio reading, and **"Product page as i request earlier" — what does this refer to?**
15. **Verifiable numbers only:** `TechNurture Web.docx` offers *"10,000+ Customers, 50,000+ Services Completed"* but labels them **"Example"**; changes.txt:7 sets the real figure at **5000+**. Treat 5000+ as authoritative. Do not publish a customer count or satisfaction score without substantiation.
16. **Grammar fix approval:** the mandated FAQ answer reads *"Inline water purifiers its depend on the water source and consumption"*. Recommend *"…depend on the water source and consumption"* — Special Note 1 explicitly invites this.

---

## 6. Verification plan

### Gates that run on every workstream

```bash
cd /Users/shahidshamir/Desktop/technature/technature-web
NEXT_DIST_DIR=.next-verify npx next build     # must exit 0, zero warnings
npx tsc --noEmit                              # must be silent
npx next lint                                 # once G-7 lands
```
Baseline today: build succeeds in ~2.2s, 68 pages generate, `tsc` silent. **Any regression is a stop.**

### Per workstream

| WS | Proof |
|---|---|
| **A** | `grep -rn "washing.machine\|washing machine\|Washer\|laundry\|washer" app components lib public supabase --include="*.ts" --include="*.tsx" --include="*.sql" --include="*.txt" -i` returns **only** the two `next.config.ts` redirect sources and (temporarily) migration 018's `delete` statement. Build output shows `/services/inline-water-purifiers` and `/services/bottle-water-dispensers` prerendered and **no** `/services/washing-machine`. `curl -I localhost:3000/services/washing-machine` → **301 → /services**. `curl localhost:3000/sitemap.xml` contains both new service URLs and neither dead URL. Manually load `/`, `/services`, each of the 5 `/services/<slug>`, `/contact`, `/book` and confirm: 5 footer service links, 5 nav children, correct droplet/glass icons (not a wrench), 4 related tiles on every service page, `5000+` on `/` and `/about`, 7 process steps. |
| **A-6 (AI)** | Open the chat widget: the greeting names the four pillars and no washing machine. Ask *"do you repair washing machines?"* → correct refusal. Ask *"what's covered under the Comprehensive AMC?"* → the bullets, not just the name. Ask *"can I bring it to you?"* → the walk-in option. Attempt a booking → the dropdown enum offers the two water services. |
| **B** | `curl -s localhost:3000/services \| grep -c "<h1"` → **1**. All nine sections present and in order. Validate the `ItemList` + `BreadcrumbList` in Google's Rich Results Test. Read the page aloud for AI-boilerplate phrasing (Special Note 1) before sign-off. |
| **C** | **Two runs.** (i) Supabase **unconfigured** → `/blog` and the homepage BlogPreview render the `lib/site.ts` fallback: 6 posts, no washing machine, two water articles. (ii) Migration 018 applied to a real project → `/blog`, `/blog/<each-slug>` and the homepage preview all serve from the DB with no 404s. `curl localhost:3000/sitemap.xml` lists exactly the published DB slugs. Publish a throwaway post via `/admin/blog`, wait 60s, confirm it appears on the homepage preview **and** in the sitemap (this is the `revalidate` proof). Confirm each new article's category resolves through `categoryToService` to a live internal link and CTA. |
| **D** | Manual read-through of `/services`, `/services/maintenance-amc`, `/contact`, `/about`, `/` against each supporting-doc section. AMC comparison table scrolls horizontally at 375px without the page body scrolling. Exclusions visible on both the AMC page and the comparison-table footnote. |
| **E** | Rich Results Test on `/`, `/services`, `/services/<slug>`, `/blog/<slug>`, `/products/<slug>`, `/contact` — no errors; `LocalBusiness` has `streetAddress`, non-empty `sameAs`, real `geo`. `curl -s localhost:3000/_not-found` → exactly **one** `<title>`, header + footer present. Grep the built HTML of all 7 public routes for `"washing machine"` → 0 hits. Full-site link crawl (e.g. `npx linkinator http://localhost:3000 --recurse`) → 0 broken internal links. |
| **F** | Re-run the measurement harness: production build, `next start`, Chrome at 375×812, Resource Timing. **Acceptance:** mobile homepage `totalTransfer` < 1.5 MB (from 8.26 MB); no route ships the three.js chunk except `/`; per-route JS+CSS gz < 200 KB; `/hero-poster.jpg` and `/tech-nature-side.png` return `max-age` ≥ 86400; hero `<h1>` computed opacity is 1 within 1.5s of first paint. **Background-tab regression test:** load `/` in a hidden tab, wait 10s, foreground it — the preloader must be gone and `document.body.style.overflow` must be `""`. Then a real **PageSpeed Insights run against staging** — mobile ≥85, desktop ≥90 — as the acceptance gate. (No CWV claim in this plan has been validated against live PSI; no deployed URL was available.) |
| **G** | `grep -n "TODO" lib/site.ts app/\(site\)/page.tsx` → 0 launch TODOs. Submit each of the three public forms against a real Supabase project: row lands **and** an email arrives at `OWNER_NOTIFICATION_EMAIL`. Fire 30 rapid POSTs at `/api/enquiries` → 429 after the window. axe DevTools on `/`, `/services`, `/contact`, `/book` → 0 contrast and 0 focus-order violations. Keyboard-only pass at 375px and 1440px: skip link works, closed mobile menu and closed cart drawer are unreachable by Tab, Escape closes both, focus ring visible on every interactive element on both light and dark backgrounds. Confirm Supabase email sign-ups are **off** in production and `014_admin_users.sql` is applied. Verify `/privacy` and `/terms` are live and linked from the footer. |
| **H** | GA4 DebugView receives `page_view` on navigation and one event per: order success, enquiry success, booking success, WhatsApp click, phone click. Meta Pixel Helper confirms the pixel fires **only after consent**. `/admin/*` fires **no** third-party tag. Re-run PageSpeed after the tags land and confirm the targets still hold. |

### Release sequencing

1. **W0 decisions** → written confirmation from the client on D-1 through D-8.
2. **A** (pivot) + **F-1/F-2/F-3** (the three measured blockers) + **G-1** (real contact data) — this is the minimum shippable set; nothing else is safe to launch without it.
3. **C** (blog, with migration 018 in the same release as A) and **E-2/E-3** (sitemap + not-found/error pages).
4. **B** (new /services) + **D** (supporting-doc content).
5. **E** (remaining schema/metadata) + **F** (remaining perf) + **G** (a11y, rate limits, legal, notifications).
6. **G-2 then H** (consent before pixels), then PSI acceptance run.
7. **Phase 2:** district landing pages (3-district pilot), WhatsApp Commerce, full marketing automation, Review schema once real reviews exist.