import { isSuperAdmin, type AdminProfile, type NavKey } from "./types";

/* The admin menu, as plain data.

   Icons live in components/admin/navIcons.ts instead of here, so this
   module stays importable from server layouts and route handlers without
   dragging lucide-react (and "use client") along with it. */

export type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  /* Hidden from everyone but a super admin, and never offered as a
     tickable permission. */
  superAdminOnly?: boolean;
  /* Which count from /api/admin/badges to show as a pill. */
  badgeKey?: "chatsPending" | "todosDue";
};

export const NAV_ITEMS: NavItem[] = [
  // Dashboard is company-wide revenue, order value and client totals, so it
  // is not something to hand out per-user.
  { key: "dashboard", label: "Dashboard", href: "/admin", superAdminOnly: true },
  { key: "todos", label: "To-dos", href: "/admin/todos", badgeKey: "todosDue" },
  { key: "enquiries", label: "Inquiries", href: "/admin/enquiries" },
  { key: "chats", label: "Live Chat", href: "/admin/chats", badgeKey: "chatsPending" },
  { key: "bookings", label: "Services Booking", href: "/admin/bookings" },
  { key: "orders", label: "Orders", href: "/admin/orders" },
  { key: "products", label: "Products", href: "/admin/products" },
  { key: "crm", label: "CRM", href: "/admin/crm" },
  { key: "clients", label: "Clients", href: "/admin/clients" },
  { key: "blog", label: "Blog", href: "/admin/blog" },
  {
    key: "users",
    label: "Users & Access",
    href: "/admin/users",
    superAdminOnly: true,
  },
];

/* Menu items a super admin can grant, in the order the permission form
   shows them. */
export function grantableNavItems() {
  return NAV_ITEMS.filter((item) => !item.superAdminOnly);
}

/* Super admins bypass nav_access entirely, so a malformed array can never
   lock one out of their own dashboard. Everyone else needs the key in
   their list — and can never reach a super-admin-only item, whatever the
   list happens to contain. */
export function canAccessNav(me: AdminProfile, key: NavKey) {
  if (isSuperAdmin(me)) return true;
  if (NAV_ITEMS.find((item) => item.key === key)?.superAdminOnly) return false;
  return me.nav_access.includes(key);
}

export function navItemsFor(me: AdminProfile) {
  return NAV_ITEMS.filter((item) => canAccessNav(me, item.key));
}

/* Which menu item owns a pathname. Longest href wins so that, say,
   /admin/crm never resolves to the /admin dashboard. */
export function navKeyForPath(pathname: string): NavKey | null {
  if (pathname === "/admin") return "dashboard";
  let match: NavItem | null = null;
  for (const item of NAV_ITEMS) {
    if (item.href === "/admin") continue;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!match || item.href.length > match.href.length) match = item;
    }
  }
  return match?.key ?? null;
}

/* Where to send someone who lands on /admin without dashboard access.
   Falls back to the no-access screen rather than looping. */
export function landingPathFor(me: AdminProfile) {
  return navItemsFor(me)[0]?.href ?? "/admin/no-access";
}
