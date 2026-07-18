import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { phoneKey } from "@/lib/phone";

/* GET
   ?id=<uuid>  → one client plus their enquiry + booking history
   ?q=<text>   → search by name / phone / email
   (none)      → all clients, most-recently-active first */
export async function GET(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const q = url.searchParams.get("q")?.trim();

  if (id) {
    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !client) {
      return Response.json({ error: "Client not found." }, { status: 404 });
    }

    const key = client.phone_key as string | null;
    const email = client.email as string | null;

    // Match this contact's full history server-side via the stored phone_key
    // (generated column, added in 006) and/or email — no row-scan cap.
    const orParts: string[] = [];
    if (key) orParts.push(`phone_key.eq.${key}`);
    if (email) {
      const safeEmail = email.replace(/["(),]/g, " ").trim();
      if (safeEmail) orParts.push(`email.ilike."${safeEmail}"`);
    }

    let enquiries: unknown[] = [];
    let bookings: unknown[] = [];
    if (orParts.length > 0) {
      const orFilter = orParts.join(",");
      const [enq, bk] = await Promise.all([
        supabase
          .from("enquiries")
          .select("id, created_at, name, phone, email, service, province, status")
          .or(orFilter)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select(
            "id, created_at, name, phone, email, service, district, preferred_date, preferred_time, status"
          )
          .or(orFilter)
          .order("created_at", { ascending: false }),
      ]);
      enquiries = enq.data ?? [];
      bookings = bk.data ?? [];
    }

    return Response.json({ client, enquiries, bookings });
  }

  let query = supabase
    .from("clients")
    .select("*")
    .order("updated_at", { ascending: false });

  if (q) {
    // Double-quote each value so PostgREST treats parentheses, commas and
    // other reserved characters as literals inside the ILIKE pattern
    // (otherwise they break — or could inject into — the or() group).
    const safe = q.replace(/["(),\\]/g, " ").trim();
    if (safe) {
      query = query.or(
        `name.ilike."%${safe}%",phone.ilike."%${safe}%",email.ilike."%${safe}%"`
      );
    }
  }

  const { data, error } = await query.limit(500);
  if (error) {
    console.error("clients list failed:", error);
    return Response.json(
      { error: "Could not load clients. Have you run 006_clients.sql?" },
      { status: 500 }
    );
  }
  return Response.json({ clients: data });
}

/* POST — manually add a client: { name, phone?, email?, district?, notes? } */
export async function POST(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }

  const key = phoneKey(body.phone);
  if (key) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("phone_key", key)
      .maybeSingle();
    if (existing) {
      return Response.json(
        { error: "A client with this phone number already exists." },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase.from("clients").insert({
    name: body.name.trim(),
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    district: body.district?.trim() || null,
    province: body.province?.trim() || null,
    notes: body.notes?.trim() || null,
    first_source: "manual",
    last_source: "manual",
    interactions: 1,
    phone_key: key,
  });

  if (error) {
    console.error("client create failed:", error);
    return Response.json({ error: "Could not create client." }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 201 });
}

/* PATCH — edit a client: { id, name?, phone?, email?, district?, province?, notes? } */
export async function PATCH(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!String(body.name).trim()) {
      return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    update.name = String(body.name).trim();
  }
  if (body.phone !== undefined) {
    update.phone = body.phone?.trim() || null;
    update.phone_key = phoneKey(body.phone);
  }
  if (body.email !== undefined) update.email = body.email?.trim() || null;
  if (body.district !== undefined) update.district = body.district?.trim() || null;
  if (body.province !== undefined) update.province = body.province?.trim() || null;
  if (body.notes !== undefined) update.notes = body.notes?.trim() || null;

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("clients")
    .update(update)
    .eq("id", body.id);

  if (error) {
    console.error("client update failed:", error);
    // 23505 = unique_violation on phone_key
    if ((error as { code?: string }).code === "23505") {
      return Response.json(
        { error: "Another client already uses this phone number." },
        { status: 409 }
      );
    }
    return Response.json({ error: "Could not update client." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) {
    console.error("client delete failed:", error);
    return Response.json({ error: "Could not delete client." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
