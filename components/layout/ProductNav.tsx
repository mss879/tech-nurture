"use client";

import { createContext, useContext } from "react";

/* The header's Products menu is a drop-down of the actual published
   products — there is no product index page to send people to first.

   The list is read from Supabase in app/(site)/layout.tsx (a server
   component) and handed down through this context, because Header renders
   in two places: the global floating header, and the embedded one inside
   the client-side Hero. Context reaches both without prop-drilling
   through Hero. */

export type ProductNavItem = { label: string; href: string };

const ProductNavContext = createContext<ProductNavItem[]>([]);

export function ProductNavProvider({
  items,
  children,
}: {
  items: ProductNavItem[];
  children: React.ReactNode;
}) {
  return (
    <ProductNavContext.Provider value={items}>
      {children}
    </ProductNavContext.Provider>
  );
}

export function useProductNav() {
  return useContext(ProductNavContext);
}
