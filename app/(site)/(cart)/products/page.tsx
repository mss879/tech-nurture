import { redirect } from "next/navigation";
import { getProducts } from "@/lib/products.server";

// Same cadence as the rest of the CMS-driven pages.
export const revalidate = 60;

/* There is no product index page by design — the header's Products menu
   drops down the published products and links straight to each one.

   This route stays alive only as a landing pad: the menu's own parent link,
   old /shop links and any bookmark all resolve here and get sent on to a
   real product page (or to contact, if nothing is published yet). */
export default async function ProductsIndex() {
  const products = await getProducts();
  redirect(products[0] ? `/products/${products[0].slug}` : "/contact");
}
