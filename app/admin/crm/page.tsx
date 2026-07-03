import type { Metadata } from "next";
import CrmView from "@/components/admin/CrmView";

export const metadata: Metadata = { title: "CRM" };

export default function AdminCrmPage() {
  return <CrmView />;
}
