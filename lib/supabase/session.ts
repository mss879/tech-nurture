import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* Refreshes the Supabase auth session on each request and returns the
   authenticated user together with a response carrying any updated
   session cookies. The root middleware.ts uses this to gate /admin.

   Follows the official @supabase/ssr Next.js pattern: never run code
   between createServerClient and getUser, and always return the
   supabaseResponse so refreshed cookies are persisted. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured yet — let the request through; pages/APIs show their
  // own "connect Supabase" state, and the login page explains setup.
  if (!url || !key) {
    return { response: supabaseResponse, user: null, configured: false };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user, configured: true };
}
