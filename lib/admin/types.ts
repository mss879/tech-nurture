/* Shared admin types. Deliberately dependency-free (no React, no lucide,
   no Supabase) so server layouts, route handlers and client components can
   all import from here. */

/* Every menu item the admin has. This list is mirrored by the
   nav_access check constraint in 014_admin_users.sql — widening it needs a
   migration, which is intentional: a typo'd key should fail loudly at the
   database, not silently deny access. */
export const NAV_KEYS = [
  "dashboard",
  "todos",
  "enquiries",
  "chats",
  "bookings",
  "orders",
  "products",
  "crm",
  "clients",
  "blog",
  "users",
] as const;

export type NavKey = (typeof NAV_KEYS)[number];

/* What a lead can be done to. Deliberately three flags, matching how the
   permission form asks the question: add / edit / delete.
   "Move a lead through stages" is part of editing — a CRM user without it
   has a read-only board, which is just the absence of can_edit_leads. */
export type LeadCapability =
  | "can_create_leads"
  | "can_edit_leads"
  | "can_delete_leads";

/* Same three-way split for the shop catalogue. */
export type ProductCapability =
  | "can_create_products"
  | "can_edit_products"
  | "can_delete_products";

export type Capability = LeadCapability | ProductCapability;

/* One row of public.admin_users — the signed-in person's profile. */
export type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "super_admin" | "user";
  is_active: boolean;
  nav_access: NavKey[];
  can_create_leads: boolean;
  can_edit_leads: boolean;
  can_delete_leads: boolean;
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
};

export function isSuperAdmin(me: AdminProfile) {
  return me.role === "super_admin";
}

/* canAccessNav lives in ./nav.ts — whether a key is super-admin-only is a
   property of the menu, not of the profile. */

/* Super admins can do everything, so a missing flag can never lock one
   out of their own dashboard. */
export function can(me: AdminProfile, capability: Capability) {
  if (isSuperAdmin(me)) return true;
  return me[capability] === true;
}
