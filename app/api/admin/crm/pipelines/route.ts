import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, requireSuperAdmin } from "@/lib/admin/permissions";
import { visibleUserIds } from "@/lib/admin/departments";

const DEFAULT_STAGES = [
  { name: "New", kind: "active" },
  { name: "Contacted", kind: "active" },
  { name: "Qualified", kind: "active" },
  { name: "Won", kind: "won" },
  { name: "Lost", kind: "lost" },
];

/* GET — every pipeline with its stages, plus the leads the caller may
   see: all of them for a super admin, their whole department's for a
   department head, and only their own for everyone else.

   A head's view is read-only — the write rules in ./leads/route.ts still
   ask "is this lead assigned to me?", so seeing a colleague's card does
   not come with the ability to move or reassign it.

   Pipelines and leads are fetched separately and stitched together rather
   than embedding leads in the pipeline select. An embedded filter does
   work, but it filters the embedded rows only — and swapping it for an
   `!inner` join later (a natural-looking "optimisation") would silently
   drop every pipeline where the user has no leads, dumping them on the
   "No pipelines yet" screen. Two queries can't be broken that way. */
export async function GET() {
  const gate = await requireNav("crm");

  // The Enquiries page asks for pipelines to fill its "Send to CRM"
  // picker, and swallows failures into a misleading "No pipelines yet".
  // An empty list is the honest answer for someone without CRM access.
  if ("error" in gate) return Response.json({ pipelines: [] });
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const leadQuery = supabase.from("crm_leads").select("*");
  const visible = await visibleUserIds(me);
  if (visible) leadQuery.in("assigned_to", visible);

  const [pipelineRes, leadRes] = await Promise.all([
    supabase
      .from("crm_pipelines")
      .select("id, name, created_at, crm_stages(id, name, position, kind)")
      .order("created_at", { ascending: true }),
    leadQuery.order("created_at", { ascending: false }),
  ]);

  if (pipelineRes.error || leadRes.error) {
    console.error("pipelines list failed:", pipelineRes.error ?? leadRes.error);
    return Response.json(
      {
        error:
          "Could not load pipelines. Have you run 003_crm.sql and 015_crm_access.sql?",
      },
      { status: 500 }
    );
  }

  const byPipeline = new Map<string, Record<string, unknown>[]>();
  for (const lead of leadRes.data ?? []) {
    const list = byPipeline.get(lead.pipeline_id) ?? [];
    list.push(lead);
    byPipeline.set(lead.pipeline_id, list);
  }

  const pipelines = (pipelineRes.data ?? []).map((p) => ({
    ...p,
    // stages come back unordered — sort them by position
    crm_stages: [...(p.crm_stages ?? [])].sort(
      (a, b) => a.position - b.position
    ),
    crm_leads: byPipeline.get(p.id) ?? [],
  }));

  return Response.json({ pipelines });
}

/* Creating, renaming and deleting a pipeline is structural, so it's
   super-admin only — a team member works inside the pipelines they're
   given. */
export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  if (!name) {
    return Response.json(
      { error: "Pipeline name is required." },
      { status: 400 }
    );
  }

  const { data: pipeline, error } = await supabase
    .from("crm_pipelines")
    .insert({ name })
    .select("id")
    .single();

  if (error || !pipeline) {
    console.error("pipeline create failed:", error);
    return Response.json(
      { error: "Could not create pipeline." },
      { status: 500 }
    );
  }

  const { error: stagesError } = await supabase.from("crm_stages").insert(
    DEFAULT_STAGES.map((stage, i) => ({
      pipeline_id: pipeline.id,
      name: stage.name,
      kind: stage.kind,
      position: i,
    }))
  );

  if (stagesError) {
    console.error("stage create failed:", stagesError);
    return Response.json(
      { error: "Pipeline created but stages failed." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, id: pipeline.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  if (!body?.id || !name) {
    return Response.json(
      { error: "id and name are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("crm_pipelines")
    .update({ name })
    .eq("id", body.id);

  if (error) {
    console.error("pipeline rename failed:", error);
    return Response.json(
      { error: "Could not rename pipeline." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  // Stages and leads both cascade from the pipeline. 015 deliberately sets
  // the stage → lead FK to `no action` rather than `restrict` so this still
  // works — the check is deferred to the end of the statement.
  const { error } = await supabase.from("crm_pipelines").delete().eq("id", id);
  if (error) {
    console.error("pipeline delete failed:", error);
    return Response.json(
      { error: "Could not delete pipeline." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
