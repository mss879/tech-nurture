import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/admin/permissions";

/* Pipeline stages: add, rename, reorder, delete.

   Super-admin only — the shape of the board is a decision about how the
   business works, not day-to-day lead handling. */

/* POST — add a stage.
   { pipelineId, name, kind?: "active" | "won" | "lost" } */
export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  if (!body?.pipelineId || !name) {
    return Response.json(
      { error: "pipelineId and name are required." },
      { status: 400 }
    );
  }

  const kind = ["active", "won", "lost"].includes(body.kind)
    ? body.kind
    : "active";

  // New stages go on the end.
  const { data: last } = await supabase
    .from("crm_stages")
    .select("position")
    .eq("pipeline_id", body.pipelineId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("crm_stages").insert({
    pipeline_id: body.pipelineId,
    name,
    kind,
    position: (last?.position ?? -1) + 1,
  });

  if (error) {
    console.error("stage create failed:", error);
    return Response.json(
      { error: "Could not add the stage. Have you run 015_crm_access.sql?" },
      { status: 500 }
    );
  }
  return Response.json({ ok: true }, { status: 201 });
}

/* PATCH — rename a stage: { id, name?, kind? }
   or reorder a whole pipeline: { pipelineId, order: [stageId, …] } */
export async function PATCH(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);

  if (Array.isArray(body?.order) && body?.pipelineId) {
    // One statement inside the RPC, so the deferred unique constraint on
    // (pipeline_id, position) only sees the final arrangement.
    const { error } = await supabase.rpc("crm_reorder_stages", {
      p_pipeline: body.pipelineId,
      p_ids: body.order,
    });
    if (error) {
      console.error("stage reorder failed:", error);
      return Response.json(
        { error: "Could not reorder the stages." },
        { status: 500 }
      );
    }
    return Response.json({ ok: true });
  }

  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return Response.json(
        { error: "A stage needs a name." },
        { status: 400 }
      );
    }
    update.name = name;
  }
  if (["active", "won", "lost"].includes(body.kind)) update.kind = body.kind;

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("crm_stages")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("stage update failed:", error);
    return Response.json(
      { error: "Could not update the stage." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}

/* DELETE ?id=<uuid>&moveToStageId=<uuid>

   Refuses to leave leads homeless: if the stage still holds any, the
   caller has to say where they go. 015 changed the lead → stage foreign
   key to `no action` so the database backs this up rather than quietly
   deleting the leads along with the column. */
export async function DELETE(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const moveToStageId = url.searchParams.get("moveToStageId");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { data: stage } = await supabase
    .from("crm_stages")
    .select("id, name, pipeline_id")
    .eq("id", id)
    .maybeSingle();

  if (!stage) {
    return Response.json({ error: "Stage not found." }, { status: 404 });
  }

  const { count: stageCount } = await supabase
    .from("crm_stages")
    .select("id", { count: "exact", head: true })
    .eq("pipeline_id", stage.pipeline_id);

  if ((stageCount ?? 0) <= 1) {
    return Response.json(
      { error: "A pipeline needs at least one stage." },
      { status: 400 }
    );
  }

  const { count: leadCount } = await supabase
    .from("crm_leads")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", id);

  const leads = leadCount ?? 0;

  if (leads > 0) {
    if (!moveToStageId) {
      return Response.json(
        { error: "move_required", leads, stage: stage.name },
        { status: 409 }
      );
    }
    if (moveToStageId === id) {
      return Response.json(
        { error: "Choose a different stage to move the leads to." },
        { status: 400 }
      );
    }
    const { error: moveError } = await supabase
      .from("crm_leads")
      .update({ stage_id: moveToStageId })
      .eq("stage_id", id);

    if (moveError) {
      console.error("stage lead move failed:", moveError);
      return Response.json(
        { error: "Could not move the leads out of this stage." },
        { status: 500 }
      );
    }
  }

  const { error } = await supabase.from("crm_stages").delete().eq("id", id);
  if (error) {
    console.error("stage delete failed:", error);
    return Response.json(
      { error: "Could not delete the stage." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
