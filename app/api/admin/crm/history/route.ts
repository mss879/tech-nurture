import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";
import { isSuperAdmin } from "@/lib/admin/types";

/* GET ?leadId=<uuid> — the stage timeline for one lead, shown in the
   detail popup: when it entered each stage, who moved it, and whether a
   super admin moved it back. */
export async function GET(request: Request) {
  const gate = await requireNav("crm");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const leadId = new URL(request.url).searchParams.get("leadId");
  if (!leadId) {
    return Response.json({ error: "leadId is required." }, { status: 400 });
  }

  const { data: lead } = await supabase
    .from("crm_leads")
    .select("id, assigned_to")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });

  if (!isSuperAdmin(me) && lead.assigned_to !== me.id) {
    return Response.json(
      { error: "This lead isn't assigned to you." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("crm_lead_stage_history")
    .select(
      "id, moved_at, direction, note, from_stage_id, to_stage_id, moved_by"
    )
    .eq("lead_id", leadId)
    .order("moved_at", { ascending: false })
    .limit(50);

  if (error) {
    // 015 not run yet — no timeline to show, but the popup still works.
    if (isMissingSchema(error)) return Response.json({ history: [] });
    console.error("stage history load failed:", error);
    return Response.json(
      { error: "Could not load this lead's history." },
      { status: 500 }
    );
  }

  return Response.json({ history: data ?? [] });
}
