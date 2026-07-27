import type { Metadata } from "next";
import EnquiriesView from "@/components/admin/EnquiriesView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage() {
  await requirePageAccess("enquiries");
  return <EnquiriesView />;
}
