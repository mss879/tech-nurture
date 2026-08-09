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
| `012_ai_agent.sql` | AI chat log + `ai` lead/booking source | (chat widget) |
| `013_live_chat.sql` | Chat sessions + human handoff / takeover | Live Chat |
| `014_admin_users.sql` | Team members, roles and permissions | Users & Access |
| `015_crm_access.sql` | Lead assignment, Won/Lost outcomes, stage history | CRM |
| `016_todos.sql` | To-dos, notifications, due-date reminders | To-dos |
| `017_products.sql` | Products, product permissions | Products |
| `018_water_services_pivot.sql` | Content pivot to water services | Services |
| `019_product_content_fields.sql` | `product_brands` + product content fields | Products |
| `020_product_fields_cleanup.sql` | Product field cleanup | Products |
| `021_add_ro_vs_uv_blog.sql` | **Optional** — seeds one blog post | Blog |
| `022_departments.sql` | Departments and the `dept_head` role | Users & Access |
| `023_todo_participants.sql` | Many assignees per to-do, @mentions | To-dos |
| `024_todo_links.sql` | Linking a to-do to enquiries / leads / orders / bookings | To-dos |

> `010_dashboard.sql` replaces the view created in `004`, so it must run after
> `005`–`008`. `011` is optional — skip it to start with an empty blog (the
> public `/blog` page falls back to the 5 built-in posts until you publish).
>
> **Read the header of `014_admin_users.sql` before running it.** It promotes
> one email address to super admin and drops every other existing account to
> limited access. If that address doesn't exist yet it aborts on purpose,
> rather than leaving you with no super admin at all.
>
> **`022`–`024` must be run before deploying the code that uses them.**
> `023` drops `todos.assigned_to` and `024` drops `todos.lead_id`, both after
> moving the data into their new tables — so the app expects them gone. Between
> deploying and running them the To-dos page says which file is missing rather
> than failing silently.

## 2. Admin accounts

The `/admin` dashboard is protected by Supabase Auth, and — from `014` onwards —
by a per-person permission row in `public.admin_users`.

**First-time setup**

1. **Authentication → Users → Add user** — create `admin@technurture.lk` with a
   password. (Using a different address? Change the one line marked in
   `014_admin_users.sql` before you run it.)
2. **Disable public sign-ups** so nobody can create their own account:
   **Authentication → Providers → Email → turn off "Enable sign ups"**
   (older UIs: **Authentication → Settings → "Allow new users to sign up"**).
   This does *not* affect the admin's own "Add team member" button, which uses
   the service-role key.
3. Run `014_admin_users.sql`. That account becomes the **super admin**.

**Everyone else** is added from inside the app — **Users & Access → Add team
member**. That screen sets their password, their department, which menu items
they can open, and what they may do to CRM leads. Accounts created directly in
the Supabase dashboard can't sign in to the admin; they show up on that page as
"no access set up" so you can add them properly.

**Roles** (from `022` onwards)

- **Super admin** — sees every menu and every lead, adds and removes team
  members, assigns leads and to-dos, manages pipeline stages, and is the only
  person who can move a lead back to an earlier stage.
- **Department head** — sees every to-do and every lead belonging to their own
  department, and hands out to-dos to their own people. Their CRM view of
  colleagues' leads is **read-only**: only the super admin assigns leads or
  moves one backwards.
- **Team member** — sees only the menus they've been given, only the leads
  assigned to them, and only the to-dos they're assigned to, mentioned on, or
  created.

**There is exactly one super admin**, and the app can no longer create another:
the Users & Access page offers only Department head and Department member, and
the API refuses `super_admin` whatever the request body says. Promoting someone
is deliberately a SQL-editor job:

```sql
update public.admin_users set role = 'super_admin', is_active = true
where email = 'admin@technurture.lk';
```

**Locked out?** Run exactly that. Note the `dept_head` rows carry a
`admin_users_dept_head_has_department` check, so a head always has a
`department_id` — set one in the same statement if you demote someone into that
role by hand.

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

## 5. AI chat agent

The website chat widget (bottom-right on every public page) answers questions,
captures leads (into **Inquiries** + **CRM**) and creates **bookings** — all in
this same backend, tagged `source = 'ai'`.

1. Run `012_ai_agent.sql`.
2. Add `OPENAI_API_KEY` to `.env.local` (from
   [platform.openai.com/api-keys](https://platform.openai.com/api-keys)) and
   restart. Model: `gpt-4o-mini` via the Vercel AI SDK.

Without the key the widget still shows but politely points visitors to phone /
WhatsApp. Conversations are logged to `ai_messages`.

### Live chat & human takeover (013)

Every conversation is saved and visible under **Live Chat** in the admin. There
you can watch chats in real time, flip a conversation from **AI → Manual** (which
switches the bot off), and reply as your team — replies appear in the visitor's
widget within a few seconds (polling).

When a visitor asks to speak to a person, the AI calls a `request_human` tool
that flags the conversation. The admin **always** shows this (a red badge on the
"Live Chat" menu + the conversation highlighted). To *also* get an **email** when
you're away from the admin, set `RESEND_API_KEY` (+ optionally
`OWNER_NOTIFICATION_EMAIL` and `RESEND_FROM`) — verify your domain at
[resend.com/domains](https://resend.com/domains). Email is entirely optional; the
in-admin badge works without it.

> **Production note:** `/api/chat` is a public endpoint that runs a paid model
> and can write to the DB. It has a best-effort in-memory rate limit and a
> one-insert-per-request cap, which are enough on a single instance. For a
> serverless deploy (e.g. Vercel), back the rate limit with a shared store
> (Upstash / Vercel KV) or add a Cloudflare Turnstile check to the widget.

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
- Because the service-role key bypasses RLS, **permissions are enforced in the
  application, not in Postgres**. Every `/api/admin/*` route calls a guard in
  `lib/admin/permissions.ts`, and every guarded page calls one too — a check in
  the layout alone wouldn't be enough, since layouts don't re-render when you
  navigate between admin pages.
- **Due-date reminders are never stored.** The bell derives them from the
  `todo_reminders` view every time it polls, so changing a to-do's due date, or
  completing it, can't leave a stale "due tomorrow" behind. Only *dismissals*
  are stored — keyed on the due date and bucket, so dismissing "due tomorrow"
  goes quiet today and speaks up again in the morning as "due today".
