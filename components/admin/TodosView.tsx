"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  CalendarDays,
  UserRound,
  AtSign,
  Search,
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
import MentionField, { personLabel, type MentionPerson } from "./MentionField";
import LinkPicker, { LinkChips, type TodoLink } from "./LinkPicker";
import { isDeptHead, isSuperAdmin } from "@/lib/admin/types";

type Todo = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "done";
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  /* Who's on the hook, and who was just looped in. Both come straight
     from the todos_for function in 023, already scoped to what the caller
     may see. */
  assignees: string[];
  mentions: string[];
  /* The enquiries, leads, orders and bookings this to-do is about, with
     their labels already resolved by todo_link_labels in 024. */
  links: TodoLink[];
};

type Member = MentionPerson & { role: string };

type Form = {
  title: string;
  description: string;
  priority: Todo["priority"];
  dueDate: string;
  assignees: string[];
  mentions: string[];
  links: TodoLink[];
};

const emptyForm: Form = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assignees: [],
  mentions: [],
  links: [],
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

type Scope = "mine" | "mentioned" | "created" | "department" | "all";

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
  const deptHead = me ? isDeptHead(me) : false;
  /* Who may hand work to somebody else. Everyone else still gets the
     picker for mentions — looping a colleague in is not the same as
     giving them a job. */
  const mayAssignOthers = superAdmin || deptHead;

  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<Scope>("mine");

  const [editor, setEditor] = useState<
    { mode: "add" } | { mode: "edit"; todo: Todo } | null
  >(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [peopleFilter, setPeopleFilter] = useState("");

  const today = colomboToday();

  /* Everyone gets these three. The wider views are the point of being a
     head or the owner, so they're added rather than swapped in. */
  const scopes: [Scope, string][] = [
    ["mine", "Assigned to me"],
    ["mentioned", "Mentioning me"],
    ["created", "Created by me"],
    ...(deptHead ? ([["department", "My department"]] as [Scope, string][]) : []),
    ...(superAdmin ? ([["all", "Everyone's"]] as [Scope, string][]) : []),
  ];

  const load = useCallback(async (which: Scope) => {
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

  const memberName = (id: string) => {
    if (id === me?.id) return "You";
    const m = members.find((x) => x.id === id);
    return m ? personLabel(m) : "Someone";
  };

  const onlyMentioned = (todo: Todo) =>
    !!me && todo.mentions.includes(me.id) && !todo.assignees.includes(me.id);

  /* Mirrors todo_access in 023 so the list never offers a button that
     comes straight back as a 403. The server is the authority; this is
     courtesy. A mention is read-only — that split is the whole point of
     mentioning somebody rather than assigning them. */
  const canEdit = (todo: Todo) =>
    superAdmin ||
    (!onlyMentioned(todo) &&
      (deptHead ||
        todo.created_by === me?.id ||
        (me ? todo.assignees.includes(me.id) : false)));

  /* Narrower than editing on purpose. Being one of four assignees
     shouldn't let you bin the other three's work — mark it done instead. */
  const canDelete = (todo: Todo) =>
    superAdmin ||
    (!onlyMentioned(todo) && (deptHead || todo.created_by === me?.id));

  const filteredMembers = useMemo(() => {
    const q = peopleFilter.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        personLabel(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, peopleFilter]);

  const toggleAssignee = (id: string) =>
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(id)
        ? f.assignees.filter((x) => x !== id)
        : [...f.assignees, id],
      // Being on the hook beats being looped in — the server enforces the
      // same thing, and the participants table can't hold both.
      mentions: f.mentions.filter((x) => x !== id),
    }));

  const openAdd = () => {
    setForm({ ...emptyForm, assignees: me?.id ? [me.id] : [] });
    setPeopleFilter("");
    setEditor({ mode: "add" });
  };

  const openEdit = (todo: Todo) => {
    setForm({
      title: todo.title,
      description: todo.description ?? "",
      priority: todo.priority,
      dueDate: todo.due_date ?? "",
      assignees: todo.assignees,
      mentions: todo.mentions,
      links: todo.links ?? [],
    });
    setPeopleFilter("");
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
        // A member can only ever give work to themselves, so don't send a
        // list they aren't allowed to set — the route would 403 on it.
        assignedTo: mayAssignOthers ? form.assignees : undefined,
        mentions: form.mentions,
        // Only kind and id are trusted; the labels are re-resolved in SQL.
        links: form.links.map((l) => ({ kind: l.kind, id: l.id })),
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

      <div className="mb-6 flex flex-wrap gap-2">
        {scopes.map(([key, text]) => (
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

      {todos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
          <p className="text-slate-500">
            {scope === "mentioned"
              ? "Nobody has tagged you on anything yet."
              : "Nothing here yet. Add a to-do to keep track of what needs doing."}
          </p>
          {scope !== "mentioned" && (
            <button
              onClick={openAdd}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus className="size-4" /> Add to-do
            </button>
          )}
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
                    const canAct = canEdit(todo);
                    const canBin = canDelete(todo);
                    const tagged = onlyMentioned(todo);
                    // On "Assigned to me" everyone in the list is you, so
                    // naming people would just be noise.
                    const showPeople =
                      scope !== "mine" || todo.assignees.length > 1;
                    return (
                      <li
                        key={todo.id}
                        className="flex items-start gap-3 px-5 py-3.5"
                      >
                        <button
                          onClick={() => toggleDone(todo)}
                          disabled={!canAct}
                          aria-label={
                            done ? `Reopen ${todo.title}` : `Complete ${todo.title}`
                          }
                          title={
                            canAct
                              ? undefined
                              : "You're only mentioned on this one"
                          }
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition ${
                            done
                              ? "border-green bg-green text-white"
                              : "border-slate-300 hover:border-green"
                          } ${canAct ? "" : "cursor-not-allowed opacity-40"}`}
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
                            {showPeople && todo.assignees.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <UserRound className="size-3" />
                                {namesFor(todo.assignees, memberName)}
                              </span>
                            )}
                            {tagged && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-500">
                                <AtSign className="size-2.5" />
                                mentioned
                              </span>
                            )}
                          </div>
                          <LinkChips links={todo.links ?? []} />
                        </div>

                        {(canAct || canBin) && (
                          <div className="flex shrink-0 gap-1">
                            {canAct && (
                              <button
                                onClick={() => openEdit(todo)}
                                aria-label={`Edit ${todo.title}`}
                                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                              >
                                <Pencil className="size-4" />
                              </button>
                            )}
                            {canBin && (
                              <button
                                onClick={() => remove(todo)}
                                aria-label={`Delete ${todo.title}`}
                                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        )}
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
          size="lg"
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
              <MentionField
                value={form.description}
                onChange={(v) => upd("description", v)}
                people={members}
                mentioned={form.mentions}
                onMentionedChange={(ids) => upd("mentions", ids)}
                placeholder="Anything worth remembering. Type @ to loop someone in."
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

            <div>
              <label className={label}>What&apos;s it about?</label>
              <LinkPicker
                value={form.links}
                onChange={(links) => upd("links", links)}
              />
            </div>

            {mayAssignOthers && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={`${label} mb-0`}>Who&apos;s doing it?</label>
                  <span className="text-xs text-slate-400">
                    {form.assignees.length === 0
                      ? "Nobody yet"
                      : `${form.assignees.length} selected`}
                  </span>
                </div>

                {members.length > 6 && (
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={peopleFilter}
                      onChange={(e) => setPeopleFilter(e.target.value)}
                      placeholder="Find someone"
                      className={`${input} pl-9`}
                    />
                  </div>
                )}

                <div className="max-h-52 space-y-1 overflow-auto rounded-xl border border-slate-200 p-3">
                  {filteredMembers.length === 0 ? (
                    <p className="px-1 py-2 text-sm text-slate-400">
                      Nobody matches that.
                    </p>
                  ) : (
                    filteredMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.assignees.includes(m.id)}
                          onChange={() => toggleAssignee(m.id)}
                          className="size-4 accent-green"
                        />
                        <span className="truncate">
                          {m.id === me?.id ? "Me" : personLabel(m)}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Everyone ticked gets a notification, and a reminder as the
                  due date comes up. Leave it empty and it&apos;s yours.
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

/* Three names, then a count. Past that the row wraps onto a third line
   and the due date stops being the thing you notice. */
function namesFor(ids: string[], nameOf: (id: string) => string) {
  const shown = ids.slice(0, 3).map(nameOf).join(", ");
  const rest = ids.length - 3;
  return rest > 0 ? `${shown} +${rest}` : shown;
}
