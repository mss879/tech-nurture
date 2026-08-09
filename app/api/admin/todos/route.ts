import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, actorId } from "@/lib/admin/permissions";
import { isSuperAdmin, isOverseer, type AdminProfile } from "@/lib/admin/types";
import { canAccessNav } from "@/lib/admin/nav";
import {
  assignableUserIds,
  namableUserIds,
  visibleUserIds,
} from "@/lib/admin/departments";
import {
  LINK_SPECS,
  parseLinkRefs,
  type LinkRef,
} from "@/lib/admin/todoLinks";
import {
  normalise,
  resolvePeople,
  droppedAny,
  participantRows,
  type Participants,
} from "@/lib/admin/todoParticipants";
import { notify } from "@/lib/admin/notify";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "done"];

/* Which tab of the list you're asking for. Only a narrowing filter — the
   todos_for function in 023 decides what you may see at all, and even
   "all" is filtered through that, so no scope here can leak. */
const SCOPES = ["mine", "mentioned", "created", "department", "all"] as const;
type Scope = (typeof SCOPES)[number];

const MIGRATION_HINT =
  "Could not load to-dos. Have you run 023_todo_participants.sql?";

/* Who a to-do is for. Assignees are on the hook; mentions are looped in
   and can read it but not touch it. See 023 for why that split lives in
   one participants table. */
async function peopleFor(
  supabase: SupabaseClient,
  me: AdminProfile,
  rawAssignees: unknown,
  rawMentions: unknown
): Promise<Participants | { error: Response }> {
  const wanted = normalise(rawAssignees, rawMentions);

  const [assignable, namable] = await Promise.all([
    assignableUserIds(me),
    namableUserIds(me),
  ]);

  const [assignees, mentions] = await Promise.all([
    resolvePeople(supabase, wanted.assignees, assignable),
    resolvePeople(supabase, wanted.mentions, namable),
  ]);

  // Refuse rather than silently dropping someone: "I assigned it to Nimal
  // and he never got it" is a far worse bug than an error on screen.
  if (droppedAny(wanted.assignees, assignees)) {
    return {
      error: Response.json(
        { error: "You can only give a to-do to people in your own department." },
        { status: 403 }
      ),
    };
  }
  if (droppedAny(wanted.mentions, mentions)) {
    return {
      error: Response.json(
        { error: "You can only mention people in your own department." },
        { status: 403 }
      ),
    };
  }

  return { assignees, mentions };
}

/* Records a to-do points at. Same two gates the search route applies, so
   a crafted request can't attach something the caller couldn't have found
   in the picker: the kind's menu item, plus department scoping on leads,
   which are the only kind that belongs to a person. */
async function checkLinks(
  supabase: SupabaseClient,
  me: AdminProfile,
  refs: LinkRef[]
): Promise<{ error: Response } | null> {
  if (refs.length === 0) return null;

  const denied = refs.find((r) => !canAccessNav(me, LINK_SPECS[r.kind].nav));
  if (denied) {
    return {
      error: Response.json(
        { error: "You don't have access to that section." },
        { status: 403 }
      ),
    };
  }

  const leads = refs.filter((r) => r.kind === "lead");
  if (leads.length > 0) {
    const visible = await visibleUserIds(me);
    if (visible) {
      const { count } = await supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .in("id", leads.map((r) => r.id))
        .in("assigned_to", visible);
      if ((count ?? 0) !== leads.length) {
        return {
          error: Response.json(
            { error: "You can only link leads you can see." },
            { status: 403 }
          ),
        };
      }
    }
  }

  return null;
}

/* Replace a to-do's links wholesale. They carry no state of their own, so
   there's nothing to diff and nothing to notify about — unlike people. */
async function syncLinks(
  supabase: SupabaseClient,
  todoId: string,
  refs: LinkRef[]
): Promise<Response | null> {
  const { error: clearError } = await supabase
    .from("todo_links")
    .delete()
    .eq("todo_id", todoId);

  if (clearError) {
    console.error("todo links clear failed:", clearError);
    return Response.json(
      { error: "Could not update the linked records." },
      { status: 500 }
    );
  }

  if (refs.length === 0) return null;

  const rows = refs.map((r) => ({
    todo_id: todoId,
    [LINK_SPECS[r.kind].column]: r.id,
  }));

  const { error } = await supabase.from("todo_links").insert(rows);
  if (error) {
    console.error("todo links insert failed:", error);
    return Response.json(
      { error: "Could not save the linked records." },
      { status: 500 }
    );
  }
  return null;
}

