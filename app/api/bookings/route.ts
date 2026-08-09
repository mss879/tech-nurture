import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { bookingServices, bookingTimeSlots, districts } from "@/lib/site";

/* Public endpoint — a customer books a service through /book.
   The service-role client inserts the booking (anon INSERT is also
   allowed by RLS). Reads/updates happen in the admin. */

const LIMITS = { name: 120, phone: 40, email: 160, address: 500, message: 2000 } as const;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/* service, district and time are pick-lists on the form, so they should be
   pick-lists here too — otherwise anyone posting straight at the endpoint
   can write arbitrary text into the admin's booking table. Same
   case-insensitive allow-list match the chat agent's tools already use. */
function matchOption(value: unknown, options: readonly string[]): string | null {
  const v = String(value ?? "").trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === v) ?? null;
}
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

  const name = clip(body.name, LIMITS.name);
  const phone = clip(body.phone, LIMITS.phone);
  const service = matchOption(body.service, bookingServices);
  const district = matchOption(body.district, districts);
  const preferredTime = matchOption(body.preferred_time, bookingTimeSlots);

  if (!name || !phone || !body.preferred_date) {
    return Response.json(
      { error: "Name, phone, service, district, date and time are required." },
      { status: 400 }
    );
  }
  if (!service || !district || !preferredTime) {
    return Response.json(
      { error: "Please choose a service, district and time from the list." },
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
    name,
    phone,
    email: clip(body.email, LIMITS.email),
    service,
    district,
    preferred_date: preferred,
    preferred_time: preferredTime,
    address: clip(body.address, LIMITS.address),
    message: clip(body.message, LIMITS.message),
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
