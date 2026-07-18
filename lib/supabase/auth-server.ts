import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/* Server-side Supabase auth client, bound to the Next.js request cookies.
   Used by Server Components / Route Handlers to read the logged-in admin
   user. (Data access still uses the service-role client in server.ts.)

   In a Server Component the cookie store is read-only, so cookie writes
   from token refresh are swallowed — the middleware is what actually
   refreshes and persists the session cookies. */
export async function createServerAuthClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}

/* Returns the authenticated Supabase user, or null. Validates the token
   with the auth server (getUser), so it can't be spoofed from a cookie. */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createServerAuthClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/* Guard for admin API route handlers. Returns { user } when authenticated,
   or a ready-to-return 401 Response otherwise. The root middleware already
   blocks unauthenticated requests to /api/admin/*, so this is defence in
   depth for any route that wants to be certain. */
export async function requireAdmin(): Promise<
  { user: User } | { error: Response }
> {
  const user = await getAuthUser();
  if (!user) {
    return {
      error: Response.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }
  return { user };
}
