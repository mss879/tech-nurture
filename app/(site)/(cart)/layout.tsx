import { CartProvider } from "@/components/shop/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";
import FloatingBasket from "@/components/shop/FloatingBasket";

/* The basket lives only on the buying routes: the CartProvider, drawer and
   floating button are all mounted here rather than in the global layout, so
   /products/* and /checkout share one cart context. The (cart) group is
   invisible in the URL — it exists purely to hang this layout on. */
export default function CartLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      {children}
      <FloatingBasket />
      <CartDrawer />
    </CartProvider>
  );
}
