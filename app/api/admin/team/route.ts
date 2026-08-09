import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";
import { namableUserIds } from "@/lib/admin/departments";

/* GET — the people the caller may hand work to, or needs to name on a
   card, for "assigned to" pickers and for showing an owner's name.

   Available to any signed-in admin (names only, no permissions or email
   settings), because a team member still needs to see who a shared to-do
   belongs to.

   Scoped by namableUserIds: a super admin sees the whole company,
   everyone else sees their own department. That is the same set the to-do
   assignee and mention pickers are allowed to draw from, so the list and
   the rule that validates a submission can never disagree. */
export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const query = supabase
    .from("admin_users")
    .select("id, full_name, email, role, department_id")
    .eq("is_active", true);

  const namable = await namableUserIds(me);
  if (namable) query.in("id", namable);

  const { data, error } = await query.order("full_name", {
    ascending: true,
    nullsFirst: false,
  });

  if (error) {
    // Before 014 there are no team members — an empty list keeps the
    // pickers working instead of breaking the page they sit on.
    if (isMissingSchema(error)) return Response.json({ members: [] });
    console.error("team list failed:", error);
    return Response.json(
      { error: "Could not load the team." },
      { status: 500 }
    );
  }

  return Response.json({ members: data ?? [] });
}
