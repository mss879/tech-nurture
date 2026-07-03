import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

const DEFAULT_STAGES = ["New", "Contacted", "Qualified", "Won", "Lost"];

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("crm_pipelines")
    .select(
      "id, name, created_at, crm_stages(id, name, position), crm_leads(*)"
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("pipelines list failed:", error);
    return Response.json(
      { error: "Could not load pipelines. Have you run 003_crm.sql?" },
      { status: 500 }
    );
  }

  // stages come back unordered — sort them by position
  const pipelines = (data ?? []).map((p) => ({
    ...p,
    crm_stages: [...(p.crm_stages ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  }));

  return Response.json({ pipelines });
}

export async function POST(request: Request) {
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
    DEFAULT_STAGES.map((stageName, i) => ({
      pipeline_id: pipeline.id,
      name: stageName,
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
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  // stages & leads cascade via FK
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
