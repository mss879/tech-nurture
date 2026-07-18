import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/* Auth gate for the admin dashboard (Next.js 16 `proxy` convention —
   the renamed, Node.js-runtime successor to `middleware`).
   Protects every /admin/* page (except the login screen) and every
   /api/admin/* route: unauthenticated requests are redirected to the
   login page (for pages) or answered with 401 JSON (for API calls).
   A single gate here means current AND future admin routes are covered
   without touching each handler. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, configured } = await updateSession(request);

  // Before Supabase keys are added, let requests through so the app can
  // render its "connect Supabase" states instead of trapping the user.
  if (!configured) return response;

  // updateSession may have refreshed the auth cookies onto `response`.
  // Any new response we return instead MUST carry those Set-Cookie headers,
  // or the refreshed session is lost (per the @supabase/ssr contract).
  const withCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const isLogin = pathname === "/admin/login";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  // Already signed in and visiting the login page → send to the dashboard.
  if (isLogin && user) {
    return withCookies(NextResponse.redirect(new URL("/admin", request.url)));
  }

  if (isLogin) return response;

  if (!user && isAdminApi) {
    return withCookies(
      NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    );
  }

  if (!user && isAdminPage) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withCookies(NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  // Explicit "/admin" as well as "/admin/:path*" so the dashboard root is
  // gated regardless of how the zero-segment case is matched.
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
