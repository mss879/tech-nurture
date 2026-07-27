"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";

export default function FloatingBasket() {
  const { count, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      aria-label={`Open basket (${count} items)`}
      className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 rounded-full bg-ink px-5 py-3.5 text-mist shadow-xl shadow-black/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
    >
      <ShoppingBag className="size-5 text-lime" />
      <span className="text-sm font-semibold">Basket</span>
      {count > 0 && (
        <span className="grid min-w-6 place-items-center rounded-full bg-lime px-1.5 py-0.5 text-xs font-bold text-ink">
          {count}
        </span>
      )}
    </button>
  );
}
