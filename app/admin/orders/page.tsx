import type { Metadata } from "next";
import OrdersView from "@/components/admin/OrdersView";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return <OrdersView />;
}
