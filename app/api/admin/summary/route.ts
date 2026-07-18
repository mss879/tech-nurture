import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const [stats, recentEnquiries] = await Promise.all([
    supabase.from("dashboard_stats").select("*").single(),
    supabase
      .from("enquiries")
      .select("id, created_at, name, phone, service, status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (stats.error) {
    console.error("dashboard_stats failed:", stats.error);
    return Response.json(
      {
        error:
          "Could not load dashboard stats. Have you run the migrations in supabase/migrations?",
      },
      { status: 500 }
    );
  }

  return Response.json({
    stats: stats.data,
    recentEnquiries: recentEnquiries.data ?? [],
  });
}
