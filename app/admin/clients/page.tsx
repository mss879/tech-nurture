import type { Metadata } from "next";
import ClientsView from "@/components/admin/ClientsView";

export const metadata: Metadata = { title: "Clients" };

export default function AdminClientsPage() {
  return <ClientsView />;
}
