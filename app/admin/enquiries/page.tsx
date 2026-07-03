import type { Metadata } from "next";
import EnquiriesView from "@/components/admin/EnquiriesView";

export const metadata: Metadata = { title: "Enquiries" };

export default function AdminEnquiriesPage() {
  return <EnquiriesView />;
}