type AccessRow = { can_see: boolean; can_edit: boolean; can_delete: boolean };

/* The single source of truth for "may I touch this one row", shared with
   the list query. No rows back means the to-do or the caller is gone —
   read that as denied. */
async function accessTo(
  supabase: SupabaseClient,
  todoId: string,
  viewer: string
): Promise<AccessRow> {
  const { data, error } = await supabase
    .rpc("todo_access", { p_todo: todoId, p_viewer: viewer })
    .maybeSingle<AccessRow>();

  if (error || !data) {
    if (error) console.error("todo_access failed:", error);
    return { can_see: false, can_edit: false, can_delete: false };
  }
  return data;
}

/* GET — the caller's to-dos.
   ?scope=mine (default) | mentioned | created | department | all
   "department" needs a head or the super admin, "all" the super admin. */
export async function GET(request: Request) {
  const gate = await requireNav("todos");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const requested = new URL(request.url).searchParams.get("scope") ?? "mine";
  let scope: Scope = (SCOPES as readonly string[]).includes(requested)
    ? (requested as Scope)
    : "mine";

  // Fall back rather than 403: an out-of-reach tab means a stale page, and
  // showing someone their own list is friendlier than an error. The
  // function would refuse to widen anyway.
  if (scope === "all" && !isSuperAdmin(me)) scope = "mine";
  if (scope === "department" && !isOverseer(me)) scope = "mine";

  const viewer = actorId(me);
  // The synthetic profile used before Supabase is configured has no row to
  // look itself up by.
  if (!viewer) return Response.json({ todos: [] });

  const { data, error } = await supabase.rpc("todos_for", {
    p_viewer: viewer,
    p_scope: scope,
  });

  if (error) {
    console.error("todos list failed:", error);
    return Response.json({ error: MIGRATION_HINT }, { status: 500 });
  }

  return Response.json({ todos: data ?? [] });
}

/* POST — { title, description?, priority?, dueDate?, assignedTo?: string[],
   mentions?: string[], links?: { kind, id }[] }
   Anyone can make themselves a to-do. A head can hand one to their own
   department, the super admin to anyone. */
export async function POST(request: Request) {
  const gate = await requireNav("todos");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return Response.json({ error: "A to-do needs a title." }, { status: 400 });
  }

  const actor = actorId(me);
  const resolved = await peopleFor(supabase, me, body?.assignedTo, body?.mentions);
  if ("error" in resolved) return resolved.error;

  const links = parseLinkRefs(body?.links);
  const linkCheck = await checkLinks(supabase, me, links);
  if (linkCheck) return linkCheck.error;

  // Nobody named means it's your own to-do, which is what the old single
  // picker did when you left it on "Nobody yet".
  const people: Participants = {
    assignees:
      resolved.assignees.length > 0
        ? resolved.assignees
        : actor
          ? [actor]
          : [],
    mentions: resolved.mentions.filter((id) => !resolved.assignees.includes(id)),
  };

  const { data: created, error } = await supabase
    .from("todos")
    .insert({
      title,
      description: body.description?.trim() || null,
      priority: PRIORITIES.includes(body.priority) ? body.priority : "medium",
      due_date: body.dueDate || null,
      created_by: actor,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("todo create failed:", error);
    return Response.json(
      { error: "Could not create the to-do." },
      { status: 500 }
    );
  }

  const rows = participantRows(created.id, people, actor);
  if (rows.length > 0) {
    const { error: peopleError } = await supabase
      .from("todo_participants")
      .upsert(rows, { onConflict: "todo_id,user_id" });

    if (peopleError) {
      // Compensate, the same way the user create does: a to-do with
      // nobody on it is invisible to everyone, including whoever just
      // made it.
      await supabase.from("todos").delete().eq("id", created.id);
      console.error("todo participants insert failed:", peopleError);
      return Response.json(
        { error: "Could not save who this to-do is for. Nothing was created." },
        { status: 500 }
      );
    }
  }

  if (links.length > 0) {
    const failed = await syncLinks(supabase, created.id, links);
    if (failed) {
      await supabase.from("todos").delete().eq("id", created.id);
      return failed;
    }
  }

  await notifyNew(supabase, me, created.id, title, people, actor, body.dueDate);

  return Response.json({ ok: true, id: created.id }, { status: 201 });
}

/* PATCH — { id, title?, description?, priority?, status?, dueDate?,
   assignedTo?: string[], mentions?: string[], links?: { kind, id }[] } */
