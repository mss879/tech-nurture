import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth-server";
import { getServerSupabase } from "@/lib/supabase/server";
import { isMissingSchema } from "./db";
import { canAccessNav, landingPathFor } from "./nav";
import {
  NAV_KEYS,
  can,
  isSuperAdmin,
  type AdminProfile,
  type AdminRole,
  type Capability,
  type NavKey,
} from "./types";

/* The admin's data access layer.

   Next's authentication guide is explicit that a check in a layout is not
   enough — layouts don't re-render on client-side navigation, so the check
   would be skipped on every route change after the first. So the layout
   only *reads* the profile (to show who you are), and the real checks live
   here, called from each page and each API route.

   Every /api/admin/* route talks to Postgres with the service-role key,
   which bypasses RLS. That makes these checks the only real security
   boundary — RLS cannot help. */


/* The two fallbacks below hand out full access, so they must never fire on
   a live site. They exist to keep local setup from trapping the owner
   before Supabase is connected or 014 has been run — both of which are
   development states. In production the honest answer to "I can't tell
   who you are" is no access at all. proxy.ts fails closed the same way. */
function devFallbackAllowed() {
  return process.env.NODE_ENV !== "production";
}

/* Before 014 exists, the rule documented in 009 still applies: any
   authenticated Supabase user is a full admin. Behaving that way here
   means deploying this code before running the migration can't lock the
   owner out of their own dashboard. */
function syntheticSuperAdmin(id: string, email: string): AdminProfile {
  return {
    id,
    email,
    full_name: null,
    role: "super_admin",
    department_id: null,
    is_active: true,
    nav_access: [...NAV_KEYS],
    can_create_leads: true,
    can_edit_leads: true,
    can_delete_leads: true,
    can_create_products: true,
    can_edit_products: true,
    can_delete_products: true,
  };
}

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/* An allow-list, not a ternary. The obvious `x === "super_admin" ? … : "user"`
   would silently demote every department head to a member on read, with
   nothing thrown and no constraint violated — the department views would
   just quietly return nothing. */
function roleFrom(value: unknown): AdminRole {
  if (value === "super_admin") return "super_admin";
  if (value === "dept_head") return "dept_head";
  return "user";
}

function toProfile(row: Record<string, unknown>): AdminProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    full_name: (row.full_name as string | null) ?? null,
    role: roleFrom(row.role),
    // Absent until 022 has run, which is fine: every consumer treats a
    // missing department as "only your own work".
    department_id: (row.department_id as string | null) ?? null,
    is_active: row.is_active !== false,
    nav_access: Array.isArray(row.nav_access)
      ? (row.nav_access as NavKey[])
      : [],
    can_create_leads: row.can_create_leads === true,
    can_edit_leads: row.can_edit_leads === true,
    can_delete_leads: row.can_delete_leads === true,
    can_create_products: row.can_create_products === true,
    can_edit_products: row.can_edit_products === true,
    can_delete_products: row.can_delete_products === true,
  };
}

/* The signed-in person's profile, or null when they're signed out,
   have no profile, or have been deactivated.

   Memoised with React's cache() so a page that checks a permission and a
   layout that renders the user's name share one lookup per request. */
export const getCurrentAdmin = cache(
  async (): Promise<AdminProfile | null> => {
    // Supabase isn't connected yet. The proxy lets every request through in
    // this state so the app can render its "connect Supabase" screens —
    // do the same here instead of trapping the owner before setup.
    if (!supabaseConfigured()) {
      return devFallbackAllowed()
        ? syntheticSuperAdmin("not-configured", "")
        : null;
    }

    const user = await getAuthUser();
    if (!user) return null;

    const supabase = getServerSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      // 014 hasn't been run yet — behave exactly as the app did before it
      // existed, so deploying ahead of the migration can't lock anyone out.
      if (isMissingSchema(error)) {
        if (devFallbackAllowed()) {
          return syntheticSuperAdmin(user.id, user.email ?? "");
        }
        console.error(
          "admin_users is missing in production — run 014_admin_users.sql. Denying access."
        );
        return null;
      }
      console.error("admin profile lookup failed:", error);
      return null; // fail closed on a real failure
    }

    // No profile, or access switched off — both mean no access.
    if (!data || data.is_active === false) return null;
    return toProfile(data);
  }
);

/* ---------- guards for server pages -------------------------------

   These redirect. Call one at the top of every guarded page.tsx so the
   check runs on each navigation, not just the first render. */

/* Not /admin/login: the proxy has already bounced anyone without a
   session, so reaching here with no profile means they're signed in but
   have no access — and sending them to the login page would bounce them
   straight back to /admin, forever. */
const NO_ACCESS = "/admin/no-access";

export async function requirePageAccess(key: NavKey): Promise<AdminProfile> {
  const me = await getCurrentAdmin();
  if (!me) redirect(NO_ACCESS);
  if (!canAccessNav(me, key)) redirect(landingPathFor(me));
  return me;
}

export async function requirePageSuperAdmin(): Promise<AdminProfile> {
  const me = await getCurrentAdmin();
  if (!me) redirect(NO_ACCESS);
  if (!isSuperAdmin(me)) redirect(landingPathFor(me));
  return me;
}

/* ---------- guards for route handlers ------------------------------

   These return either the profile or a ready-to-return Response, matching
   the shape lib/supabase/auth-server.ts already defined. Usage:

     const gate = await requireNav("crm");
     if ("error" in gate) return gate.error;
     const me = gate.admin;                                             */

export type Gate = { admin: AdminProfile } | { error: Response };

/* Use for any column that's a foreign key to admin_users. The synthetic
   profile used before Supabase is configured has no real row to point at,
   so it must be stored as null rather than a made-up id. */
export function actorId(me: AdminProfile) {
  return me.id === "not-configured" ? null : me.id;
}

function denied(message: string) {
  return { error: Response.json({ error: message }, { status: 403 }) };
}

export async function requireAdmin(): Promise<Gate> {
  const me = await getCurrentAdmin();
  if (!me) {
    return {
      error: Response.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }
  return { admin: me };
}

export async function requireNav(key: NavKey): Promise<Gate> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  if (!canAccessNav(gate.admin, key)) {
    return denied("You don't have access to this section.");
  }
  return gate;
}

export async function requireSuperAdmin(): Promise<Gate> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  if (!isSuperAdmin(gate.admin)) {
    return denied("Only a super admin can do this.");
  }
  return gate;
}

const CAPABILITY_WORDING: Record<Capability, string> = {
  can_create_leads: "add leads",
  can_edit_leads: "edit leads",
  can_delete_leads: "delete leads",
  can_create_products: "add products",
  can_edit_products: "edit products",
  can_delete_products: "delete products",
};

export function requireCapability(
  me: AdminProfile,
  capability: Capability
): { error: Response } | null {
  if (can(me, capability)) return null;
  return denied(
    `You don't have permission to ${CAPABILITY_WORDING[capability]}.`
  );
}
