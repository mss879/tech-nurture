"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  CalendarDays,
  UserRound,
} from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  PageHeader,
  Modal,
  useToast,
} from "./ui";
import { useMe } from "./MeProvider";
import { isSuperAdmin } from "@/lib/admin/types";

type Todo = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "done";
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  created_by: string | null;
  lead_id: string | null;
};

type Member = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

type Form = {
  title: string;
  description: string;
  priority: Todo["priority"];
  dueDate: string;
  assignedTo: string;
};

const emptyForm: Form = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
};

const PRIORITY_STYLES: Record<Todo["priority"], string> = {
  urgent: "bg-red-50 text-red-600 ring-red-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  medium: "bg-blue-50 text-blue-700 ring-blue-200",
  low: "bg-slate-100 text-slate-500 ring-slate-200",
};

/* The group order IS the priority order on screen: what's late first,
   what's next after that. */
const GROUPS = [
  "Overdue",
  "Today",
  "Tomorrow",
  "This week",
  "Later",
  "No date",
  "Done",
] as const;
type Group = (typeof GROUPS)[number];

const input =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green";
const label =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

/* "Today" means today in Sri Lanka, matching the todo_reminders view, so
   the buckets here and the bell agree even if a laptop is set elsewhere. */
function colomboToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function groupFor(todo: Todo, today: string): Group {
  if (todo.status === "done") return "Done";
  if (!todo.due_date) return "No date";
  if (todo.due_date < today) return "Overdue";
  if (todo.due_date === today) return "Today";
  if (todo.due_date === addDays(today, 1)) return "Tomorrow";
  if (todo.due_date <= addDays(today, 7)) return "This week";
  return "Later";
}

