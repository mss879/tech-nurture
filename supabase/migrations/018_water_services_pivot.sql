-- ============================================================
-- 018 — WATER SERVICES PIVOT (blog content)
-- The service line-up gained Inline Water Purifiers and Bottle Water
-- Dispensers. Per the client's change document: remove the washing
-- machine article, add one article for inline water purification and a
-- separate one for bottle water dispensers.
--
-- WHY THIS IS A NEW MIGRATION, not an edit to 011_seed_blog.sql:
-- 011 ends with `on conflict (slug) do nothing`, so re-running it against
-- an already-seeded project is a no-op. Editing 011 changes nothing in
-- production. Every blog change after the first seed needs a forward
-- migration like this one.
--
-- Mirrors `posts` in lib/site.ts, which is the fallback the public blog
-- uses when Supabase isn't configured. Keep the two in step.
-- Requires: 007_blog.sql. Safe to re-run.
-- ============================================================

-- 1. Retire the washing machine article ----------------------------------
delete from public.blog_posts
 where slug = 'washing-machine-not-spinning-or-draining';

-- 2. The two new water articles ------------------------------------------
insert into public.blog_posts
  (slug, title, excerpt, body, cover_image, category, read_time,
   meta_title, meta_description, keywords, published, published_at)
values
(
  'how-often-should-an-inline-water-purifier-be-serviced',
  'How Often Should an Inline Water Purifier Be Serviced?',
  $e$Service intervals, the warning signs worth acting on, and why the sticker on the housing is usually wrong for Sri Lankan water.$e$,
  $b$As a general rule, an inline water purifier needs servicing every three to six months. The honest answer is that the interval depends on your water source and how much you use — a household on a borehole in Kurunegala and an office on treated mains in Colombo 07 will not run the same schedule, even with identical hardware.

The reason people get this wrong is that an inline system is invisible. It sits under the sink or in a service duct, it has no display, and nothing announces that the carbon stage stopped adsorbing six weeks ago. Unlike a countertop unit you look at every day, there is no visual cue at all — which is exactly why a fixed calendar interval matters more here, not less.

Watch for the signs that the interval is too long: reduced flow at the tap, an unusual taste or odour, visible leakage at a housing, unusual sounds from the pump, or a filter-replacement indicator you have been ignoring. Any one of these is worth an inspection rather than a wait-and-see.

Each stage has its own life. Sediment and carbon cartridges are the fast-moving consumables. RO membranes last considerably longer but fail expensively if the pre-filters ahead of them were neglected — most premature membrane failures we see are really pre-filter failures. UV lamps are the trap: a UV lamp keeps glowing well past the point where its output has dropped below the dose that actually kills anything, so it must be replaced on hours, not on whether it lights up.

Sanitization is the step most schedules skip. Replacing cartridges in a housing that has grown biofilm puts a clean filter into a dirty system. If your water tests fine but still tastes off, biofilm in the tubing or storage tank is the usual explanation, and a full flush and disinfection is what fixes it.

We service RO, UV, UF and multi-stage systems across Sri Lanka regardless of who installed them, fit genuine cartridges and membranes, and can arrange water-quality testing so the schedule is set against your actual supply. If you would rather not track it at all, an Annual Maintenance Contract puts the visits and the filter changes on a fixed cycle.$b$,
  '/blog/water-purifier-service.png',
  'Inline Water Purifiers',
  '5 min read',
  'How Often Should an Inline Water Purifier Be Serviced?',
  $e$Inline water purifier service intervals explained — RO membranes, UV lamps, carbon cartridges and the warning signs that mean it is overdue. TechNurture, island-wide in Sri Lanka.$e$,
  array['inline water purifier service Sri Lanka','water purifier filter replacement','RO membrane replacement','UV lamp replacement','water purifier maintenance Colombo'],
  true,
  '2026-08-05T09:00:00+05:30'
),
(
  'why-your-water-dispenser-needs-sanitizing',
  'Why Your Water Dispenser Needs Sanitizing, Not Just Wiping',
  $e$The reservoir nobody cleans, what grows in it, and how often a shared office dispenser really needs professional sanitization.$e$,
  $b$A bottled water dispenser is the one appliance in an office that everybody drinks from and nobody owns. The drip tray gets emptied, the outside gets wiped, and the internal reservoir — the part the water actually sits in — goes untouched for years.

That reservoir is warm at the top, cool at the bottom, permanently wet and open to room air every time a bottle is changed. It is close to ideal conditions for biofilm: a slick bacterial layer on the tank walls and the internal tubing that no amount of external cleaning reaches. Once established, it re-seeds every fresh bottle you load.

The tell-tale signs are easy to dismiss individually. A faint taste that only some people notice. A slight film on the tap. Cold water that no longer feels properly cold. Water pooling under the unit. None of them looks urgent, which is precisely why dispensers tend to go a very long time between real services.

Professional sanitization is a different job from cleaning. It means draining the unit, chlorinating and steam-sanitizing the tank, disinfecting the internal lines and taps, flushing thoroughly, and then verifying that the cold and hot sides still hold temperature. In a shared workplace we recommend it every three to six months — more often in a clinic, a school or a food-handling environment.

Sanitization is also the moment to catch the mechanical faults: a thermostat drifting out of range, a heating element on its way out, a perished tap seal, a compressor working harder than it should. All of them are cheaper to address at a scheduled visit than as an emergency call.

We service bottled dispensers for homes, offices, clinics and schools across Sri Lanka — tank chlorination and steam sanitization, bacterial disinfection, cooling and heating repairs, and spare-part replacement. Most customers put it on an Annual Maintenance Contract, because in practice this is the appliance that only stays maintained when somebody else is tracking it.$b$,
  '/blog/bottle-water-dispenser-sanitization.jpg',
  'Bottle Water Dispensers',
  '4 min read',
  'Water Dispenser Sanitization & Service in Sri Lanka',
  $e$Why wiping a bottled water dispenser is not the same as sanitizing it — biofilm, tank chlorination, steam sanitization and how often it is really needed. TechNurture, island-wide.$e$,
  array['water dispenser sanitization Sri Lanka','bottle water dispenser service','water dispenser repair Colombo','office water cooler cleaning'],
  true,
  '2026-07-29T09:00:00+05:30'
)
on conflict (slug) do nothing;

-- 3. Bring the surviving articles in line with the new service line-up ----
-- The AMC article listed the appliances an AMC covers; water services now
-- belong in that list.
update public.blog_posts
   set body = replace(
         body,
         'automatic for your air conditioners, refrigerators and washing machines.',
         'automatic for your air conditioners, refrigerators, inline water purifiers, bottle water dispensers and washing machines.'
       )
 where slug = 'benefits-of-an-appliance-amc';

-- ============================================================
-- After running this, confirm in the admin (/admin/blog) that six posts
-- are published and that the two new covers resolve:
--   /blog/water-purifier-service.png
--   /blog/bottle-water-dispenser-sanitization.jpg
-- ============================================================
