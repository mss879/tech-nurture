import {
  LayoutDashboard,
  MessageSquare,
  Headset,
  CalendarCheck,
  Package,
  ShoppingBag,
  KanbanSquare,
  Users,
  Newspaper,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import type { NavKey } from "@/lib/admin/types";

/* Kept out of lib/admin/nav.ts so that module stays free of React and
   lucide-react, and can be imported by server layouts and route handlers. */
export const NAV_ICONS: Record<NavKey, React.ElementType> = {
  dashboard: LayoutDashboard,
  todos: ListChecks,
  enquiries: MessageSquare,
  chats: Headset,
  bookings: CalendarCheck,
  orders: Package,
  products: ShoppingBag,
  crm: KanbanSquare,
  clients: Users,
  blog: Newspaper,
  users: ShieldCheck,
};
