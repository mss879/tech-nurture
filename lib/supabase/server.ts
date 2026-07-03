import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Server-side Supabase client.
   Prefers the service-role key (full access, bypasses RLS) and falls
   back to the anon key so public inserts still work if only that is set.
   Returns null when the env vars haven't been filled in yet — API routes
   turn that into a clear 503 instead of crashing. */
export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const NOT_CONFIGURED_ERROR =
  "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to technature-web/.env.local and restart the dev server.";

export function notConfigured() {
  return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 503 });
}
