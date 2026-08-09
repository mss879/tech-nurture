"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  UserX,
  UserCheck,
  ShieldAlert,
  Building2,
  X,
} from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  PageHeader,
  Modal,
  useToast,
  formatDate,
} from "./ui";
import { useMe } from "./MeProvider";
import { grantableNavItems } from "@/lib/admin/nav";
import { GRANTABLE_ROLES, type AdminRole, type NavKey } from "@/lib/admin/types";

/* Every role this page can hand out. The owner's `super_admin` is
   deliberately not among them — see roleOf() in the users API route. */
type GrantableRole = (typeof GRANTABLE_ROLES)[number]["value"];

type Department = { id: string; created_at: string; name: string };

type Row = {
  id: string;
  created_at: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  department_id: string | null;
  is_active: boolean;
  nav_access: NavKey[];
  can_create_leads: boolean;
  can_edit_leads: boolean;
  can_delete_leads: boolean;
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
};

type Form = {
  fullName: string;
  email: string;
  password: string;
  role: GrantableRole;
  departmentId: string;
  navAccess: NavKey[];
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
};

const emptyForm: Form = {
  fullName: "",
  email: "",
  password: "",
  role: "user",
  departmentId: "",
  // Everyone starts with their own to-do list.
  navAccess: ["todos"],
  canCreateLeads: false,
  canEditLeads: false,
  canDeleteLeads: false,
  canCreateProducts: false,
  canEditProducts: false,
  canDeleteProducts: false,
};

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super admin",
  dept_head: "Department head",
  user: "Team member",
};

const input =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green";
const label =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

