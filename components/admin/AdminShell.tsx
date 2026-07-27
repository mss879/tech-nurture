"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { AdminMeProvider } from "@/components/admin/MeProvider";
import { ToastProvider } from "@/components/admin/ui";
import type { AdminProfile } from "@/lib/admin/types";

/* Sidebar + topbar + content, for every admin route inside the (shell)
   route group. The login and no-access screens sit outside the group and
   render full-bleed without this. */
export default function AdminShell({
  me,
  children,
}: {
  me: AdminProfile;
  children: React.ReactNode;
}) {
  return (
    <AdminMeProvider me={me}>
      <ToastProvider>
        <div className="flex min-h-screen bg-slate-100 text-slate-800">
          <AdminSidebar me={me} />
          <div className="flex min-w-0 flex-1 flex-col pt-[57px] lg:pt-0">
            <AdminTopbar me={me} />
            <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AdminMeProvider>
  );
}
