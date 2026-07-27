import type { Metadata } from "next";
import DashboardView from "@/components/admin/DashboardView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  // Company-wide revenue and totals, so this is super-admin only — anyone
  // else landing on /admin is sent to their own first menu item.
  await requirePageAccess("dashboard");
  return <DashboardView />;
}
