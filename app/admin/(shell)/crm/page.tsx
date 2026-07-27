import type { Metadata } from "next";
import CrmView from "@/components/admin/CrmView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "CRM" };

export default async function AdminCrmPage() {
  await requirePageAccess("crm");
  return <CrmView />;
}
