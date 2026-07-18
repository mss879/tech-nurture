# TechNurture — Supabase backend

Everything the site and the `/admin` dashboard need lives in one Supabase
project. Set the three keys in `.env.local` (see `../.env.example`), then run
the migrations below.

## 1. Run the migrations

In the Supabase dashboard → **SQL Editor**, run each file in
`supabase/migrations/` **in order**. (Or `supabase db push` with the CLI.)

| File | Adds | Admin menu |
| --- | --- | --- |
| `001_orders.sql` | Orders + line items | — |
| `002_enquiries.sql` | Contact-form enquiries | Inquiries |
| `003_crm.sql` | CRM pipelines / stages / leads | CRM |
| `004_dashboard.sql` | First `dashboard_stats` view | Dashboard |
| `005_bookings.sql` | Service bookings | Services Booking |
| `006_clients.sql` | Client registry + auto-capture triggers | Clients |
| `007_blog.sql` | Blog posts + `blog` storage bucket | Blog |
| `008_analytics.sql` | Page-view tracking + reporting views | Dashboard |
| `009_admin_auth.sql` | RLS hardening for the admin tables | — |
| `010_dashboard.sql` | Widened `dashboard_stats` view | Dashboard |
| `011_seed_blog.sql` | **Optional** — seeds the 5 starter posts | Blog |

> `010_dashboard.sql` replaces the view created in `004`, so it must run after
> `005`–`008`. `011` is optional — skip it to start with an empty blog (the
> public `/blog` page falls back to the 5 built-in posts until you publish).

## 2. Create your admin login

The `/admin` dashboard is protected by Supabase Auth.

1. **Authentication → Users → Add user** — set your email + password.
2. **Disable public sign-ups** so nobody can create their own admin account:
   **Authentication → Providers → Email → turn off "Enable sign ups"**
   (older UIs: **Authentication → Settings → "Allow new users to sign up"**).

Any user you add this way can sign in at `/admin/login`. There is no public
sign-up form in the app.

## 3. Storage (blog images)

`007_blog.sql` creates a public `blog` storage bucket and a public-read policy.
Blog cover images are uploaded through the admin (server-side, service-role) and
served from `https://<project-ref>.supabase.co/storage/v1/object/public/blog/…`.
That host is already allow-listed in `next.config.ts` (`images.remotePatterns`).

## 4. Analytics & visitor location

The site records anonymous page views (no cookies, no IP stored). Visitor
**location** comes from your hosting platform's geo headers:

- **Vercel** — `x-vercel-ip-city` / `-country-region` / `-country` (automatic).
- **Cloudflare** — `cf-ipcountry` (automatic).
- **Local dev / other hosts** — no geo headers, so location shows **"Unknown"**.
  This is expected; deploy behind Vercel or Cloudflare for real location data.

## How it fits together

- Public **enquiries**, **bookings** and **page views** are inserted with the
  anon key (RLS allows insert-only on those tables).
- Every enquiry and booking also **auto-captures a client** via database
  triggers (`006`), so contacts are kept permanently and repeat customers are
  flagged (`interactions > 1`) — even if the enquiry, booking or CRM lead is
  later deleted.
- The `/admin` dashboard reads and writes everything through server API routes
  using the **service-role key**, which bypasses RLS. The browser only ever
  holds the anon key.
