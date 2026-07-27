import type { Metadata } from "next";
import ClientsView from "@/components/admin/ClientsView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  await requirePageAccess("clients");
  return <ClientsView />;
}
