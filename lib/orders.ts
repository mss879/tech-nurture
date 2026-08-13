/* Customer details, on their way into public.orders.

   Two entry points write that table — the public checkout
   (app/api/orders/route.ts) and the admin's own "New order" form
   (app/api/admin/orders/route.ts) — and every customer column is
   unbounded `text`. Both clip rather than reject, so a chatty delivery
   note still gets through, and both clip to the same lengths because
   they land in the same columns.

   What's REQUIRED differs and deliberately stays with each caller: the
   checkout demands name, email, phone and address; a phone order only
   ever reliably has a name and a number. */

export const CUSTOMER_LIMITS = {
  name: 120,
  email: 160,
  phone: 40,
  address: 500,
  city: 80,
  province: 80,
  notes: 2000,
} as const;

export function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export type CustomerInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  province?: unknown;
  notes?: unknown;
};

export type Customer = Record<keyof typeof CUSTOMER_LIMITS, string | null>;

export function clipCustomer(input: CustomerInput | undefined | null): Customer {
  const c = input ?? {};
  return {
    name: clip(c.name, CUSTOMER_LIMITS.name),
    email: clip(c.email, CUSTOMER_LIMITS.email),
    phone: clip(c.phone, CUSTOMER_LIMITS.phone),
    address: clip(c.address, CUSTOMER_LIMITS.address),
    city: clip(c.city, CUSTOMER_LIMITS.city),
    province: clip(c.province, CUSTOMER_LIMITS.province),
    notes: clip(c.notes, CUSTOMER_LIMITS.notes),
  };
}

/* How an order reached us. 'website' is a real checkout and is written
   only by the public route; the rest are what the admin form offers.
   Mirrors the orders_source_check constraint in 027_custom_orders.sql. */
export const ADMIN_ORDER_SOURCES = [
  { value: "phone", label: "Phone call" },
  { value: "walk_in", label: "Walk-in" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
] as const;

export type AdminOrderSource = (typeof ADMIN_ORDER_SOURCES)[number]["value"];

export function isAdminOrderSource(value: unknown): value is AdminOrderSource {
  return ADMIN_ORDER_SOURCES.some((s) => s.value === value);
}

/* Shown as a chip on the orders list so a custom order is obvious at a
   glance. Rows written before 027 have no source at all — they can only
   have come from the shop, so they read as a website order. */
export function orderSourceLabel(source: string | null | undefined) {
  if (!source || source === "website") return null;
  return (
    ADMIN_ORDER_SOURCES.find((s) => s.value === source)?.label ?? "Custom"
  );
}
