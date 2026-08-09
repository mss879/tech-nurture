import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";

/* Departments — the org chart behind who sees whose work.

   Reading is open to any signed-in admin: a head has to be able to render
   their own department's name, and the assignee pickers need the list.
   Creating, renaming and removing is the super admin's alone. */

const COLUMNS = "id, created_at, name";

function nameOf(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

/* Two departments called "Sales" and "sales" would leave the owner
   guessing which one somebody is in, so departments_name_uniq in 022 is a
   lower(name) index. Turn its 23505 into wording that says so. */
function duplicateName(error: { code?: string } | null) {
  return error?.code === "23505";
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("departments")
    .select(COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    // Before 022 there are no departments, which is a real answer rather
    // than a failure — the Users page just won't offer the picker.
    if (isMissingSchema(error)) return Response.json({ departments: [] });
    console.error("departments list failed:", error);
    return Response.json(
      { error: "Could not load departments. Have you run 022_departments.sql?" },
      { status: 500 }
    );
  }

  return Response.json({ departments: data ?? [] });
}

/* POST — { name } */
export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const name = nameOf(body?.name);
  if (!name) {
    return Response.json({ error: "A department needs a name." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("departments")
    .insert({ name })
    .select("id")
    .single();

  if (error) {
    if (duplicateName(error)) {
      return Response.json(
        { error: `There's already a department called "${name}".` },
        { status: 400 }
      );
    }
    console.error("department create failed:", error);
    return Response.json(
      { error: "Could not create the department." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, id: data?.id }, { status: 201 });
}

/* PATCH — { id, name } */
export async function PATCH(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id) return Response.json({ error: "id is required." }, { status: 400 });

  const name = nameOf(body?.name);
  if (!name) {
    return Response.json({ error: "A department needs a name." }, { status: 400 });
  }

  const { error } = await supabase
    .from("departments")
    .update({ name })
    .eq("id", body.id);

  if (error) {
    if (duplicateName(error)) {
      return Response.json(
        { error: `There's already a department called "${name}".` },
        { status: 400 }
      );
    }
    console.error("department update failed:", error);
    return Response.json(
      { error: "Could not rename the department." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}

/* DELETE ?id=<uuid>
   Refuses while anyone is still in it. The FK is `on delete set null`, so
   deleting anyway would silently strand those people — and any head among
   them would then violate the dept_head-has-a-department constraint. Same
   409 shape the user delete uses, so the UI can turn the dialog into
   "move them first". */
export async function DELETE(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id);

  if ((count ?? 0) > 0) {
    return Response.json(
      { error: "department_not_empty", members: count ?? 0 },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) {
    console.error("department delete failed:", error);
    return Response.json(
      { error: "Could not remove the department." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
