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

/* Three tiers, mirrored by the role check constraint in 022_departments.sql.
     super_admin — the owner. Exactly one, created in SQL by 014. Nothing
                   the client sends can mint another; see roleOf() in
                   app/api/admin/users/route.ts.
     dept_head   — sees and assigns their own department's work. Always has
                   a department_id (the DB enforces it in 022).
     user        — a department member. Sees only what is theirs. */
export type AdminRole = "super_admin" | "dept_head" | "user";

/* Roles a super admin may actually hand out, in the order the form shows
   them. super_admin is deliberately absent. */
export const GRANTABLE_ROLES = [
  { value: "dept_head", label: "Department head" },
  { value: "user", label: "Department member" },
] as const satisfies readonly { value: Exclude<AdminRole, "super_admin">; label: string }[];

/* One row of public.admin_users — the signed-in person's profile. */
export type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  department_id: string | null;
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

export function isDeptHead(me: AdminProfile) {
  return me.role === "dept_head";
}

/* Someone who oversees other people's work: the super admin everywhere, a
   head inside their own department. Use this for "may see a colleague's
   row" and "may hand work out" — never for write permissions, which stay
   on the capability flags below. */
export function isOverseer(me: AdminProfile) {
  return isSuperAdmin(me) || isDeptHead(me);
}

/* canAccessNav lives in ./nav.ts — whether a key is super-admin-only is a
   property of the menu, not of the profile. */

/* Super admins can do everything, so a missing flag can never lock one
   out of their own dashboard.

   A head is deliberately NOT included: overseeing a department is a read.
   Editing their own leads still needs the same ticked flags as anyone
   else, and other people's leads stay read-only to them. */
export function can(me: AdminProfile, capability: Capability) {
  if (isSuperAdmin(me)) return true;
  return me[capability] === true;
}
