import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

const STATUSES = ["new", "contacted", "in_crm", "closed"];

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("enquiries list failed:", error);
    return Response.json(
      { error: "Could not load enquiries. Have you run 002_enquiries.sql?" },
      { status: 500 }
    );
  }
  return Response.json({ enquiries: data });
}

export async function PATCH(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id || !STATUSES.includes(body?.status)) {
    return Response.json(
      { error: "id and a valid status are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("enquiries")
    .update({ status: body.status })
    .eq("id", body.id);

  if (error) {
    console.error("enquiry update failed:", error);
    return Response.json(
      { error: "Could not update enquiry." },
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

  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) {
    console.error("enquiry delete failed:", error);
    return Response.json(
      { error: "Could not delete enquiry." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
