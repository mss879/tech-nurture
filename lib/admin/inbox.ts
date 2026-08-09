import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSchema } from "./db";
import type { NotificationKind } from "./notify";

/* The bell's contents for one person, assembled from two sources:

   * event notifications — rows written when something was assigned;
   * due-date reminders  — derived live from the todo_reminders view, and
     hidden only while a matching dismissal exists.

   Reminders are never stored, which is what makes editing a due date, or
   completing a to-do, correct with no cleanup: the row simply stops being
   produced. See 016_todos.sql. */

export type InboxItem = {
  id: string;
  kind: NotificationKind | "todo_due";
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string | null;
  unread: boolean;
  /* Present on reminders — what a dismissal needs to identify it. */
  reminder?: { todoId: string; dueDate: string; bucket: Bucket };
};

type Bucket = "overdue" | "today" | "tomorrow";



const BUCKET_ORDER: Record<Bucket, number> = {
  overdue: 0,
  today: 1,
  tomorrow: 2,
};

function reminderTitle(bucket: Bucket, title: string) {
  if (bucket === "overdue") return `Overdue: ${title}`;
  if (bucket === "today") return `Due today: ${title}`;
  return `Due tomorrow: ${title}`;
}

export async function loadInbox(supabase: SupabaseClient, userId: string) {
  const [events, reminders, dismissals] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, created_at, kind, title, body, href, read_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("todo_reminders")
      .select("todo_id, title, priority, due_date, bucket")
      .eq("user_id", userId),
    supabase
      .from("notification_dismissals")
      .select("todo_id, due_date, bucket")
      .eq("user_id", userId),
  ]);

  for (const res of [events, reminders, dismissals]) {
    // Before 016 there is nothing to read; an empty bell beats a broken page.
    if (res.error && !isMissingSchema(res.error)) {
      console.error("inbox load failed:", res.error);
    }
  }

  /* The key is the reminder's CONTENT — person, to-do, the due date as it
     stands, and which bucket it falls in. So dismissing "due tomorrow"
     keeps it quiet only while it is still tomorrow: once the bucket turns
     into 'today' nothing matches, and it comes back as new. */
  const dismissed = new Set(
    (dismissals.data ?? []).map(
      (d) => `${d.todo_id}|${d.due_date}|${d.bucket}`
    )
  );

  const reminderItems: InboxItem[] = (reminders.data ?? [])
    .filter((r) => !dismissed.has(`${r.todo_id}|${r.due_date}|${r.bucket}`))
    .sort(
      (a, b) =>
        BUCKET_ORDER[a.bucket as Bucket] - BUCKET_ORDER[b.bucket as Bucket]
    )
    .map((r) => ({
      id: `r:${r.todo_id}:${r.due_date}:${r.bucket}`,
      kind: "todo_due" as const,
      title: reminderTitle(r.bucket as Bucket, r.title),
      body: null,
      href: "/admin/todos",
      createdAt: null,
      unread: true,
      reminder: {
        todoId: r.todo_id,
        dueDate: r.due_date,
        bucket: r.bucket as Bucket,
      },
    }));

  const eventItems: InboxItem[] = (events.data ?? []).map((e) => ({
    id: `n:${e.id}`,
    kind: e.kind,
    title: e.title,
    body: e.body ?? null,
    href: e.href ?? null,
    createdAt: e.created_at,
    unread: !e.read_at,
  }));

  const items = [...reminderItems, ...eventItems];
  const unread = items.filter((i) => i.unread).length;

  return { items, unread, dueCount: reminderItems.length };
}
