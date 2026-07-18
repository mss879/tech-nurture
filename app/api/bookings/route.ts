import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

/* Public endpoint — a customer books a service through /book.
   The service-role client inserts the booking (anon INSERT is also
   allowed by RLS). Reads/updates happen in the admin. */
export async function POST(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  let body: {
    name?: string;
    phone?: string;
    email?: string;
    service?: string;
    district?: string;
    preferred_date?: string;
    preferred_time?: string;
    address?: string;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const required = [
    ["name", body.name],
    ["phone", body.phone],
    ["service", body.service],
    ["district", body.district],
    ["preferred_date", body.preferred_date],
    ["preferred_time", body.preferred_time],
  ] as const;
  const missing = required.filter(([, v]) => !v || !String(v).trim());
  if (missing.length > 0) {
    return Response.json(
      { error: "Name, phone, service, district, date and time are required." },
      { status: 400 }
    );
  }

  // Date sanity: a real calendar date (reject rollovers like 2026-02-30) that
  // isn't in the past, compared in Sri Lanka local time (UTC+5:30).
  const preferred = String(body.preferred_date).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(preferred);
  const date = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(NaN);
  const isRealDate =
    !!m &&
    date.getUTCFullYear() === +m[1] &&
    date.getUTCMonth() === +m[2] - 1 &&
    date.getUTCDate() === +m[3];
  if (!isRealDate) {
    return Response.json({ error: "Please choose a valid date." }, { status: 400 });
  }
  const lkNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayLK = Date.UTC(
    lkNow.getUTCFullYear(),
    lkNow.getUTCMonth(),
    lkNow.getUTCDate()
  );
  if (date.getTime() < todayLK) {
    return Response.json(
      { error: "Please choose a date that isn't in the past." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("bookings").insert({
    name: body.name!.trim(),
    phone: body.phone!.trim(),
    email: body.email?.trim() || null,
    service: body.service,
    district: body.district,
    preferred_date: body.preferred_date,
    preferred_time: body.preferred_time,
    address: body.address?.trim() || null,
    message: body.message?.trim() || null,
  });

  if (error) {
    console.error("bookings insert failed:", error);
    return Response.json(
      { error: "Could not submit your booking. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true }, { status: 201 });
}
