import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

/* POST — create a lead.
   Either from an enquiry: { pipelineId, enquiryId }
   or manually:            { pipelineId, name, phone?, email?, value?, notes? } */
export async function POST(request: Request) {
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
    return Response.json(
      { error: "Pipeline has no stages." },
      { status: 400 }
    );
  }

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
    };
  }

  const { error: insertError } = await supabase.from("crm_leads").insert(lead);
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

  return Response.json({ ok: true }, { status: 201 });
}

/* PATCH — move or edit a lead: { id, stageId?, name?, phone?, email?, value?, notes? } */
export async function PATCH(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.stageId) update.stage_id = body.stageId;
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.phone !== undefined) update.phone = body.phone || null;
  if (body.email !== undefined) update.email = body.email || null;
  if (body.value !== undefined)
    update.value = body.value === null || body.value === "" ? null : Number(body.value);
  if (body.notes !== undefined) update.notes = body.notes || null;

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("crm_leads")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("lead update failed:", error);
    return Response.json({ error: "Could not update lead." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase.from("crm_leads").delete().eq("id", id);
  if (error) {
    console.error("lead delete failed:", error);
    return Response.json({ error: "Could not delete lead." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
