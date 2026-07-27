import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav } from "@/lib/admin/permissions";

export async function GET() {
  const gate = await requireNav("dashboard");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const [stats, recentEnquiries, recentBookings] = await Promise.all([
    supabase.from("dashboard_stats").select("*").single(),
    supabase
      .from("enquiries")
      .select("id, created_at, name, phone, service, status")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("bookings")
      .select(
        "id, created_at, name, service, district, preferred_date, preferred_time, status"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (stats.error) {
    console.error("dashboard_stats failed:", stats.error);
    return Response.json(
      {
        error:
          "Could not load dashboard stats. Have you run the migrations in supabase/migrations (up to 010_dashboard.sql)?",
      },
      { status: 500 }
    );
  }

  return Response.json({
    stats: stats.data,
    recentEnquiries: recentEnquiries.data ?? [],
    recentBookings: recentBookings.data ?? [],
  });
}
