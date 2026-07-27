import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · TechNurture Admin" },
  robots: { index: false, follow: false },
};

/* Metadata only. The sidebar/topbar shell lives in the (shell) route
   group, so /admin/login and /admin/no-access can render full-bleed
   without a profile. */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
