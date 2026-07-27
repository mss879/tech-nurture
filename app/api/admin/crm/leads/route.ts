import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import {
  requireNav,
  requireCapability,
  actorId,
} from "@/lib/admin/permissions";
import { isSuperAdmin } from "@/lib/admin/types";
import { notify } from "@/lib/admin/notify";
import { isMissingSchema } from "@/lib/admin/db";

type Stage = { id: string; name: string; position: number; kind: string };

/* Which way a move is going.

   "Lost" is an outcome, not a later step than "Won", so a move into any
   outcome stage counts as an outcome rather than as forward or back. That
   split is what makes "forward only" mean something a person can predict.  */
function directionOf(from: Stage | undefined, to: Stage) {
  if (to.kind !== "active") return "outcome" as const;
  if (from && from.kind !== "active") return "reopened" as const;
  if (!from || to.position > from.position) return "forward" as const;
  return "back" as const;
}

/* POST — create a lead.
   Either from an enquiry: { pipelineId, enquiryId }
   or manually:            { pipelineId, name, phone?, email?, value?, notes? }
   A super admin may also pass { assignedTo }. */
export async function POST(request: Request) {
  const gate = await requireNav("crm");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const denied = requireCapability(me, "can_create_leads");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.pipelineId) {
    return Response.json({ error: "pipelineId is required." }, { status: 400 });
  }

  // first stage of the pipeline is the entry point
  const { data: firstStage, error: stageError } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("pipeline_id", body.pipelineId)
    .order("position", { ascending: true })
    .limit(1)
    .single();

  if (stageError || !firstStage) {
    return Response.json({ error: "Pipeline has no stages." }, { status: 400 });
  }

  /* A team member only ever sees leads assigned to them, so a lead they
     create must be theirs — otherwise it would vanish the moment they
     saved it. A super admin can hand it straight to someone else. */
  const assignedTo = isSuperAdmin(me)
    ? body.assignedTo || null
    : actorId(me);

  let lead: {
    pipeline_id: string;
    stage_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    source: "manual" | "enquiry";
    enquiry_id: string | null;
    value: number | null;
    notes: string | null;
    assigned_to: string | null;
    assigned_by: string | null;
    assigned_at: string | null;
  };

  const assignment = {
    assigned_to: assignedTo,
    assigned_by: assignedTo ? actorId(me) : null,
    assigned_at: assignedTo ? new Date().toISOString() : null,
  };

  if (body.enquiryId) {
    const { data: enquiry, error: enquiryError } = await supabase
      .from("enquiries")
      .select("*")
      .eq("id", body.enquiryId)
      .single();

    if (enquiryError || !enquiry) {
      return Response.json({ error: "Enquiry not found." }, { status: 404 });
    }

    lead = {
      pipeline_id: body.pipelineId,
      stage_id: firstStage.id,
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      source: "enquiry",
      enquiry_id: enquiry.id,
      value: null,
      notes: [
        enquiry.service && `Service: ${enquiry.service}`,
        enquiry.province && `Province: ${enquiry.province}`,
        enquiry.message,
      ]
        .filter(Boolean)
        .join("\n"),
      ...assignment,
    };
  } else {
    if (!body.name?.trim()) {
      return Response.json({ error: "Lead name is required." }, { status: 400 });
    }
    lead = {
      pipeline_id: body.pipelineId,
      stage_id: firstStage.id,
      name: body.name.trim(),
      phone: body.phone || null,
      email: body.email || null,
      source: "manual",
      enquiry_id: null,
      value: body.value ? Number(body.value) : null,
      notes: body.notes || null,
      ...assignment,
    };
  }

  const { data: created, error: insertError } = await supabase
    .from("crm_leads")
    .insert(lead)
    .select("id")
    .single();

  if (insertError) {
    console.error("lead create failed:", insertError);
    return Response.json({ error: "Could not create lead." }, { status: 500 });
  }

  // mark the source enquiry as pushed to CRM
  if (body.enquiryId) {
    await supabase
      .from("enquiries")
      .update({ status: "in_crm" })
      .eq("id", body.enquiryId);
  }

  if (assignedTo && assignedTo !== actorId(me)) {
    await notify(supabase, [
      {
        user_id: assignedTo,
        kind: "lead_assigned",
        title: `New lead: ${lead.name}`,
        body: "A lead has been assigned to you.",
        href: "/admin/crm",
        lead_id: created?.id ?? null,
      },
    ]);
  }

  return Response.json({ ok: true, id: created?.id }, { status: 201 });
}

/* PATCH — move, edit or reassign a lead.
   { id, stageId?, assignedTo?, name?, phone?, email?, value?, notes?, note? } */
