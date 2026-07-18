"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

/* Wraps the admin area. The login screen renders full-bleed (no sidebar);
   every other admin route gets the sidebar + content shell. */
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col pt-[57px] lg:pt-0">
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
