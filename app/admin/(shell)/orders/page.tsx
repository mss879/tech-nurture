import type { Metadata } from "next";
import OrdersView from "@/components/admin/OrdersView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requirePageAccess("orders");
  return <OrdersView />;
}