export default function UsersView() {
  const me = useMe();
  const toast = useToast();

  const [rows, setRows] = useState<Row[] | null>(null);
  const [unlinked, setUnlinked] = useState<{ id: string; email: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [newDept, setNewDept] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null
  );

  const [editor, setEditor] = useState<
    { mode: "add" } | { mode: "edit"; user: Row } | null
  >(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [copied, setCopied] = useState(false);

  const [removing, setRemoving] = useState<{
    user: Row;
    leads: number;
    todos: number;
  } | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [data, depts] = await Promise.all([
        api<{ users: Row[]; unlinked: typeof unlinked }>("/api/admin/users"),
        api<{ departments: Department[] }>("/api/admin/departments"),
      ]);
      setRows(data.users);
      setUnlinked(data.unlinked ?? []);
      setDepartments(depts.departments ?? []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const departmentName = (id: string | null) =>
    departments.find((d) => d.id === id)?.name ?? null;

  const upd = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleNav = (key: NavKey) =>
    setForm((f) => ({
      ...f,
      navAccess: f.navAccess.includes(key)
        ? f.navAccess.filter((k) => k !== key)
        : [...f.navAccess, key],
    }));

  const openAdd = () => {
    setForm({
      ...emptyForm,
      // One department is no choice at all — preselect it.
      departmentId: departments.length === 1 ? departments[0].id : "",
    });
    setCopied(false);
    setEditor({ mode: "add" });
  };

  const openEdit = (user: Row) => {
    setForm({
      fullName: user.full_name ?? "",
      email: user.email,
      password: "",
      // The owner's row has no editable role; the form value is inert for
      // them because save() leaves `role` out of the payload entirely.
      role: user.role === "dept_head" ? "dept_head" : "user",
      departmentId: user.department_id ?? "",
      navAccess: user.nav_access ?? [],
      canCreateLeads: user.can_create_leads,
      canEditLeads: user.can_edit_leads,
      canDeleteLeads: user.can_delete_leads,
      canCreateProducts: user.can_create_products,
      canEditProducts: user.can_edit_products,
      canDeleteProducts: user.can_delete_products,
    });
    setCopied(false);
    setEditor({ mode: "edit", user });
  };

  const generatePassword = () => {
    // No look-alike characters — this gets read out or copied by hand.
    const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint32Array(14);
    crypto.getRandomValues(bytes);
    upd(
      "password",
      Array.from(bytes, (b) => chars[b % chars.length]).join("")
    );
    setCopied(false);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(form.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy — select the password and copy it manually.");
    }
  };

  /* The one super admin is the owner's account, set up in SQL. This page
     can't create another and can't re-role the existing one, so their row
     shows a locked notice and sends neither `role` nor `departmentId` —
     sending them would collide with the "you can't change your own role"
     guard in the API and turn "rename myself" into an error. */
  const editingOwner = editor?.mode === "edit" && editor.user.role === "super_admin";

  const save = async () => {
    if (!editor || busy) return;
    if (editor.mode === "add" && (!form.email.trim() || !form.password)) return;
    if (!editingOwner && !form.departmentId) return;
    setBusy(true);
    try {
      const payload = {
        fullName: form.fullName,
        ...(editingOwner
          ? {}
          : { role: form.role, departmentId: form.departmentId }),
        navAccess: form.navAccess,
        canCreateLeads: form.canCreateLeads,
        canEditLeads: form.canEditLeads,
        canDeleteLeads: form.canDeleteLeads,
        canCreateProducts: form.canCreateProducts,
        canEditProducts: form.canEditProducts,
        canDeleteProducts: form.canDeleteProducts,
      };
      if (editor.mode === "add") {
        await api("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            email: form.email.trim(),
            password: form.password,
          }),
        });
        toast(`${form.email.trim()} can now sign in.`, "success");
      } else {
        await api("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            id: editor.user.id,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
        toast("Changes saved.", "success");
      }
      setEditor(null);
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (user: Row, isActive: boolean) => {
    try {
      await api("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive }),
      });
      toast(
        isActive
          ? `${displayName(user)} can sign in again.`
          : `${displayName(user)} can no longer sign in.`,
        "success"
      );
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const addDepartment = async () => {
    const name = newDept.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await api("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewDept("");
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveRename = async () => {
    if (!renaming || busy || !renaming.name.trim()) return;
    setBusy(true);
    try {
      await api("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: renaming.id, name: renaming.name.trim() }),
      });
      setRenaming(null);
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* Raw fetch, not api(): a department that still has people in it comes
     back as a 409 carrying the head-count, and api() would throw the body
     away before we could say how many. */
  const removeDepartment = async (dept: Department) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/departments?id=${dept.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 409 && body?.error === "department_not_empty") {
        const n = body.members ?? 0;
        toast(
          `${dept.name} still has ${n} ${n === 1 ? "person" : "people"} in it. Move them somewhere else first.`
        );
        return;
      }
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);

      toast(`${dept.name} was removed.`, "success");
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* Confirm first, then delete. If they still hold leads or to-dos the
     server answers 409 with the counts, and the same dialog turns into
     "where should this go?" — raw fetch here because the 409 body carries
     those counts and api() would throw them away. */
  const remove = async (user: Row, moveTo?: string) => {
    if (busy) return;
    setBusy(true);
    const qs = new URLSearchParams({ id: user.id });
    if (moveTo) qs.set("reassignTo", moveTo);
    try {
      const res = await fetch(`/api/admin/users?${qs}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));

      if (res.status === 409 && body?.error === "reassign_required") {
        setReassignTo("");
        setRemoving({ user, leads: body.leads ?? 0, todos: body.todos ?? 0 });
        return;
      }
      if (!res.ok) {
        throw new Error(body?.error || `Request failed (${res.status})`);
      }

      toast(`${displayName(user)} was removed.`, "success");
      setRemoving(null);
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (error || !rows) {
    return (
      <>
        <PageHeader title="Users & Access" />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  const others = rows.filter((r) => r.id !== me?.id);

  return (
    <>
      <PageHeader
        title="Users & Access"
        sub="Who can sign in, what they can see, and what they can change."
      >
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="size-4" /> Add team member
        </button>
      </PageHeader>

      {unlinked.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">
              {unlinked.length === 1
                ? "1 sign-in account has no access set up"
                : `${unlinked.length} sign-in accounts have no access set up`}
            </p>
            <p className="mt-1 leading-relaxed text-amber-700">
              {unlinked.map((u) => u.email).join(", ")} — these were created in
              the Supabase dashboard. They can&apos;t use the admin until you
              add them here with the same email address.
            </p>
          </div>
        </div>
      )}

      {/* Departments live here rather than behind their own menu item:
          setting up the org and putting people into it is one job. */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-3">
          <Building2 className="size-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Departments</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {departments.length}
          </span>
        </div>

        <div className="px-6 py-4">
          {departments.length === 0 ? (
            <p className="mb-4 text-sm text-slate-500">
              No departments yet. Add one before you add people — everyone
              belongs to a department.
            </p>
          ) : (
            <ul className="mb-4 flex flex-wrap gap-2">
              {departments.map((dept) => {
                const headcount = rows.filter(
                  (r) => r.department_id === dept.id
                ).length;
                return (
                  <li
                    key={dept.id}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm text-slate-700"
                  >
                    <button
                      onClick={() => setRenaming({ id: dept.id, name: dept.name })}
                      title="Rename"
                      className="font-medium hover:underline"
                    >
                      {dept.name}
                    </button>
                    <span className="text-xs text-slate-400">{headcount}</span>
                    <button
                      onClick={() => removeDepartment(dept)}
                      aria-label={`Remove ${dept.name}`}
                      title="Remove"
                      className="grid size-5 place-items-center rounded-full text-slate-400 transition hover:bg-red-100 hover:text-red-500"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDepartment()}
              placeholder="Sales, Service, Installations…"
              className={`${input} max-w-xs`}
            />
            <button
              onClick={addDepartment}
              disabled={busy || !newDept.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[1.4fr_1fr_1.6fr_auto] gap-4 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:grid">
          <span>Person</span>
          <span>Role</span>
          <span>Can see</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map((user) => {
            const isMe = user.id === me?.id;
            return (
              <li
                key={user.id}
                className="grid gap-3 px-6 py-4 lg:grid-cols-[1.4fr_1fr_1.6fr_auto] lg:items-center lg:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {displayName(user)}
                    {isMe && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  <p className="mt-0.5 text-[0.68rem] text-slate-400">
                    Added {formatDate(user.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                      user.role === "super_admin"
                        ? "bg-lime/20 text-green-700 ring-lime"
                        : user.role === "dept_head"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                  {departmentName(user.department_id) && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Building2 className="size-3" />
                      {departmentName(user.department_id)}
                    </span>
                  )}
                  {!user.is_active && (
                    <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-200">
                      Switched off
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  {summariseAccess(user)}
                </p>

                <div className="flex items-center justify-start gap-1 lg:justify-end">
                  <button
                    onClick={() => openEdit(user)}
                    aria-label={`Edit ${displayName(user)}`}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil className="size-4" />
                  </button>
                  {!isMe && (
                    <>
                      <button
                        onClick={() => setActive(user, !user.is_active)}
                        aria-label={
                          user.is_active
                            ? `Switch off ${displayName(user)}`
                            : `Switch on ${displayName(user)}`
                        }
                        title={
                          user.is_active
                            ? "Switch off access"
                            : "Switch access back on"
                        }
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        {user.is_active ? (
                          <UserX className="size-4" />
                        ) : (
                          <UserCheck className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setReassignTo("");
                          setRemoving({ user, leads: 0, todos: 0 });
                        }}
                        aria-label={`Remove ${displayName(user)}`}
                        title="Remove permanently"
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* add / edit */}
      {editor && (
        <Modal
          title={editor.mode === "add" ? "Add a team member" : "Edit access"}
          sub={editor.mode === "edit" ? editor.user.email : undefined}
          size="lg"
          onClose={() => setEditor(null)}
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Full name</label>
                <input
                  autoFocus
                  value={form.fullName}
                  onChange={(e) => upd("fullName", e.target.value)}
                  placeholder="Nimal Perera"
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => upd("email", e.target.value)}
                  disabled={editor.mode === "edit"}
                  type="email"
                  placeholder="nimal@technurture.lk"
                  className={`${input} disabled:bg-slate-50 disabled:text-slate-400`}
                />
              </div>
            </div>

            <div>
              <label className={label}>
                {editor.mode === "add" ? "Password" : "New password (optional)"}
              </label>
              <div className="flex gap-2">
                <input
                  value={form.password}
                  onChange={(e) => upd("password", e.target.value)}
                  type="text"
                  placeholder={
                    editor.mode === "add"
                      ? "At least 6 characters"
                      : "Leave blank to keep the current one"
                  }
                  className={`${input} font-mono`}
                />
                <button
                  onClick={generatePassword}
                  title="Generate a password"
                  className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <RefreshCw className="size-4" />
                </button>
                <button
                  onClick={copyPassword}
                  disabled={!form.password}
                  title="Copy"
                  className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  {copied ? (
                    <Check className="size-4 text-green" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                They&apos;ll use this to sign in. Copy it now and pass it on —
                you can change it here any time.
              </p>
            </div>

            {editingOwner ? (
              <p className="rounded-xl bg-lime/10 px-4 py-3 text-sm leading-relaxed text-slate-600 ring-1 ring-lime/40">
                <strong className="font-semibold">Super admin — the owner account.</strong>{" "}
                There is only one, and it can&apos;t be changed here or handed
                to anyone else. It sees every menu and every lead, assigns
                leads, and is the only account that can move a lead back to an
                earlier stage.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => upd("role", e.target.value as Form["role"])}
                    className={input}
                  >
                    {GRANTABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {form.role === "dept_head"
                      ? "Sees every to-do and lead in their department, and hands out to-dos to their own people."
                      : "Sees only the to-dos and leads assigned to them."}
                  </p>
                </div>
                <div>
                  <label className={label}>Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => upd("departmentId", e.target.value)}
                    className={input}
                  >
                    <option value="">Choose a department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {!form.departmentId && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      {departments.length === 0
                        ? "Add a department above first."
                        : "Everyone belongs to a department."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {editingOwner ? null : (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">
                      What can they see?
                    </h3>
                    <button
                      onClick={() =>
                        upd(
                          "navAccess",
                          form.navAccess.length === grantableNavItems().length
                            ? []
                            : grantableNavItems().map((i) => i.key)
                        )
                      }
                      className="text-xs font-medium text-green hover:underline"
                    >
                      {form.navAccess.length === grantableNavItems().length
                        ? "Clear all"
                        : "Select all"}
                    </button>
                  </div>
                  <div className="grid gap-2 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                    {grantableNavItems().map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.navAccess.includes(item.key)}
                          onChange={() => toggleNav(item.key)}
                          className="size-4 accent-green"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Only shown once CRM is ticked — otherwise the two lists
                    read as one undifferentiated grid of checkboxes. */}
                {form.navAccess.includes("crm") && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">
                      What can they do in the CRM?
                    </h3>
                    <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.canCreateLeads}
                          onChange={(e) =>
                            upd("canCreateLeads", e.target.checked)
                          }
                          className="size-4 accent-green"
                        />
                        Add new leads
                      </label>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.canEditLeads}
                          onChange={(e) => upd("canEditLeads", e.target.checked)}
                          className="size-4 accent-green"
                        />
                        Edit leads and move them forward
                      </label>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.canDeleteLeads}
                          onChange={(e) =>
                            upd("canDeleteLeads", e.target.checked)
                          }
                          className="size-4 accent-green"
                        />
                        Delete leads
                      </label>
                      <p className="border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-400">
                        {form.role === "dept_head"
                          ? "These apply to their own leads. A head also sees their whole department's leads, but read-only — only you can assign a lead or move one backwards."
                          : "They'll only see leads assigned to them, and leads can never be moved backwards."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Same shape as the CRM block, revealed by its own tick. */}
                {form.navAccess.includes("products") && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">
                      What can they do with products?
                    </h3>
                    <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.canCreateProducts}
                          onChange={(e) =>
                            upd("canCreateProducts", e.target.checked)
                          }
                          className="size-4 accent-green"
                        />
                        Add new products
                      </label>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.canEditProducts}
                          onChange={(e) =>
                            upd("canEditProducts", e.target.checked)
                          }
                          className="size-4 accent-green"
                        />
                        Edit products, photos, categories and tags
                      </label>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.canDeleteProducts}
                          onChange={(e) =>
                            upd("canDeleteProducts", e.target.checked)
                          }
                          className="size-4 accent-green"
                        />
                        Delete products
                      </label>
                      <p className="border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-400">
                        Publishing and hiding a product counts as editing.
                        Without any of these they can look but not change
                        anything.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={save}
            disabled={
              busy ||
              (editor.mode === "add" && (!form.email.trim() || !form.password)) ||
              (!editingOwner && !form.departmentId)
            }
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {editor.mode === "add" ? "Create user" : "Save changes"}
          </button>
        </Modal>
      )}

      {renaming && (
        <Modal title="Rename department" onClose={() => setRenaming(null)}>
          <label className={label}>Name</label>
          <input
            autoFocus
            value={renaming.name}
            onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            className={input}
          />
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setRenaming(null)}
              className="flex-1 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={saveRename}
              disabled={busy || !renaming.name.trim()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* remove — confirm, then ask where their work should go */}
      {removing && (
        <Modal
          title={`Remove ${displayName(removing.user)}?`}
          onClose={() => setRemoving(null)}
        >
          {(() => {
            const hasWork = removing.leads > 0 || removing.todos > 0;
            return (
              <>
                <p className="text-sm leading-relaxed text-slate-600">
                  {hasWork
                    ? `${describeWorkload(removing.leads, removing.todos)} Choose who should take this over.`
                    : "Their sign-in will be deleted for good."}{" "}
                  This can&apos;t be undone — switching their access off
                  instead keeps their history.
                </p>
                {hasWork && (
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className={`${input} mt-4`}
                  >
                    <option value="">Choose a person…</option>
                    {others
                      .filter((u) => u.id !== removing.user.id && u.is_active)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {displayName(u)}
                        </option>
                      ))}
                  </select>
                )}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setRemoving(null)}
                    className="flex-1 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      remove(removing.user, hasWork ? reassignTo : undefined)
                    }
                    disabled={busy || (hasWork && !reassignTo)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    {hasWork ? "Move & remove" : "Remove"}
                  </button>
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </>
  );
}

function displayName(user: Row) {
  return user.full_name?.trim() || user.email;
}

function describeWorkload(leads: number, todos: number) {
  const parts = [
    leads > 0 && `${leads} ${leads === 1 ? "lead" : "leads"}`,
    todos > 0 && `${todos} ${todos === 1 ? "to-do" : "to-dos"}`,
  ].filter(Boolean);
  return `They still have ${parts.join(" and ")}.`;
}

function summariseAccess(user: Row) {
  if (user.role === "super_admin") return "Everything";
  const labels = grantableNavItems()
    .filter((item) => user.nav_access?.includes(item.key))
    .map((item) => item.label);
  return labels.length ? labels.join(", ") : "Nothing yet";
}