export async function PATCH(request: Request) {
  const gate = await requireNav("crm");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const { data: lead } = await supabase
    .from("crm_leads")
    .select("id, name, pipeline_id, stage_id, assigned_to")
    .eq("id", body.id)
    .maybeSingle();

  if (!lead) {
    return Response.json({ error: "Lead not found." }, { status: 404 });
  }

  if (!isSuperAdmin(me) && lead.assigned_to !== me.id) {
    return Response.json(
      { error: "This lead isn't assigned to you." },
      { status: 403 }
    );
  }

  const update: Record<string, unknown> = {};
  let movedTo: Stage | undefined;
  let movedFrom: Stage | undefined;
  let direction: ReturnType<typeof directionOf> | null = null;

  /* ---- moving between stages ---- */
  if (body.stageId && body.stageId !== lead.stage_id) {
    const denied = requireCapability(me, "can_edit_leads");
    if (denied) return denied.error;

    const { data: stages } = await supabase
      .from("crm_stages")
      .select("id, name, position, kind")
      .eq("pipeline_id", lead.pipeline_id);

    const all = (stages ?? []) as Stage[];
    movedFrom = all.find((s) => s.id === lead.stage_id);
    movedTo = all.find((s) => s.id === body.stageId);

    if (!movedTo) {
      return Response.json(
        { error: "That stage isn't part of this pipeline." },
        { status: 400 }
      );
    }

    direction = directionOf(movedFrom, movedTo);

    // Forward only — except for a super admin correcting a mistake.
    if (direction === "back" && !isSuperAdmin(me)) {
      return Response.json(
        {
          error: `Leads only move forward. "${lead.name}" is already at ${movedFrom?.name ?? "a later stage"} — ask a super admin if it needs to go back.`,
        },
        { status: 403 }
      );
    }
    if (direction === "reopened" && !isSuperAdmin(me)) {
      return Response.json(
        {
          error: `"${movedFrom?.name}" is a closed outcome. Only a super admin can reopen this lead.`,
        },
        { status: 403 }
      );
    }

    update.stage_id = movedTo.id;
  }

  /* ---- reassigning ---- */
  if (body.assignedTo !== undefined) {
    if (!isSuperAdmin(me)) {
      return Response.json(
        { error: "Only a super admin can assign leads." },
        { status: 403 }
      );
    }
    update.assigned_to = body.assignedTo || null;
    update.assigned_by = body.assignedTo ? actorId(me) : null;
    update.assigned_at = body.assignedTo ? new Date().toISOString() : null;
  }

  /* ---- editing the details ---- */
  const editFields =
    body.name !== undefined ||
    body.phone !== undefined ||
    body.email !== undefined ||
    body.value !== undefined ||
    body.notes !== undefined;

  if (editFields) {
    const denied = requireCapability(me, "can_edit_leads");
    if (denied) return denied.error;

    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.phone !== undefined) update.phone = body.phone || null;
    if (body.email !== undefined) update.email = body.email || null;
    if (body.value !== undefined) {
      update.value =
        body.value === null || body.value === "" ? null : Number(body.value);
    }
    if (body.notes !== undefined) update.notes = body.notes || null;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  update.updated_by = actorId(me);

  const { error } = await supabase
    .from("crm_leads")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("lead update failed:", error);
    return Response.json({ error: "Could not update lead." }, { status: 500 });
  }

  // Record the move, including a super admin's correction, so a backwards
  // step is never invisible.
  if (movedTo && direction) {
    const { error: historyError } = await supabase
      .from("crm_lead_stage_history")
      .insert({
        lead_id: lead.id,
        from_stage_id: movedFrom?.id ?? null,
        to_stage_id: movedTo.id,
        moved_by: actorId(me),
        direction,
        note: body.note || null,
      });
    if (historyError && !isMissingSchema(historyError)) {
      console.error("stage history insert failed:", historyError);
    }
  }

  if (
    body.assignedTo !== undefined &&
    body.assignedTo &&
    body.assignedTo !== lead.assigned_to &&
    body.assignedTo !== actorId(me)
  ) {
    await notify(supabase, [
      {
        user_id: body.assignedTo,
        kind: "lead_assigned",
        title: `Lead assigned to you: ${lead.name}`,
        body: "A lead has been assigned to you.",
        href: "/admin/crm",
        lead_id: lead.id,
      },
    ]);
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireNav("crm");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const denied = requireCapability(me, "can_delete_leads");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  if (!isSuperAdmin(me)) {
    const { data: lead } = await supabase
      .from("crm_leads")
      .select("id, assigned_to")
      .eq("id", id)
      .maybeSingle();
    if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
    if (lead.assigned_to !== me.id) {
      return Response.json(
        { error: "This lead isn't assigned to you." },
        { status: 403 }
      );
    }
  }

  const { error } = await supabase.from("crm_leads").delete().eq("id", id);
  if (error) {
    console.error("lead delete failed:", error);
    return Response.json({ error: "Could not delete lead." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
