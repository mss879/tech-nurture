import { createBrowserClient } from "@supabase/ssr";

/* Browser-side Supabase client for auth (login / logout on the admin).
   Uses only the public URL + anon key, and reads/writes the session
   from cookies via @supabase/ssr so the server middleware can see it.
   Data access still goes through the server API routes — this client
   is used purely for authentication. */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }
  return createBrowserClient(url, key);
}

/* True when the public Supabase env vars are present, so the login
   screen can show a helpful "not configured yet" message instead of
   throwing when the keys are missing. */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
