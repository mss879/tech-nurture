import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSchema } from "./db";

/* Event notifications — "a lead was assigned to you", "a to-do was
   assigned to you". Written at the moment the thing happens, because an
   assignment is a discrete fact rather than something derivable later.

   Due-date reminders are NOT stored: they're computed from the todos
   table by the todo_reminders view, so editing a due date can't leave a
   stale "due tomorrow" behind. See 016_todos.sql. */

export type NotificationRow = {
  user_id: string;
  kind: "todo_assigned" | "lead_assigned";
  title: string;
  body?: string | null;
  href?: string | null;
  todo_id?: string | null;
  lead_id?: string | null;
};



export async function notify(
  supabase: SupabaseClient,
  rows: NotificationRow[]
) {
  const wanted = rows.filter((r) => r.user_id);
  if (wanted.length === 0) return;

  const { error } = await supabase.from("notifications").insert(wanted);
  // Before 016 there is nowhere to write to, which must never fail the
  // action the person actually asked for.
  if (error && !isMissingSchema(error)) {
    console.error("notification insert failed:", error);
  }
}
