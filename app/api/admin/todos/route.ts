import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, actorId } from "@/lib/admin/permissions";
import { isSuperAdmin } from "@/lib/admin/types";
import { notify } from "@/lib/admin/notify";

const COLUMNS =
  "id, created_at, updated_at, title, description, priority, status, due_date, completed_at, assigned_to, created_by, lead_id";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "done"];

/* GET — the caller's to-dos.
   ?scope=mine (default) | created | all  ("all" is super-admin only). */
export async function GET(request: Request) {
  const gate = await requireNav("todos");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const scope = new URL(request.url).searchParams.get("scope") ?? "mine";
  const query = supabase.from("todos").select(COLUMNS);

  if (scope === "all" && isSuperAdmin(me)) {
    // no filter — the whole team's list
  } else if (scope === "created") {
    query.eq("created_by", me.id);
  } else {
    query.eq("assigned_to", me.id);
  }

  const { data, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("todos list failed:", error);
    return Response.json(
      { error: "Could not load to-dos. Have you run 016_todos.sql?" },
      { status: 500 }
    );
  }

  return Response.json({ todos: data ?? [] });
}

/* POST — { title, description?, priority?, dueDate?, assignedTo?, leadId? }
   A super admin can hand a to-do to anyone; everyone else creates their
   own. */
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

  const assignedTo = isSuperAdmin(me)
    ? body.assignedTo || actorId(me)
    : actorId(me);

  const { data: created, error } = await supabase
    .from("todos")
    .insert({
      title,
      description: body.description?.trim() || null,
      priority: PRIORITIES.includes(body.priority) ? body.priority : "medium",
      due_date: body.dueDate || null,
      assigned_to: assignedTo,
      created_by: actorId(me),
      lead_id: body.leadId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("todo create failed:", error);
    return Response.json(
      { error: "Could not create the to-do." },
      { status: 500 }
    );
  }

  if (assignedTo && assignedTo !== actorId(me)) {
    await notify(supabase, [
      {
        user_id: assignedTo,
        kind: "todo_assigned",
        title: `New to-do: ${title}`,
        body: body.dueDate ? `Due ${body.dueDate}.` : null,
        href: "/admin/todos",
        todo_id: created?.id ?? null,
      },
    ]);
  }

  return Response.json({ ok: true, id: created?.id }, { status: 201 });
}

/* PATCH — { id, title?, description?, priority?, status?, dueDate?,
   assignedTo? } */
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

  const { data: todo } = await supabase
    .from("todos")
    .select("id, title, assigned_to, created_by, status")
    .eq("id", body.id)
    .maybeSingle();

  if (!todo) {
    return Response.json({ error: "To-do not found." }, { status: 404 });
  }

  // You can change a to-do that's yours, or one you created for someone.
  const mine = todo.assigned_to === me.id || todo.created_by === me.id;
  if (!isSuperAdmin(me) && !mine) {
    return Response.json({ error: "This isn't your to-do." }, { status: 403 });
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

  if (body.assignedTo !== undefined) {
    if (!isSuperAdmin(me)) {
      return Response.json(
        { error: "Only a super admin can hand a to-do to someone else." },
        { status: 403 }
      );
    }
    update.assigned_to = body.assignedTo || null;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

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

  if (
    body.assignedTo !== undefined &&
    body.assignedTo &&
    body.assignedTo !== todo.assigned_to &&
    body.assignedTo !== actorId(me)
  ) {
    await notify(supabase, [
      {
        user_id: body.assignedTo,
        kind: "todo_assigned",
        title: `To-do assigned to you: ${todo.title}`,
        href: "/admin/todos",
        todo_id: todo.id,
      },
    ]);
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

  if (!isSuperAdmin(me)) {
    const { data: todo } = await supabase
      .from("todos")
      .select("id, assigned_to, created_by")
      .eq("id", id)
      .maybeSingle();
    if (!todo) {
      return Response.json({ error: "To-do not found." }, { status: 404 });
    }
    if (todo.assigned_to !== me.id && todo.created_by !== me.id) {
      return Response.json({ error: "This isn't your to-do." }, { status: 403 });
    }
  }

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
