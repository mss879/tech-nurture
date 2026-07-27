import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireAdmin, actorId } from "@/lib/admin/permissions";
import { canAccessNav } from "@/lib/admin/nav";
import { loadInbox } from "@/lib/admin/inbox";

/* GET — every count the sidebar and the bell show, in one request, so a
   second badge doesn't mean a second poll. Replaces
   /api/admin/chats?count=pending.

   Each count is permission-scoped: someone without Live Chat access never
   learns how many conversations are waiting. */
export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const counts: Record<string, number> = {};

  if (canAccessNav(me, "chats")) {
    // open conversations where a visitor asked for a human
    const { count } = await supabase
      .from("chat_sessions")
      .select("session_id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("mode", "ai")
      .not("handoff_requested_at", "is", null);
    counts.chatsPending = count ?? 0;
  }

  const id = actorId(me);
  if (id) {
    const { unread, dueCount } = await loadInbox(supabase, id);
    counts.notificationsUnread = unread;
    if (canAccessNav(me, "todos")) counts.todosDue = dueCount;
  }

  return Response.json(counts);
}
