import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/admin/permissions";

/* Every admin route except the login and no-access screens, which sit
   outside this group so they can render without a profile.

   This layout READS the profile, so the sidebar and topbar can show who
   you are and which menu items exist. It is deliberately not the security
   boundary: layouts don't re-render on client-side navigation, so the
   check would be skipped on every route change after the first. Each page
   calls requirePageAccess() and each API route calls requireNav().
   (Next's authentication guide, "Layouts and auth checks".) */
export default async function AdminShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const me = await getCurrentAdmin();

  // Signed in (the proxy saw a session) but no active profile — someone
  // added in the Supabase dashboard, or an account that's been switched off.
  if (!me) redirect("/admin/no-access");

  return <AdminShell me={me}>{children}</AdminShell>;
}
