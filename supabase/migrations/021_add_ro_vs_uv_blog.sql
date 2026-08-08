-- ============================================================
-- 021 — ADD REVERSE OSMOSIS VS UV BLOG POST
-- Adds the new Reverse Osmosis vs UV Water Filtration blog article to Supabase
-- to replace the retired washing machine blog topic and cover the new water purification pillar.
--
-- Safe to re-run: on conflict (slug) do nothing.
-- Requires: 007_blog.sql.
-- ============================================================

insert into public.blog_posts
  (slug, title, excerpt, body, cover_image, category, read_time,
   meta_title, meta_description, keywords, published, published_at)
values
(
  'reverse-osmosis-vs-uv-water-filtration',
  'Reverse Osmosis vs UV Purification: Which Water Filter Is Right for You?',
  $e$Understanding RO vs UV filtration technologies, how they target different contaminants, and which system best suits Sri Lankan municipal and borehole water supplies.$e$,
  $b$Choosing between Reverse Osmosis (RO) and Ultraviolet (UV) water purification depends on your water source and the specific contaminants you need to eliminate. In Sri Lanka, water composition varies significantly between mains municipal supply and groundwater wells.

Reverse Osmosis (RO) uses a semi-permeable membrane to remove dissolved solids, heavy metals, hardness minerals, microplastics, and chemical pollutants. It is ideal for areas with hard water or high total dissolved solids (TDS).

Ultraviolet (UV) purification uses UV-C light to neutralize 99.99% of bacteria, viruses, and biological pathogens without chemical additives or water wastage. UV systems excel at biological disinfection when TDS levels are already low.

Many modern inline systems combine multi-stage sediment filtering, carbon block adsorption, RO membrane filtration, and final UV sterilization into a unified under-sink unit for maximum safety and taste enhancement.

Our water specialists conduct on-site water quality testing to recommend the optimal purification setup for your home or business across Sri Lanka, backed by genuine filter replacement and routine maintenance contracts.$b$,
  '/blog/water-purifier-comparison.png',
  'Inline Water Purifiers',
  '5 min read',
  'Reverse Osmosis vs UV Purification: Which Water Filter Is Right for You?',
  $e$Understanding RO vs UV filtration technologies, how they target different contaminants, and which system best suits Sri Lankan municipal and borehole water supplies.$e$,
  array['water filter comparison','RO vs UV purifier','water purification Sri Lanka'],
  true,
  '2026-08-07T09:00:00+05:30'
)
on conflict (slug) do nothing;
