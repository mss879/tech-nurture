import type { Metadata } from "next";
import NoAccessView from "@/components/admin/NoAccessView";

export const metadata: Metadata = { title: "No access" };

/* Deliberately OUTSIDE the (shell) route group: this is where someone is
   sent when they have no profile, so it must render without one. */
export default function AdminNoAccessPage() {
  return <NoAccessView />;
}