export async function PATCH(request: Request) {
  const gate = await requireNav("todos");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const actor = actorId(me);
  if (!actor) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: todo } = await supabase
    .from("todos")
    .select("id, title, created_by, status")
    .eq("id", body.id)
    .maybeSingle();

  if (!todo) {
    return Response.json({ error: "To-do not found." }, { status: 404 });
  }

  const access = await accessTo(supabase, todo.id, actor);
  if (!access.can_edit) {
    // Don't distinguish "not yours" from "you're only mentioned" — both
    // mean the same thing to the person reading it.
    return Response.json(
      {
        error: access.can_see
          ? "You're only mentioned on this one, so it's read-only."
          : "This isn't your to-do.",
      },
      { status: 403 }
    );
  }

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return Response.json(
        { error: "A to-do needs a title." },
        { status: 400 }
      );
    }
    update.title = title;
  }
  if (body.description !== undefined) {
    update.description = body.description?.trim() || null;
  }
  if (PRIORITIES.includes(body.priority)) update.priority = body.priority;
  if (body.dueDate !== undefined) update.due_date = body.dueDate || null;

  if (STATUSES.includes(body.status)) {
    update.status = body.status;
    // Stamped on the way in, cleared if it's reopened.
    update.completed_at =
      body.status === "done" ? new Date().toISOString() : null;
  }

  /* undefined means "leave the people alone", [] means "clear them".
     This is load-bearing: ticking a box sends only { id, status }, and
     treating a missing key as an empty list would strip every assignee
     off the to-do on each tick. */
  const changingPeople =
    body.assignedTo !== undefined || body.mentions !== undefined;
  const changingLinks = body.links !== undefined;

  if (Object.keys(update).length === 0 && !changingPeople && !changingLinks) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Check before writing anything, so a rejected link can't leave the
  // title already changed.
  const links = changingLinks ? parseLinkRefs(body.links) : [];
  if (changingLinks) {
    const linkCheck = await checkLinks(supabase, me, links);
    if (linkCheck) return linkCheck.error;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from("todos")
      .update(update)
      .eq("id", body.id);

    if (error) {
      console.error("todo update failed:", error);
      return Response.json(
        { error: "Could not update the to-do." },
        { status: 500 }
      );
    }
  }

  if (changingLinks) {
    const failed = await syncLinks(supabase, todo.id, links);
    if (failed) return failed;
  }

  if (changingPeople) {
    const result = await syncPeople(supabase, me, todo.id, todo.title, body, actor);
    if (result) return result;
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireNav("todos");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const actor = actorId(me);
  if (!actor) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const access = await accessTo(supabase, id, actor);
  if (!access.can_see) {
    return Response.json({ error: "To-do not found." }, { status: 404 });
  }
  if (!access.can_delete) {
    // Deliberately narrower than editing. Being one of four assignees
    // shouldn't let you bin the other three's work — mark it done instead.
    return Response.json(
      {
        error:
          "Only whoever created this to-do, their department head, or the super admin can delete it.",
      },
      { status: 403 }
    );
  }

  // todo_participants cascades on todo_id, so the people go with it.
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) {
    console.error("todo delete failed:", error);
    return Response.json(
      { error: "Could not delete the to-do." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}

/* ---------- notifications ------------------------------------

   notify() already takes an array and swallows a missing table, so both
   paths below build one list and send it in a single insert. */

function describe(me: AdminProfile) {
  return me.full_name?.trim() || me.email;
}

async function notifyNew(
  supabase: SupabaseClient,
  me: AdminProfile,
  todoId: string,
  title: string,
  people: Participants,
  actor: string | null,
  dueDate: unknown
) {
  const who = describe(me);
  await notify(supabase, [
    ...people.assignees
      .filter((id) => id !== actor)
      .map((user_id) => ({
        user_id,
        kind: "todo_assigned" as const,
        title: `New to-do: ${title}`,
        body: typeof dueDate === "string" && dueDate ? `Due ${dueDate}.` : null,
        href: "/admin/todos",
        todo_id: todoId,
      })),
    ...people.mentions
      .filter((id) => id !== actor)
      .map((user_id) => ({
        user_id,
        kind: "todo_mentioned" as const,
        title: `${who} mentioned you: ${title}`,
        body: "You're not assigned — this is just so you know.",
        href: "/admin/todos",
        todo_id: todoId,
      })),
  ]);
}

/* Rewrite who is on a to-do, and tell only the people who are genuinely
   new. Diffing against what's already there is what stops an edit from
   re-notifying everybody every time the title changes. */
async function syncPeople(
  supabase: SupabaseClient,
  me: AdminProfile,
  todoId: string,
  title: string,
  body: { assignedTo?: unknown; mentions?: unknown },
  actor: string
): Promise<Response | null> {
  const { data: before, error: readError } = await supabase
    .from("todo_participants")
    .select("user_id, kind")
    .eq("todo_id", todoId);

  if (readError) {
    console.error("todo participants read failed:", readError);
    return Response.json({ error: MIGRATION_HINT }, { status: 500 });
  }

  const prevAssignees = new Set(
    (before ?? []).filter((r) => r.kind === "assignee").map((r) => r.user_id as string)
  );
  const prevMentions = new Set(
    (before ?? []).filter((r) => r.kind === "mention").map((r) => r.user_id as string)
  );

  // A key that wasn't sent keeps whatever is already stored.
  const wanted = normalise(
    body.assignedTo ?? [...prevAssignees],
    body.mentions ?? [...prevMentions]
  );

  /* Only check the people being ADDED. Re-validating everyone already on
     the to-do would break the common case: a member opening a to-do their
     head assigned to four people, changing the description, and being
     told they may only assign within their own department — they weren't
     assigning anyone, they were typing. Keeping an existing participant
     is not a new grant. */
  const addedAssignees = wanted.assignees.filter((id) => !prevAssignees.has(id));
  const addedMentions = wanted.mentions.filter(
    (id) => !prevMentions.has(id) && !prevAssignees.has(id)
  );

  const [assignable, namable] = await Promise.all([
    assignableUserIds(me),
    namableUserIds(me),
  ]);
  const [okAssignees, okMentions] = await Promise.all([
    resolvePeople(supabase, addedAssignees, assignable),
    resolvePeople(supabase, addedMentions, namable),
  ]);

  if (droppedAny(addedAssignees, okAssignees)) {
    return Response.json(
      { error: "You can only give a to-do to people in your own department." },
      { status: 403 }
    );
  }
  if (droppedAny(addedMentions, okMentions)) {
    return Response.json(
      { error: "You can only mention people in your own department." },
      { status: 403 }
    );
  }

  const keep = new Map<string, "assignee" | "mention">();
  for (const id of wanted.assignees) keep.set(id, "assignee");
  for (const id of wanted.mentions) if (!keep.has(id)) keep.set(id, "mention");

  const gone = [...prevAssignees, ...prevMentions].filter((id) => !keep.has(id));
  if (gone.length > 0) {
    const { error } = await supabase
      .from("todo_participants")
      .delete()
      .eq("todo_id", todoId)
      .in("user_id", gone);
    if (error) {
      console.error("todo participants delete failed:", error);
      return Response.json(
        { error: "Could not update who this to-do is for." },
        { status: 500 }
      );
    }
  }

  if (keep.size > 0) {
    // A mention promoted to assignee is a kind change on the same primary
    // key, which the upsert handles in place.
    const { error } = await supabase.from("todo_participants").upsert(
      [...keep].map(([user_id, kind]) => ({
        todo_id: todoId,
        user_id,
        kind,
        added_by: actor,
      })),
      { onConflict: "todo_id,user_id" }
    );
    if (error) {
      console.error("todo participants upsert failed:", error);
      return Response.json(
        { error: "Could not update who this to-do is for." },
        { status: 500 }
      );
    }
  }

  // Only the genuinely new. Somebody already on the to-do is never told
  // again, however many times the title gets edited. Someone demoted from
  // assignee to mention isn't "newly mentioned" either — hence excluding
  // prevAssignees there. Promotion the other way DOES fire, because that
  // is a real change of obligation.
  const who = describe(me);
  const newAssignees = addedAssignees.filter((id) => id !== actor);
  const newMentions = addedMentions.filter((id) => id !== actor);

  await notify(supabase, [
    ...newAssignees.map((user_id) => ({
      user_id,
      kind: "todo_assigned" as const,
      title: `To-do assigned to you: ${title}`,
      href: "/admin/todos",
      todo_id: todoId,
    })),
    ...newMentions.map((user_id) => ({
      user_id,
      kind: "todo_mentioned" as const,
      title: `${who} mentioned you: ${title}`,
      body: "You're not assigned — this is just so you know.",
      href: "/admin/todos",
      todo_id: todoId,
    })),
  ]);

  return null;
}
