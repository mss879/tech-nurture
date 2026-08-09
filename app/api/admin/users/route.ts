import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { getServiceSupabase, serviceKeyMissing } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";
import { grantableNavItems } from "@/lib/admin/nav";
import { NAV_KEYS, type AdminRole, type NavKey } from "@/lib/admin/types";

export const runtime = "nodejs";

/* Team members and what they're allowed to do. Super admin only.

   Passwords live in Supabase Auth; this route uses the service-role key to
   create/update/delete the auth account, and keeps the matching profile row
   in public.admin_users in step. */

const PROFILE_COLUMNS =
  "id, created_at, email, full_name, role, department_id, is_active, nav_access, can_create_leads, can_edit_leads, can_delete_leads, can_create_products, can_edit_products, can_delete_products";

/* A head or member can only be granted menu items that are actually
   grantable, whatever the client sends. Super admins see everything, so
   their stored list is the full set. */
function sanitiseNavAccess(input: unknown, role: AdminRole) {
  if (role === "super_admin") return [...NAV_KEYS];
  const allowed = new Set(grantableNavItems().map((i) => i.key));
  const requested = Array.isArray(input) ? input : [];
  return requested.filter(
    (k): k is NavKey => typeof k === "string" && allowed.has(k as NavKey)
  );
}

/* There is exactly one super admin — the owner, promoted in SQL by 014 —
   and this API cannot mint another. `super_admin` is not in the range of
   this function on purpose: it is the single choke point every write goes
   through, so no request body can escalate, however it is crafted.
   Promoting someone would mean an UPDATE in the Supabase SQL editor, which
   is a deliberate enough act to be safe. */
function roleOf(input: unknown): Exclude<AdminRole, "super_admin"> {
  return input === "dept_head" ? "dept_head" : "user";
}

function departmentIdOf(input: unknown): string | null {
  return typeof input === "string" && input.trim() ? input.trim() : null;
}

/* The department FK is `on delete set null`, so a stale id from the client
   surfaces as a raw 23503 rather than anything readable. */
function unknownDepartment(error: { code?: string } | null) {
  return error?.code === "23503";
}

async function countActiveSuperAdmins(
  supabase: NonNullable<ReturnType<typeof getServerSupabase>>
) {
  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("is_active", true);
  return count ?? 0;
}

/* GET — every profile, plus any Supabase auth account that has no profile
   yet (someone added straight in the Supabase dashboard). Surfacing those
   is why there's no trigger on auth.users: a broken trigger there would
   break sign-up entirely, so the app reconciles here instead. */
export async function GET() {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("admin_users")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("users list failed:", error);
    return Response.json(
      {
        error:
          "Could not load users. Have you run 014_admin_users.sql and 022_departments.sql?",
      },
      { status: 500 }
    );
  }

  const users = data ?? [];
  let unlinked: { id: string; email: string }[] = [];

  const service = getServiceSupabase();
  if (service) {
    const { data: authList } = await service.auth.admin.listUsers({
      perPage: 200,
    });
    const known = new Set(users.map((u) => u.id));
    unlinked = (authList?.users ?? [])
      .filter((u) => !known.has(u.id))
      .map((u) => ({ id: u.id, email: u.email ?? "" }));
  }

  return Response.json({ users, unlinked });
}

/* POST — create a team member.
   { email, password, fullName?, role?, navAccess?, canCreateLeads?, … } */
