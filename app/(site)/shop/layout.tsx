import CartDrawer from "@/components/shop/CartDrawer";
import FloatingBasket from "@/components/shop/FloatingBasket";

/* The basket lives only inside the shop section: drawer + floating button
   are mounted here rather than in the global layout. */
export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <FloatingBasket />
      <CartDrawer />
    </>
  );
}
