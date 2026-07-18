import { getServerSupabase } from "@/lib/supabase/server";

/* Public endpoint — records an anonymous page view for the site
   analytics on the admin dashboard. Visitor location comes from the
   hosting platform's geo headers (Vercel / Cloudflare); no third-party
   trackers and no IP is ever stored. */

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram|preview|lighthouse|headless|monitor|pingdom|uptime/i;

function deviceFromUA(ua: string): string {
  if (/ipad|tablet|kindle|playbook|silk/i.test(ua)) return "tablet";
  if (/mobi|iphone|android.*mobile|phone/i.test(ua)) return "mobile";
  return "desktop";
}

function decode(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v) || null;
  } catch {
    return v || null;
  }
}

export async function POST(request: Request) {
  const supabase = getServerSupabase();
  // Not configured yet — quietly no-op so the client tracker stays silent.
  if (!supabase) return new Response(null, { status: 204 });

  let body: {
    visitorId?: string;
    sessionId?: string;
    path?: string;
    referrer?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const path = body.path?.slice(0, 512);
  const visitorId = body.visitorId?.slice(0, 64);
  if (!path || !visitorId) return new Response(null, { status: 204 });

  const h = request.headers;
  const ua = h.get("user-agent") || "";
  // Ignore known bots and crawlers so numbers reflect real people.
  if (BOT_RE.test(ua)) return new Response(null, { status: 204 });

  const country =
    h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || null;
  const region =
    decode(h.get("x-vercel-ip-country-region")) ||
    h.get("cf-region-code") ||
    null;
  const city = decode(h.get("x-vercel-ip-city")) || h.get("cf-ipcity") || null;

  const { error } = await supabase.from("page_views").insert({
    visitor_id: visitorId,
    session_id: body.sessionId?.slice(0, 64) || null,
    path,
    referrer: body.referrer?.slice(0, 512) || null,
    country,
    region,
    city,
    device: deviceFromUA(ua),
    user_agent: ua.slice(0, 512) || null,
  });

  if (error) {
    // Analytics is best-effort — never surface an error to the visitor.
    console.error("page_view insert failed:", error);
    return new Response(null, { status: 204 });
  }
  return Response.json({ ok: true });
}
