-- ============================================================
-- 011 — SEED BLOG  (OPTIONAL)
-- Seeds the 5 posts that previously lived hard-coded in lib/site.ts
-- so the Blog manager opens with real, editable content and /blog
-- keeps its articles after moving to the database.
--
-- This is the ONLY migration that inserts data. Skip it if you'd
-- rather start with an empty blog (the public /blog page falls back
-- to the built-in posts until you publish your own).
-- Safe to re-run: on conflict (slug) do nothing.
-- Requires: 007_blog.sql.
-- ============================================================

insert into public.blog_posts
  (slug, title, excerpt, body, cover_image, category, read_time,
   meta_title, meta_description, keywords, published, published_at)
values
(
  'signs-your-air-conditioner-needs-repair',
  'Signs Your Air Conditioner Needs Repair',
  $e$Weak cooling, rising bills and strange sounds are your AC asking for help. Here's how to read the signals before a breakdown.$e$,
  $b$We recommend servicing air conditioning units every 3 to 6 months, depending on usage and environmental conditions. Regular servicing improves efficiency and extends equipment life.

If your AC is not cooling properly, the usual suspects are dirty filters, low refrigerant levels, blocked condensers, faulty components or poor airflow. Our technicians can diagnose and resolve these issues efficiently.

Rising electricity bills are often the first quiet warning. A properly maintained air conditioner operates more efficiently, helping reduce energy consumption and utility costs month after month.

For urgent issues we offer emergency repair services — because a comfortable indoor environment shouldn't have to wait. We also support large commercial systems across offices, healthcare and education facilities.$b$,
  '/blog/ac-unit-maintenance.png',
  'Air Conditioning',
  '4 min read',
  'Signs Your Air Conditioner Needs Repair',
  $e$Weak cooling, rising bills and strange sounds are your AC asking for help. Here's how to read the signals before a breakdown.$e$,
  array['AC repair Sri Lanka','air conditioner service','AC maintenance'],
  true,
  '2026-07-10T09:00:00+05:30'
),
(
  'why-your-refrigerator-stops-cooling',
  'Why Your Refrigerator Stops Cooling (and How to Fix It)',
  $e$A fridge that won't cool is a race against spoiling food. Here are the common causes — and when to call a technician.$e$,
  $b$When a refrigerator stops cooling, the most common causes are a gas (refrigerant) leak, a failing compressor, a faulty thermostat or a blocked defrost system. Each has different symptoms, so an accurate on-site diagnosis matters.

Start with the easy checks: confirm the unit has power, the door seals fully, and the vents inside aren't blocked by food. If the freezer works but the fridge section is warm, the problem is often airflow or the defrost system rather than the compressor.

A leaking refrigerant circuit or a burnt-out compressor needs a qualified technician — refrigerant handling and compressor replacement are not DIY jobs. We locate the leak, repair it, refill with the correct gas and verify stable cooling before we leave.

Our technicians service domestic and commercial refrigerators and freezers of all major brands, using genuine parts. If a repair isn't worthwhile, we'll tell you honestly rather than sell you an unnecessary fix.

The best protection against a mid-week breakdown is preventive care — an Annual Maintenance Contract keeps seals, gas levels and cooling performance in check all year round.$b$,
  '/blog/refrigerator-repair.png',
  'Refrigerator',
  '5 min read',
  'Why Your Refrigerator Stops Cooling (and How to Fix It)',
  $e$A fridge that won't cool is a race against spoiling food. Here are the common causes — and when to call a technician.$e$,
  array['refrigerator repair Sri Lanka','fridge not cooling','freezer repair'],
  true,
  '2026-07-04T09:00:00+05:30'
),
(
  'washing-machine-not-spinning-or-draining',
  'Washing Machine Not Spinning or Draining? Here''s Why',
  $e$No spin, no drain, or water left in the drum — the usual culprits behind the most common washing-machine faults.$e$,
  $b$If your washing machine won't spin or drain, the water left in the drum usually points to a blocked drain pump, a clogged filter, a kinked drain hose or a worn drive belt. On automatic machines, a faulty door lock or control board can also stop the cycle.

Before calling for service, check the drain filter (usually behind a small panel at the front) and make sure the drain hose isn't blocked or pushed too far into the standpipe. Clearing lint and debris solves a surprising number of 'won't drain' cases.

Persistent no-spin faults are often the motor carbon brushes, the drive belt, the door-lock switch or the main PCB. Loud banging on spin usually means worn drum bearings — a bigger job best handled by a technician before it damages the drum.

We repair front-load, top-load and fully-automatic washing machines of all major brands, diagnose error codes, and fit genuine parts. Every repair is tested with a full cycle so you know it's truly fixed.$b$,
  '/blog/washing-machine-repair.png',
  'Washing Machine',
  '5 min read',
  'Washing Machine Not Spinning or Draining? Here''s Why',
  $e$No spin, no drain, or water left in the drum — the usual culprits behind the most common washing-machine faults.$e$,
  array['washing machine repair Sri Lanka','washer not spinning','washer not draining'],
  true,
  '2026-06-26T09:00:00+05:30'
),
(
  'benefits-of-an-appliance-amc',
  'The Benefits of an Appliance Annual Maintenance Contract',
  $e$An AMC turns unpredictable repair bills into a planned, predictable cost — while keeping your appliances healthier for longer.$e$,
  $b$Preventive maintenance is the key to maximizing appliance performance, reducing downtime and extending asset lifespan. An Annual Maintenance Contract (AMC) makes that preventive care automatic for your air conditioners, refrigerators and washing machines.

A Comprehensive AMC is our most complete solution — scheduled preventive visits, routine servicing, labour, eligible spare-part replacement, breakdown support and priority technical assistance, all for one predictable annual cost.

A Non-Comprehensive AMC is the economical option: professional servicing, inspections, labour and technical support, with replacement parts charged separately as needed.

Prefer to pay only when something happens? On-Call Service gives you service visits on request, breakdown troubleshooting and inspections without a contract.

Whichever you choose, the benefits are the same: fewer breakdowns, longer appliance life, lower long-term repair costs, better efficiency and priority support — in short, peace of mind.$b$,
  '/blog/amc-benefits.png',
  'Maintenance',
  '6 min read',
  'The Benefits of an Appliance Annual Maintenance Contract',
  $e$An AMC turns unpredictable repair bills into a planned, predictable cost — while keeping your appliances healthier for longer.$e$,
  array['appliance AMC Sri Lanka','annual maintenance contract','preventive maintenance'],
  true,
  '2026-06-18T09:00:00+05:30'
),
(
  'extend-the-life-of-your-home-appliances',
  '7 Habits That Extend the Life of Your Home Appliances',
  $e$Small routines that keep your AC, fridge and washing machine running longer — and out of the repair queue.$e$,
  $b$Most appliance failures are gradual, not sudden — which means a few simple habits can add years to the life of your AC, refrigerator and washing machine, and keep them running efficiently.

Clean or replace filters on schedule. AC filters restrict airflow when clogged, forcing the system to work harder; washing-machine drain filters cause drainage faults when neglected. This is the single highest-impact habit most people skip.

Give appliances room to breathe. Leave a gap behind the fridge for the condenser to release heat, keep the AC condenser unit clear of leaves and dust, and don't overload the washing machine drum.

Watch for early warning signs — weak cooling, unusual sounds, longer cycles, rising bills or small leaks. Catching a small fault early is almost always cheaper than waiting for a full breakdown.

Finally, book a periodic professional service. Reactive repairs are almost always more expensive, more disruptive and more urgent than planned maintenance — which is exactly what an Annual Maintenance Contract is designed to prevent.$b$,
  '/blog/preventive-maintenance-savings.png',
  'Maintenance',
  '4 min read',
  '7 Habits That Extend the Life of Your Home Appliances',
  $e$Small routines that keep your AC, fridge and washing machine running longer — and out of the repair queue.$e$,
  array['home appliance maintenance','extend appliance life','appliance care tips'],
  true,
  '2026-06-10T09:00:00+05:30'
)
on conflict (slug) do nothing;
