import type { SupabaseClient } from "@supabase/supabase-js";
import type { VisibleIds } from "./departments";

/* Turning whatever the browser sent into a clean set of people on a to-do.

   Two rules, both load-bearing:
     · Assignee beats mention. Being on the hook already implies seeing
       it, so nobody is ever in both lists — which is what makes the
       (todo_id, user_id) primary key in 023 satisfiable at all.
     · Nothing is trusted. Ids are checked against real, active profiles
       the caller is allowed to name before they reach the database,
       because a stale id would otherwise surface as a raw foreign-key
       violation dressed up as a 500. */

export type Participants = { assignees: string[]; mentions: string[] };

function idList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(value.filter((v): v is string => typeof v === "string" && !!v)),
  ];
}

export function normalise(rawAssignees: unknown, rawMentions: unknown): Participants {
  const assignees = idList(rawAssignees);
  const taken = new Set(assignees);
  return { assignees, mentions: idList(rawMentions).filter((id) => !taken.has(id)) };
}

/* Keep only the ids that are real, active, and inside `allowed`
   (null meaning no restriction — the super admin). Order is preserved so
   the first assignee stays the first assignee. */
export async function resolvePeople(
  supabase: SupabaseClient,
  ids: string[],
  allowed: VisibleIds
): Promise<string[]> {
  if (ids.length === 0) return [];

  const query = supabase
    .from("admin_users")
    .select("id")
    .in("id", ids)
    .eq("is_active", true);

  if (allowed) query.in("id", allowed);

  const { data, error } = await query;
  if (error) {
    console.error("participant lookup failed:", error);
    return [];
  }

  const real = new Set((data ?? []).map((r) => r.id as string));
  return ids.filter((id) => real.has(id));
}

/* Whether anything the caller asked for was quietly dropped. Worth a 403
   rather than silent truncation: "I assigned it to Nimal and he never got
   it" is a much worse bug than an error message. */
export function droppedAny(requested: string[], resolved: string[]) {
  return requested.length !== resolved.length;
}

export type ParticipantRow = {
  todo_id: string;
  user_id: string;
  kind: "assignee" | "mention";
  added_by: string | null;
};

export function participantRows(
  todoId: string,
  people: Participants,
  actor: string | null
): ParticipantRow[] {
  return [
    ...people.assignees.map((user_id) => ({
      todo_id: todoId,
      user_id,
      kind: "assignee" as const,
      added_by: actor,
    })),
    ...people.mentions.map((user_id) => ({
      todo_id: todoId,
      user_id,
      kind: "mention" as const,
      added_by: actor,
    })),
  ];
}
