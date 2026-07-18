import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { phoneKey } from "@/lib/phone";

const STATUSES = ["new", "handling", "completed", "cancelled"];

export async function GET(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  // Optional ?month=YYYY-MM → only bookings whose preferred_date falls in that
  // month (used by the dashboard calendar). Otherwise return everything.
  const month = new URL(request.url).searchParams.get("month");
  let query = supabase.from("bookings").select("*");
  const m = month && /^\d{4}-\d{2}$/.test(month) ? month : null;
  if (m) {
    const [y, mo] = m.split("-").map(Number);
    const start = `${m}-01`;
    const endDate = new Date(Date.UTC(y, mo, 1)); // first day of next month
    const end = endDate.toISOString().slice(0, 10);
    query = query
      .gte("preferred_date", start)
      .lt("preferred_date", end)
      .order("preferred_date", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error("bookings list failed:", error);
    return Response.json(
      { error: "Could not load bookings. Have you run 005_bookings.sql?" },
      { status: 500 }
    );
  }

  // Annotate each booking with whether the customer has contacted before.
  const keys = Array.from(
    new Set((bookings ?? []).map((b) => phoneKey(b.phone)).filter(Boolean))
  ) as string[];

  const clientByKey = new Map<
    string,
    { id: string; interactions: number; created_at: string }
  >();
  if (keys.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, interactions, created_at, phone_key")
      .in("phone_key", keys);
    for (const c of clients ?? []) {
      if (c.phone_key) clientByKey.set(c.phone_key, c);
    }
  }

  const annotated = (bookings ?? []).map((b) => {
    const client = clientByKey.get(phoneKey(b.phone) ?? "");
    return {
      ...b,
      client_id: client?.id ?? null,
      returning: client ? client.interactions > 1 : false,
    };
  });

  return Response.json({ bookings: annotated });
}

/* PATCH — update status and/or editable fields: { id, status?, name?, phone?,
   email?, service?, district?, preferred_date?, preferred_time?, address?, message? } */
export async function PATCH(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return Response.json({ error: "Invalid status." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.status !== undefined) update.status = body.status; // enum-checked above

  // NOT NULL columns: accept a new value, but never blank them out.
  for (const f of [
    "name",
    "phone",
    "service",
    "district",
    "preferred_date",
    "preferred_time",
  ]) {
    if (body[f] !== undefined) {
      const v = String(body[f]).trim();
      if (!v) {
        return Response.json(
          { error: `${f.replace("_", " ")} cannot be empty.` },
          { status: 400 }
        );
      }
      update[f] = v;
    }
  }

  // Nullable columns.
  for (const f of ["email", "address", "message"]) {
    if (body[f] !== undefined) update[f] = String(body[f] ?? "").trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("booking update failed:", error);
    return Response.json({ error: "Could not update booking." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) {
    console.error("booking delete failed:", error);
    return Response.json({ error: "Could not delete booking." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
