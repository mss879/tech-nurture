import type { Metadata } from "next";
import UsersView from "@/components/admin/UsersView";
import { requirePageSuperAdmin } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Users & Access" };

export default async function AdminUsersPage() {
  await requirePageSuperAdmin();
  return <UsersView />;
}
