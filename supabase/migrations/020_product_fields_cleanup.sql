-- ============================================================
-- 020 — PRODUCT FIELDS CLEANUP
-- The product record now matches the client's "Product.xlsx" exactly.
-- 019 added everything the brief asks for; this removes the fields that
-- pre-dated it and are not in the brief, so the Add-product form has the
-- same shape as the sheet and nothing else.
--
-- WHAT IS DROPPED, AND WHERE THAT CONTENT LIVES NOW
--
--   products.form              "Countertop" / "Floor-standing".
--                              Covered by PRODUCT SUB TITLE, e.g.
--                              "Premium Countertop Hot, Cold & Normal
--                              Water Purifier".
--
--   products.pdf_url           A spec-sheet PDF link. The brief has no
--                              such field — the Technical Specifications
--                              table is the spec sheet.
--
--   product_variants
--     .recommended_for         "Ideal for city water and well water…".
--                              The brief puts this in PRODUCT DESCRIPTION,
--                              alongside the model it belongs to.
--
--     .option_detail           Filter stages / capacity. The brief puts
--                              this in the Technical Specifications table.
--                              (Was `filter_stages` before 019.)
--
-- WHAT SURVIVES ON A MODEL: the model code, its short label ("UF" / "RO" /
-- "1.5 Ton"), the price and the +VAT flag. A model has to be sellable, and
-- the label is what tells two of them apart in the basket and in
-- order_items.filtration.
--
-- ⚠ THIS DROPS DATA. Run the SELECT below first if you want to keep a copy
--   of what is in those columns before they go.
--
--       select id, slug, name, form, pdf_url from public.products
--        where form is not null or pdf_url is not null;
--
--       select product_id, model, recommended_for, option_detail
--         from public.product_variants
--        where recommended_for is not null or option_detail is not null;
--
-- Safe to re-run. Requires: 019_product_content_fields.sql.
-- ============================================================

alter table public.products
  drop column if exists form,
  drop column if exists pdf_url;

alter table public.product_variants
  drop column if exists recommended_for,
  drop column if exists option_detail,
  -- Belt and braces: if 019 was skipped, the pre-019 name is dropped too.
  drop column if exists filter_stages;

comment on column public.product_variants.option_label is
  'What tells this model apart — "UF", "RO", "1.5 Ton". Shown in the model picker and copied to order_items.filtration at checkout.';

-- ============================================================
-- After running this, /admin/products → Add product shows exactly the
-- brief's structure:
--   Auto detections · Drop downs · Pictures · Title · Description ·
--   Model(s) · Key Features · Why Choose <title>? · Perfect For ·
--   Technical Specifications · Highlights
-- ============================================================