export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;

  const service = getServiceSupabase();
  if (!service) return serviceKeyMissing();

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return Response.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const role = roleOf(body?.role);
  const departmentId = departmentIdOf(body?.departmentId);
  // Everyone this API creates is either a head or a member, and both live
  // in a department. 022 enforces it for heads at the database; requiring
  // it for members too keeps "who is in my team" answerable for everyone.
  if (!departmentId) {
    return Response.json(
      { error: "Choose a department for this person." },
      { status: 400 }
    );
  }

  const { data: created, error: authError } =
    await service.auth.admin.createUser({
      email,
      password,
      // Without this they can't sign in while email confirmation is on.
      email_confirm: true,
      user_metadata: { full_name: body?.fullName || null },
    });

  if (authError || !created?.user) {
    // Surface Supabase's own wording — password policy, duplicate email.
    return Response.json(
      { error: authError?.message || "Could not create the sign-in account." },
      { status: 400 }
    );
  }

  const profile = {
    id: created.user.id,
    email,
    full_name: body?.fullName?.trim() || null,
    role,
    department_id: departmentId,
    is_active: true,
    nav_access: sanitiseNavAccess(body?.navAccess, role),
    can_create_leads: body?.canCreateLeads === true,
    can_edit_leads: body?.canEditLeads === true,
    can_delete_leads: body?.canDeleteLeads === true,
    can_create_products: body?.canCreateProducts === true,
    can_edit_products: body?.canEditProducts === true,
    can_delete_products: body?.canDeleteProducts === true,
  };

  // Never `do nothing` here: if a profile stub somehow exists, it must be
  // overwritten with the chosen permissions or the person can't sign in.
  const { error: profileError } = await service
    .from("admin_users")
    .upsert(profile, { onConflict: "id" });

  if (profileError) {
    // Compensate — an auth account with no profile would be a dead login,
    // and under the pre-014 fallback it would be a full admin.
    await service.auth.admin.deleteUser(created.user.id).catch(() => {});
    console.error("user profile create failed:", profileError);
    return Response.json(
      {
        error: unknownDepartment(profileError)
          ? "That department no longer exists. Nothing was created."
          : "Could not save this user's permissions. Nothing was created.",
      },
      { status: unknownDepartment(profileError) ? 400 : 500 }
    );
  }

  return Response.json({ ok: true, id: created.user.id }, { status: 201 });
}

/* PATCH — update a team member: { id, fullName?, role?, isActive?,
   navAccess?, can*?, password? } */
