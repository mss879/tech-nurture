import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

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

  if (!body.name || !body.phone) {
    return Response.json(
      { error: "Name and phone number are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("enquiries").insert({
    name: body.name,
    phone: body.phone,
    email: body.email || null,
    service: body.service || null,
    province: body.province || null,
    message: body.message || null,
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
