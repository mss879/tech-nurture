import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Service-role Supabase client — the only client that can call the
   auth.admin.* APIs (creating a user, resetting a password, deleting an
   account).

   Unlike getServerSupabase() in server.ts, this deliberately does NOT
   fall back to the anon key: with the anon key auth.admin.createUser
   fails with an opaque 403, so it's far clearer to return null and let
   the route explain which key is missing. */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function serviceKeyMissing() {
  return Response.json(
    {
      error:
        "Managing users needs the Supabase service-role key. Add SUPABASE_SERVICE_ROLE_KEY to technature-web/.env.local and restart the server.",
    },
    { status: 503 }
  );
}
