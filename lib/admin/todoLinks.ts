import type { NavKey } from "./types";

/* The records a to-do can point at.

   One table drives everything: which nav permission gates the kind, which
   table to search, which columns make up the label, and which column on
   todo_links holds the foreign key. Adding a fifth kind means adding a row
   here and a column in a migration — deliberately not something that can
   be done by accident. See 024_todo_links.sql. */

export const LINK_KINDS = ["enquiry", "lead", "order", "booking"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export type LinkSpec = {
  /* Which menu item you must be able to open to search this kind. Someone
     with only To-dos access must not be able to fish through Orders via
     the reference picker. */
  nav: NavKey;
  table: string;
  column: "enquiry_id" | "lead_id" | "order_id" | "booking_id";
  /* Columns worth matching a typed query against. */
  search: string[];
  /* Columns to select, in addition to id. */
  select: string[];
  label: (row: Record<string, unknown>) => string;
  sub: (row: Record<string, unknown>) => string | null;
  href: string;
  /* Leads are the only kind that belongs to a person, so they're the only
     kind the picker has to scope by department. */
  ownerColumn?: "assigned_to";
};

const text = (v: unknown) => (typeof v === "string" ? v : "");

export const LINK_SPECS: Record<LinkKind, LinkSpec> = {
  enquiry: {
    nav: "enquiries",
    table: "enquiries",
    column: "enquiry_id",
    search: ["name", "phone", "email"],
    select: ["name", "phone", "status"],
    label: (r) => text(r.name),
    sub: (r) => text(r.phone) || text(r.status) || null,
    href: "/admin/enquiries",
  },
  lead: {
    nav: "crm",
    table: "crm_leads",
    column: "lead_id",
    search: ["name", "phone", "email"],
    select: ["name", "phone", "assigned_to"],
    label: (r) => text(r.name),
    sub: (r) => text(r.phone) || null,
    href: "/admin/crm",
    ownerColumn: "assigned_to",
  },
  order: {
    nav: "orders",
    table: "orders",
    column: "order_id",
    search: ["customer_name", "phone", "email"],
    select: ["customer_name", "phone", "status"],
    // Matches todo_link_labels in 024 — 001 gave orders no order number,
    // so a short id is what tells two orders from the same person apart.
    label: (r) => `${text(r.customer_name)} · #${text(r.id).slice(0, 8)}`,
    sub: (r) => text(r.status) || null,
    href: "/admin/orders",
  },
  booking: {
    nav: "bookings",
    table: "bookings",
    column: "booking_id",
    search: ["name", "phone", "service"],
    select: ["name", "phone", "service", "status"],
    label: (r) => `${text(r.name)} · ${text(r.service)}`,
    sub: (r) => text(r.status) || null,
    href: "/admin/bookings",
  },
};

export function isLinkKind(value: unknown): value is LinkKind {
  return (
    typeof value === "string" && (LINK_KINDS as readonly string[]).includes(value)
  );
}

/* PostgREST builds `or=(a.ilike.*q*,b.ilike.*q*)` from a bare string, so a
   comma, parenthesis or dot in the query would rewrite the filter itself.
   Names, phone numbers and emails need none of those, so strip anything
   that isn't one of the characters they legitimately contain. */
export function safeQuery(raw: string) {
  return raw.replace(/[^\p{L}\p{N} @._+-]/gu, "").trim();
}

export type LinkRef = { kind: LinkKind; id: string };

/* Pull { kind, id } pairs out of whatever the browser sent, dropping
   anything malformed and any duplicate of the same record. */
export function parseLinkRefs(input: unknown): LinkRef[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const refs: LinkRef[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const { kind, id } = item as { kind?: unknown; id?: unknown };
    if (!isLinkKind(kind) || typeof id !== "string" || !id) continue;
    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ kind, id });
  }
  return refs;
}
