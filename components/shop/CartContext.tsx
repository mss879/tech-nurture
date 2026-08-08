"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export type CartItem = {
  id: string; // `${slug}:${model}`
  slug: string;
  name: string;
  model: string;
  // Free text: the admin types this per model, so it isn't limited to
  // UF/RO any more.
  /* The variant's distinguishing label — "RO", "UF", "1.5 Ton". Named
     `filtration` because it maps straight onto the order_items column of
     that name, which holds live order history and so keeps its name; the
     catalogue field it comes from is Variant.optionLabel. */
  filtration: string;
  category: string;
  image: string;
  price: number; // LKR
  plusVat: boolean;
  qty: number;
};

type State = { items: CartItem[]; open: boolean };
type Action =
  | { type: "add"; item: Omit<CartItem, "qty"> }
  | { type: "remove"; id: string }
  | { type: "qty"; id: string; qty: number }
  | { type: "clear" }
  | { type: "open" }
  | { type: "close" }
  | { type: "toggle" }
  | { type: "hydrate"; items: CartItem[] };

const KEY = "technurture-cart-v2";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const existing = state.items.find((i) => i.id === action.item.id);
      const items = existing
        ? state.items.map((i) =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          )
        : [...state.items, { ...action.item, qty: 1 }];
      return { items, open: true };
    }
    case "remove":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "qty":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.id === action.id ? { ...i, qty: Math.max(0, action.qty) } : i
          )
          .filter((i) => i.qty > 0),
      };
    case "clear":
      return { ...state, items: [] };
    case "open":
      return { ...state, open: true };
    case "close":
      return { ...state, open: false };
    case "toggle":
      return { ...state, open: !state.open };
    case "hydrate":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

const CartCtx = createContext<{
  items: CartItem[];
  open: boolean;
  count: number;
  subtotal: number;
  hasVatItems: boolean;
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      open: state.open,
      count: state.items.reduce((n, i) => n + i.qty, 0),
      subtotal: state.items.reduce((n, i) => n + i.price * i.qty, 0),
      hasVatItems: state.items.some((i) => i.plusVat),
      add: (item: Omit<CartItem, "qty">) => dispatch({ type: "add", item }),
      remove: (id: string) => dispatch({ type: "remove", id }),
      setQty: (id: string, qty: number) => dispatch({ type: "qty", id, qty }),
      clear: () => dispatch({ type: "clear" }),
      openCart: () => dispatch({ type: "open" }),
      closeCart: () => dispatch({ type: "close" }),
      toggleCart: () => dispatch({ type: "toggle" }),
    }),
    [state]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
