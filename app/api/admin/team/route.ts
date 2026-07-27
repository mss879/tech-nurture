import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";

/* GET — active team members, for "assigned to" pickers and for showing an
   owner's name on a lead or to-do.

   Available to any signed-in admin (names only, no permissions or email
   settings), because a team member still needs to see who a shared to-do
   belongs to. */
export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name", { ascending: true, nullsFirst: false });

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
