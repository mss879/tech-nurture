import { cache } from "react";
import { getServerSupabase } from "@/lib/supabase/server";
import { isMissingSchema } from "./db";
import { isDeptHead, isSuperAdmin, type AdminProfile } from "./types";

/* Who a person is allowed to look at.

   Every "can I see this row?" question in the admin reduces to "is it
   assigned to, or created by, someone on this list?". Keeping that in one
   place is the point: the same rule then backs the CRM board, the lead
   timeline, the team picker and the to-do list, so a scope tab can't
   accidentally be more generous than the route that serves it.

   RLS cannot help here — every /api/admin/* route uses the service-role
   key, which bypasses it. See lib/admin/permissions.ts. */

/* null means "no restriction" — only the super admin gets it. Everyone
   else gets an explicit list, never an absent filter, so forgetting to
   apply the result fails loudly in review rather than quietly in
   production. */
export type VisibleIds = string[] | null;

/* Keyed on the department id rather than taking a client, because
   getServerSupabase() hands back a fresh object every call — passing it
   in would make every cache key unique and the memo pointless. Building
   another client here costs nothing; it's a config object, not a
   connection. */
const lookup = async (departmentId: string, activeOnly: boolean) => {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const query = supabase
    .from("admin_users")
    .select("id")
    .eq("department_id", departmentId);
  if (activeOnly) query.eq("is_active", true);

  const { data, error } = await query;
  if (error) {
    // 022 hasn't run yet, or the lookup failed. Either way the caller
    // falls back to just themselves: under-sharing is recoverable,
    // over-sharing is not.
    if (!isMissingSchema(error)) {
      console.error("department member lookup failed:", error);
    }
    return null;
  }
  return (data ?? []).map((r) => r.id as string);
};

/* Everyone in the department, switched off or not — deactivating somebody
   must not make their half-finished work vanish from their head's view. */
const departmentMembers = cache((departmentId: string) =>
  lookup(departmentId, false)
);

/* Only people who can still sign in — what a picker should offer. */
const activeDepartmentMembers = cache((departmentId: string) =>
  lookup(departmentId, true)
);

export const visibleUserIds = async (
  me: AdminProfile
): Promise<VisibleIds> => {
  if (isSuperAdmin(me)) return null;

  // A member sees their own work, exactly as before departments existed.
  if (!isDeptHead(me) || !me.department_id) return [me.id];

  const ids = await departmentMembers(me.department_id);
  if (!ids) return [me.id];

  // me.id is folded in for the case where a head somehow isn't in their
  // own department's row set.
  return [...new Set([me.id, ...ids])];
};

/* True when the caller may see work belonging to `ownerId`. Mirrors
   visibleUserIds for the single-row case, where building a list and
   scanning it would just be noise. */
export function canSeeWorkOf(ids: VisibleIds, ownerId: string | null) {
  if (ids === null) return true;
  return ownerId !== null && ids.includes(ownerId);
}

/* Who the caller may put a name to, and therefore mention on a to-do.

   Wider than visibleUserIds by exactly one step: a member's own visible
   set is just themselves, which would leave them unable to put a name to
   a colleague on a to-do they share, or to loop one in. Their department
   is the natural boundary — names aren't sensitive, and mentioning
   somebody shares the to-do with them, so it must not reach another
   department. */
export const namableUserIds = async (
  me: AdminProfile
): Promise<VisibleIds> => {
  if (isSuperAdmin(me)) return null;
  if (!me.department_id) return [me.id];

  const ids = await activeDepartmentMembers(me.department_id);
  if (!ids) return [me.id];

  return [...new Set([me.id, ...ids])];
};

/* Who the caller may put ON a to-do as an assignee — always a subset of
   namableUserIds. A member can only give themselves work; a head can give
   it to their own department; the super admin to anyone. */
export const assignableUserIds = async (
  me: AdminProfile
): Promise<VisibleIds> => {
  if (isSuperAdmin(me)) return null;
  if (!isDeptHead(me)) return [me.id];
  return namableUserIds(me);
};
