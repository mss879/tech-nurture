import { CartProvider } from "@/components/shop/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";
import FloatingBasket from "@/components/shop/FloatingBasket";

/* The basket lives only inside the shop section: the CartProvider, drawer and
   floating button are all mounted here rather than in the global layout, so
   every shop route (browse, product, checkout) shares one cart context. */
export default function ShopLayout({
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
