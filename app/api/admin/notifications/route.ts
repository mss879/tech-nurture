import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireAdmin, actorId } from "@/lib/admin/permissions";
import { loadInbox } from "@/lib/admin/inbox";

/* The notification bell. Assignments are stored rows; due-date reminders
   are computed live — see lib/admin/inbox.ts and 016_todos.sql. */

/* GET — everything in this person's bell, newest and most urgent first. */
export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = actorId(me);
  if (!id) return Response.json({ items: [], unread: 0 });

  const { items, unread } = await loadInbox(supabase, id);
  return Response.json({ items, unread });
}

/* POST — dismiss a due-date reminder: { todoId, dueDate, bucket }.

   Recorded against the reminder's content rather than an id, so it stays
   dismissed only while it means the same thing. When the to-do rolls from
   "tomorrow" into "today", nothing matches and it returns as unread. */
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = actorId(me);
  if (!id) return Response.json({ ok: true });

  const body = await request.json().catch(() => null);
  if (!body?.todoId || !body?.dueDate || !body?.bucket) {
    return Response.json(
      { error: "todoId, dueDate and bucket are required." },
      { status: 400 }
    );
  }
  if (!["overdue", "today", "tomorrow"].includes(body.bucket)) {
    return Response.json({ error: "Unknown bucket." }, { status: 400 });
  }

  const { error } = await supabase.from("notification_dismissals").upsert(
    {
      user_id: id,
      todo_id: body.todoId,
      due_date: body.dueDate,
      bucket: body.bucket,
    },
    { onConflict: "user_id,todo_id,due_date,bucket" }
  );

  if (error) {
    console.error("reminder dismiss failed:", error);
    return Response.json(
      { error: "Could not dismiss that reminder." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}

/* PATCH — mark event notifications read: { id } or { all: true }. */
export async function PATCH(request: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = actorId(me);
  if (!id) return Response.json({ ok: true });

  const body = await request.json().catch(() => null);
  const query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", id)
    .is("read_at", null);

  if (!body?.all) {
    if (!body?.id) {
      return Response.json(
        { error: "id or all is required." },
        { status: 400 }
      );
    }
    // The client prefixes stored notifications with "n:".
    query.eq("id", String(body.id).replace(/^n:/, ""));
  }

  const { error } = await query;
  if (error) {
    console.error("notification read failed:", error);
    return Response.json(
      { error: "Could not update notifications." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