export async function PATCH(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { data: target } = await supabase
    .from("admin_users")
    .select("id, role, department_id, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!target) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  /* The owner's row keeps its role and stays out of the department tree,
     whatever arrives in the body. The Users page doesn't send `role` for
     them, and ignoring it here as well means "change my own name" can
     never turn into a self-demotion — which the guard just below would
     then reject with a baffling error. */
  const ownerRow = target.role === "super_admin";

  const nextRole: AdminRole = ownerRow
    ? "super_admin"
    : body.role !== undefined
      ? roleOf(body.role)
      : (target.role as AdminRole);

  const nextDepartment = ownerRow
    ? target.department_id
    : body.departmentId !== undefined
      ? departmentIdOf(body.departmentId)
      : target.department_id;

  // 022 enforces this at the database too; catching it here turns a raw
  // constraint violation into something the form can show.
  if (nextRole === "dept_head" && !nextDepartment) {
    return Response.json(
      { error: "A department head needs a department." },
      { status: 400 }
    );
  }

  const changingRole = nextRole !== target.role;
  const changingActive =
    body.isActive !== undefined && body.isActive !== target.is_active;

  // You can't lock yourself out of your own dashboard.
  if (id === me.id && (changingRole || changingActive)) {
    return Response.json(
      { error: "You can't change your own role or switch off your own access." },
      { status: 400 }
    );
  }

  // …and the last way in can't be removed either. Only deactivation can
  // reach this now that the owner's role is immutable here, but the guard
  // stays: it is the backstop if that ever changes.
  const losingASuperAdmin =
    ownerRow && target.is_active && changingActive && body.isActive === false;

  if (losingASuperAdmin && (await countActiveSuperAdmins(supabase)) <= 1) {
    return Response.json(
      {
        error:
          "This is the only super admin. Make someone else a super admin first.",
      },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (body.fullName !== undefined) {
    update.full_name = body.fullName?.trim() || null;
  }
  if (!ownerRow) {
    if (body.role !== undefined) update.role = nextRole;
    if (body.departmentId !== undefined) update.department_id = nextDepartment;
  }
  if (body.isActive !== undefined) update.is_active = body.isActive === true;
  if (body.navAccess !== undefined) {
    // nextRole, not roleOf(...) — for the owner that would compute a
    // member's restricted list and quietly take the menu away from them.
    update.nav_access = sanitiseNavAccess(body.navAccess, nextRole);
  }
  if (body.canCreateLeads !== undefined) {
    update.can_create_leads = body.canCreateLeads === true;
  }
  if (body.canEditLeads !== undefined) {
    update.can_edit_leads = body.canEditLeads === true;
  }
  if (body.canDeleteLeads !== undefined) {
    update.can_delete_leads = body.canDeleteLeads === true;
  }
  if (body.canCreateProducts !== undefined) {
    update.can_create_products = body.canCreateProducts === true;
  }
  if (body.canEditProducts !== undefined) {
    update.can_edit_products = body.canEditProducts === true;
  }
  if (body.canDeleteProducts !== undefined) {
    update.can_delete_products = body.canDeleteProducts === true;
  }

  // Changing the role alone would leave a stale nav_access behind.
  if (update.role && body.navAccess === undefined) {
    update.nav_access = sanitiseNavAccess(undefined, update.role as AdminRole);
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from("admin_users")
      .update(update)
      .eq("id", id);
    if (error) {
      if (unknownDepartment(error)) {
        return Response.json(
          { error: "That department no longer exists." },
          { status: 400 }
        );
      }
      console.error("user update failed:", error);
      return Response.json(
        { error: "Could not update this user." },
        { status: 500 }
      );
    }
  }

  if (body.password) {
    const service = getServiceSupabase();
    if (!service) return serviceKeyMissing();
    const { error } = await service.auth.admin.updateUserById(id, {
      password: body.password,
    });
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  }

  return Response.json({ ok: true });
}

/* DELETE ?id=<uuid>&reassignTo=<uuid> — remove a team member for good.
   Refuses while they still hold leads or to-dos, unless told where to move
   them. Deactivating (PATCH isActive:false) is the gentler option and is
   what the UI offers first. */
export async function DELETE(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const reassignTo = url.searchParams.get("reassignTo");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  if (id === me.id) {
    return Response.json(
      { error: "You can't remove your own account." },
      { status: 400 }
    );
  }

  const { data: target } = await supabase
    .from("admin_users")
    .select("id, role, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!target) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (
    target.role === "super_admin" &&
    target.is_active &&
    (await countActiveSuperAdmins(supabase)) <= 1
  ) {
    return Response.json(
      {
        error:
          "This is the only super admin. Make someone else a super admin first.",
      },
      { status: 400 }
    );
  }

  // Counts tolerate a missing table/column so this route keeps working
  // before 015, 016 and 023 have been run.
  const missingIsZero = (table: string, error: { code?: string } | null) => {
    if (error && !isMissingSchema(error)) {
      console.error(`could not count ${table} for user delete:`, error);
    }
    return 0;
  };

  const countLeads = async () => {
    const { count, error } = await supabase
      .from("crm_leads")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", id);
    return error ? missingIsZero("crm_leads", error) : (count ?? 0);
  };

  /* To-dos moved to a join table in 023. Only assignments are workload —
     mentions are courtesy copies, so they're never counted and never
     handed on: the FK cascade drops them with the account, which is the
     right outcome. */
  const countTodos = async () => {
    const { count, error } = await supabase
      .from("todo_participants")
      .select("todo_id", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("kind", "assignee");
    return error ? missingIsZero("todo_participants", error) : (count ?? 0);
  };

  const [leads, todos] = await Promise.all([countLeads(), countTodos()]);

  if ((leads > 0 || todos > 0) && !reassignTo) {
    return Response.json(
      {
        error: "reassign_required",
        leads,
        todos,
      },
      { status: 409 }
    );
  }

  /* Must happen before the auth account goes: todo_participants cascades
     on user_id, so reassigning afterwards would find nothing to move. */
  if (reassignTo) {
    await supabase
      .from("crm_leads")
      .update({ assigned_to: reassignTo })
      .eq("assigned_to", id);

    // One statement, in a function, because the successor may already be
    // on some of these to-dos — a plain update would hit the participants
    // primary key. See todos_reassign_assignee in 023.
    const { error } = await supabase.rpc("todos_reassign_assignee", {
      p_from: id,
      p_to: reassignTo,
    });
    if (error && !isMissingSchema(error)) {
      console.error("todo reassign failed:", error);
      return Response.json(
        { error: "Could not move this person's to-dos. Nothing was removed." },
        { status: 500 }
      );
    }
  }

  // Deleting the auth account cascades to admin_users (014's FK).
  const service = getServiceSupabase();
  if (!service) return serviceKeyMissing();

  const { error } = await service.auth.admin.deleteUser(id);
  if (error) {
    console.error("user delete failed:", error);
    return Response.json(
      { error: error.message || "Could not remove this user." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
