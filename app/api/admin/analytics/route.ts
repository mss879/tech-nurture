import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

/* Aggregated site analytics for the admin dashboard, read from the
   reporting views defined in 008_analytics.sql. */
export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const [overview, byRegion, byCity, byHour, byDay, topPaths] =
    await Promise.all([
      supabase.from("analytics_overview").select("*").maybeSingle(),
      supabase.from("analytics_by_region").select("*").limit(8),
      supabase.from("analytics_by_city").select("*").limit(8),
      supabase.from("analytics_by_hour").select("*"),
      supabase.from("analytics_by_day").select("*"),
      supabase.from("analytics_top_paths").select("*").limit(8),
    ]);

  if (overview.error) {
    console.error("analytics failed:", overview.error);
    return Response.json(
      { error: "Could not load analytics. Have you run 008_analytics.sql?" },
      { status: 500 }
    );
  }

  // Fill every hour 0–23 so the bar chart has a complete axis.
  const hourMap = new Map<number, number>(
    (byHour.data ?? []).map((r) => [r.hour as number, r.views as number])
  );
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    views: hourMap.get(h) ?? 0,
  }));

  return Response.json({
    overview: overview.data ?? {
      total_views: 0,
      unique_visitors: 0,
      views_7d: 0,
      unique_7d: 0,
      views_24h: 0,
    },
    byRegion: byRegion.data ?? [],
    byCity: byCity.data ?? [],
    byHour: hours,
    byDay: byDay.data ?? [],
    topPaths: topPaths.data ?? [],
  });
}