function formatDue(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function TodosView() {
  const me = useMe();
  const toast = useToast();
  const superAdmin = me ? isSuperAdmin(me) : false;

  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"mine" | "all" | "created">("mine");

  const [editor, setEditor] = useState<
    { mode: "add" } | { mode: "edit"; todo: Todo } | null
  >(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const today = colomboToday();

  const load = useCallback(async (which: typeof scope) => {
    setError(null);
    try {
      const data = await api<{ todos: Todo[] }>(
        `/api/admin/todos?scope=${which}`
      );
      setTodos(data.todos);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(scope);
  }, [load, scope]);

  useEffect(() => {
    api<{ members: Member[] }>("/api/admin/team")
      .then((d) => setMembers(d.members ?? []))
      .catch(() => setMembers([]));
  }, []);

  const upd = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const memberName = (id: string | null) => {
    if (!id) return null;
    if (id === me?.id) return "You";
    const m = members.find((x) => x.id === id);
    return m ? m.full_name?.trim() || m.email : "Someone";
  };

  const openAdd = () => {
    setForm({ ...emptyForm, assignedTo: me?.id ?? "" });
    setEditor({ mode: "add" });
  };

  const openEdit = (todo: Todo) => {
    setForm({
      title: todo.title,
      description: todo.description ?? "",
      priority: todo.priority,
      dueDate: todo.due_date ?? "",
      assignedTo: todo.assigned_to ?? "",
    });
    setEditor({ mode: "edit", todo });
  };

  const save = async () => {
    if (!editor || busy || !form.title.trim()) return;
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || null,
        ...(superAdmin ? { assignedTo: form.assignedTo || null } : {}),
      };
      if (editor.mode === "add") {
        await api("/api/admin/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/todos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editor.todo.id }),
        });
      }
      setEditor(null);
      await load(scope);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Optimistic tick, rolled back by reloading if the server disagrees.
  const toggleDone = async (todo: Todo) => {
    const next = todo.status === "done" ? "open" : "done";
    setTodos(
      (prev) =>
        prev?.map((t) => (t.id === todo.id ? { ...t, status: next } : t)) ?? null
    );
    try {
      await api("/api/admin/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: todo.id, status: next }),
      });
      await load(scope);
    } catch (e) {
      toast((e as Error).message);
      await load(scope);
    }
  };

  const remove = async (todo: Todo) => {
    if (!confirm(`Delete "${todo.title}"?`)) return;
    try {
      await api(`/api/admin/todos?id=${todo.id}`, { method: "DELETE" });
      await load(scope);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  if (loading) return <Spinner />;
  if (error || !todos) {
    return (
      <>
        <PageHeader title="To-dos" />
        <ErrorState
          error={error ?? new Error("No data")}
          onRetry={() => load(scope)}
        />
      </>
    );
  }

  const grouped = new Map<Group, Todo[]>();
  for (const todo of todos) {
    const g = groupFor(todo, today);
    grouped.set(g, [...(grouped.get(g) ?? []), todo]);
  }

  const openCount = todos.filter((t) => t.status !== "done").length;

  return (
    <>
      <PageHeader
        title="To-dos"
        sub={
          openCount === 0
            ? "Nothing outstanding."
            : `${openCount} still to do${
                (grouped.get("Overdue")?.length ?? 0) > 0
                  ? ` · ${grouped.get("Overdue")!.length} overdue`
                  : ""
              }`
        }
      >
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="size-4" /> Add to-do
        </button>
      </PageHeader>

      {superAdmin && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ["mine", "Assigned to me"],
              ["all", "Everyone's"],
              ["created", "Created by me"],
            ] as const
          ).map(([key, text]) => (
            <button
              key={key}
              onClick={() => setScope(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                scope === key
                  ? "bg-green text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {todos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
          <p className="text-slate-500">
            Nothing here yet. Add a to-do to keep track of what needs doing.
          </p>
          <button
            onClick={openAdd}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="size-4" /> Add to-do
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {GROUPS.filter((g) => (grouped.get(g)?.length ?? 0) > 0).map(
            (group) => (
              <section key={group}>
                <h2
                  className={`mb-2.5 flex items-center gap-2 text-sm font-semibold ${
                    group === "Overdue" ? "text-red-600" : "text-slate-700"
                  }`}
                >
                  {group}
                  <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {grouped.get(group)!.length}
                  </span>
                </h2>
                <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {grouped.get(group)!.map((todo) => {
                    const done = todo.status === "done";
                    const owner = memberName(todo.assigned_to);
                    return (
                      <li
                        key={todo.id}
                        className="flex items-start gap-3 px-5 py-3.5"
                      >
                        <button
                          onClick={() => toggleDone(todo)}
                          aria-label={
                            done ? `Reopen ${todo.title}` : `Complete ${todo.title}`
                          }
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition ${
                            done
                              ? "border-green bg-green text-white"
                              : "border-slate-300 hover:border-green"
                          }`}
                        >
                          {done && <Check className="size-3.5" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium ${
                              done
                                ? "text-slate-400 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {todo.title}
                          </p>
                          {todo.description && (
                            <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                              {todo.description}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            {!done && (
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1 ${PRIORITY_STYLES[todo.priority]}`}
                              >
                                {todo.priority}
                              </span>
                            )}
                            {todo.due_date && (
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  !done && todo.due_date < today
                                    ? "font-medium text-red-500"
                                    : ""
                                }`}
                              >
                                <CalendarDays className="size-3" />
                                {formatDue(todo.due_date)}
                              </span>
                            )}
                            {scope !== "mine" && owner && (
                              <span className="inline-flex items-center gap-1">
                                <UserRound className="size-3" />
                                {owner}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => openEdit(todo)}
                            aria-label={`Edit ${todo.title}`}
                            className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => remove(todo)}
                            aria-label={`Delete ${todo.title}`}
                            className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )
          )}
        </div>
      )}

      {editor && (
        <Modal
          title={editor.mode === "add" ? "Add a to-do" : "Edit to-do"}
          onClose={() => setEditor(null)}
        >
          <div className="space-y-4">
            <div>
              <label className={label}>What needs doing? *</label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => upd("title", e.target.value)}
                placeholder="Call back about the filter quote"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Details</label>
              <textarea
                value={form.description}
                onChange={(e) => upd("description", e.target.value)}
                rows={3}
                placeholder="Anything worth remembering"
                className={`${input} resize-none`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>How urgent?</label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    upd("priority", e.target.value as Todo["priority"])
                  }
                  className={input}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className={label}>Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => upd("dueDate", e.target.value)}
                  className={input}
                />
              </div>
            </div>

            {superAdmin && (
              <div>
                <label className={label}>Who&apos;s doing it?</label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => upd("assignedTo", e.target.value)}
                  className={input}
                >
                  <option value="">Nobody yet</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id === me?.id
                        ? "Me"
                        : m.full_name?.trim() || m.email}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">
                  They&apos;ll get a notification, and a reminder as the due
                  date comes up.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={save}
            disabled={busy || !form.title.trim()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {editor.mode === "add" ? "Add to-do" : "Save changes"}
          </button>
        </Modal>
      )}
    </>
  );
}
