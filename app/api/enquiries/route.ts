import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

/* Every column here is `text`, which in Postgres has no length limit — so
   without a cap one POST can store as much as it likes, and this endpoint
   is public and unauthenticated. Trim to something a real enquiry fits
   inside rather than rejecting, so a long message is still delivered. */
const LIMITS = {
  name: 120,
  phone: 40,
  email: 160,
  service: 120,
  province: 80,
  message: 4000,
} as const;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  let body: {
    name?: string;
    phone?: string;
    email?: string;
    service?: string;
    province?: string;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = clip(body.name, LIMITS.name);
  const phone = clip(body.phone, LIMITS.phone);
  if (!name || !phone) {
    return Response.json(
      { error: "Name and phone number are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("enquiries").insert({
    name,
    phone,
    email: clip(body.email, LIMITS.email),
    service: clip(body.service, LIMITS.service),
    province: clip(body.province, LIMITS.province),
    message: clip(body.message, LIMITS.message),
  });

  if (error) {
    console.error("enquiries insert failed:", error);
    return Response.json(
      { error: "Could not send your enquiry. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true }, { status: 201 });
}
