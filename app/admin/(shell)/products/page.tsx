import type { Metadata } from "next";
import ProductsView from "@/components/admin/ProductsView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requirePageAccess("products");
  return <ProductsView />;
}
