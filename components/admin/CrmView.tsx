"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Lock,
  Loader2,
  Settings2,
  Trophy,
  XCircle,
  UserRound,
  History,
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
  formatLKR,
} from "./ui";
import { useMe } from "./MeProvider";
import { can, isSuperAdmin } from "@/lib/admin/types";

type Lead = {
  id: string;
  created_at: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: "manual" | "enquiry" | "ai";
  enquiry_id: string | null;
  value: number | null;
  notes: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
};

type StageKind = "active" | "won" | "lost";
type Stage = { id: string; name: string; position: number; kind: StageKind };

type Pipeline = {
  id: string;
  name: string;
  created_at: string;
  crm_stages: Stage[];
  crm_leads: Lead[];
};

type Member = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

type HistoryRow = {
  id: string;
  moved_at: string;
  direction: "forward" | "back" | "outcome" | "reopened";
  note: string | null;
  from_stage_id: string | null;
  to_stage_id: string | null;
  moved_by: string | null;
};

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  value: string;
  notes: string;
};

const emptyLeadForm: LeadForm = {
  name: "",
  phone: "",
  email: "",
  value: "",
  notes: "",
};

const input =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green";

export default function CrmView() {
  const me = useMe();
  const toast = useToast();
  const superAdmin = me ? isSuperAdmin(me) : false;
  const mayCreate = me ? can(me, "can_create_leads") : false;
  const mayEdit = me ? can(me, "can_edit_leads") : false;
  const mayDelete = me ? can(me, "can_delete_leads") : false;

  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // drag-and-drop between stages
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // pipeline add/rename
  const [addingPipeline, setAddingPipeline] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [pipelineName, setPipelineName] = useState("");

  // lead add/edit + detail
  const [leadModal, setLeadModal] = useState<
    { mode: "add" } | { mode: "edit"; lead: Lead } | null
  >(null);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const [detail, setDetail] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);

  // stage manager
  const [managingStages, setManagingStages] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [stageToRemove, setStageToRemove] = useState<{
    stage: Stage;
    leads: number;
  } | null>(null);
  const [moveLeadsTo, setMoveLeadsTo] = useState("");

  const load = useCallback(async (keepActive?: string | null) => {
    setError(null);
    try {
      const data = await api<{ pipelines: Pipeline[] }>(
        "/api/admin/crm/pipelines"
      );
      setPipelines(data.pipelines);
      setActiveId((prev) => {
        const target = keepActive ?? prev;
        if (target && data.pipelines.some((p) => p.id === target)) {
          return target;
        }
        return data.pipelines[0]?.id ?? null;
      });
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api<{ members: Member[] }>("/api/admin/team")
      .then((d) => setMembers(d.members ?? []))
      .catch(() => setMembers([]));
  }, []);

  const active = pipelines?.find((p) => p.id === activeId) ?? null;
  const stages = active?.crm_stages ?? [];
  const progressStages = stages.filter((s) => s.kind === "active");
  const outcomeStages = stages.filter((s) => s.kind !== "active");

  const memberName = (id: string | null) => {
    if (!id) return null;
    const m = members.find((x) => x.id === id);
    return m ? m.full_name?.trim() || m.email : "Someone";
  };
  const stageName = (id: string | null) =>
    stages.find((s) => s.id === id)?.name ?? "—";

  /* Mirrors the rule the API enforces, so the board never invites a move
     the server will refuse. */
  const canMoveTo = (lead: Lead, target: Stage) => {
    if (!mayEdit) return false;
    const from = stages.find((s) => s.id === lead.stage_id);
    if (target.id === lead.stage_id) return false;
    if (target.kind !== "active") return true; // Won/Lost from anywhere
    if (from && from.kind !== "active") return superAdmin; // reopening
    if (!from) return true;
    return target.position > from.position || superAdmin;
  };

  /* ---------- pipeline actions ---------- */

  const createPipeline = async () => {
    const name = pipelineName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const res = await api<{ id: string }>("/api/admin/crm/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setAddingPipeline(false);
      setPipelineName("");
      await load(res.id);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renamePipeline = async () => {
    const name = pipelineName.trim();
    if (!name || !active || busy) return;
    setBusy(true);
    try {
      await api("/api/admin/crm/pipelines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, name }),
      });
      setRenaming(false);
      setPipelineName("");
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deletePipeline = async () => {
    if (!active) return;
    if (
      !confirm(
        `Delete pipeline "${active.name}" and all of its leads? This cannot be undone.`
      )
    )
      return;
    try {
      await api(`/api/admin/crm/pipelines?id=${active.id}`, {
        method: "DELETE",
      });
      await load(null);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  /* ---------- stage actions ---------- */

  const addStage = async () => {
    const name = newStageName.trim();
    if (!name || !active || busy) return;
    setBusy(true);
    try {
      await api("/api/admin/crm/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId: active.id, name }),
      });
      setNewStageName("");
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renameStage = async (stage: Stage, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === stage.name || !active) return;
    try {
      await api("/api/admin/crm/stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stage.id, name: trimmed }),
      });
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const moveStage = async (stage: Stage, direction: -1 | 1) => {
    if (!active) return;
    const ordered = [...stages].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((s) => s.id === stage.id);
    const swap = idx + direction;
    if (swap < 0 || swap >= ordered.length) return;
    [ordered[idx], ordered[swap]] = [ordered[swap], ordered[idx]];
    try {
      await api("/api/admin/crm/stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: active.id,
          order: ordered.map((s) => s.id),
        }),
      });
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  /* Two steps: the server answers 409 with how many leads are in the way,
     and the dialog then asks where they should go. */
  const removeStage = async (stage: Stage, moveTo?: string) => {
    if (!active || busy) return;
    setBusy(true);
    const qs = new URLSearchParams({ id: stage.id });
    if (moveTo) qs.set("moveToStageId", moveTo);
    try {
      const res = await fetch(`/api/admin/crm/stages?${qs}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 409 && body?.error === "move_required") {
        setMoveLeadsTo("");
        setStageToRemove({ stage, leads: body.leads ?? 0 });
        return;
      }
      if (!res.ok) {
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      setStageToRemove(null);
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- lead actions ---------- */

  const openAddLead = () => {
    setLeadForm(emptyLeadForm);
    setLeadModal({ mode: "add" });
  };

  const openEditLead = (lead: Lead) => {
    setLeadForm({
      name: lead.name,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      value: lead.value != null ? String(lead.value) : "",
      notes: lead.notes ?? "",
    });
    setLeadModal({ mode: "edit", lead });
  };

  const openDetail = async (lead: Lead) => {
    setDetail(lead);
    setHistory(null);
    try {
      const data = await api<{ history: HistoryRow[] }>(
        `/api/admin/crm/history?leadId=${lead.id}`
      );
      setHistory(data.history);
    } catch {
      setHistory([]);
    }
  };

  const saveLead = async () => {
    if (!leadModal || !active || busy) return;
    if (!leadForm.name.trim()) return;
    setBusy(true);
    try {
      if (leadModal.mode === "add") {
        await api("/api/admin/crm/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineId: active.id, ...leadForm }),
        });
      } else {
        await api("/api/admin/crm/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: leadModal.lead.id, ...leadForm }),
        });
      }
      setLeadModal(null);
      setDetail(null);
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const assignLead = async (lead: Lead, assignedTo: string) => {
    if (!active) return;
    try {
      await api("/api/admin/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, assignedTo: assignedTo || null }),
      });
      toast(
        assignedTo
          ? `${lead.name} is now with ${memberName(assignedTo)}.`
          : `${lead.name} is unassigned.`,
        "success"
      );
      setDetail((d) =>
        d && d.id === lead.id ? { ...d, assigned_to: assignedTo || null } : d
      );
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  // Optimistic, then rolled back by reloading if the server refuses.
  const moveLeadToStage = async (leadId: string, stageId: string) => {
    if (!active) return;
    setPipelines(
      (prev) =>
        prev?.map((p) =>
          p.id !== active.id
            ? p
            : {
                ...p,
                crm_leads: p.crm_leads.map((l) =>
                  l.id === leadId ? { ...l, stage_id: stageId } : l
                ),
              }
        ) ?? null
    );
    try {
      await api("/api/admin/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, stageId }),
      });
    } catch (e) {
      toast((e as Error).message);
      await load(active.id);
    }
  };

  const moveLead = (lead: Lead, direction: -1 | 1) => {
    const ordered = [...stages].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((s) => s.id === lead.stage_id);
    const target = ordered[idx + direction];
    if (!target) return;
    moveLeadToStage(lead.id, target.id);
  };

  const onDropToStage = (stage: Stage) => {
    setDragOverStage(null);
    const id = dragLeadId;
    setDragLeadId(null);
    if (!id) return;
    const lead = active?.crm_leads.find((l) => l.id === id);
    if (!lead || lead.stage_id === stage.id) return;
    if (!canMoveTo(lead, stage)) {
      toast(
        mayEdit
          ? `Leads only move forward. Ask a super admin if "${lead.name}" needs to go back.`
          : "You don't have permission to move leads."
      );
      return;
    }
    moveLeadToStage(id, stage.id);
  };

  const deleteLead = async (lead: Lead) => {
    if (!active) return;
    if (!confirm(`Delete lead "${lead.name}"?`)) return;
    try {
      await api(`/api/admin/crm/leads?id=${lead.id}`, { method: "DELETE" });
      setDetail(null);
      await load(active.id);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  /* ---------- render ---------- */

  if (loading) return <Spinner />;
  if (error || !pipelines) {
    return (
      <>
        <PageHeader title="CRM" sub="Pipelines, stages and leads." />
        <ErrorState error={error ?? new Error("No data")} onRetry={() => load()} />
      </>
    );
  }

  const draggingLead = dragLeadId
    ? (active?.crm_leads.find((l) => l.id === dragLeadId) ?? null)
    : null;

  const renderColumn = (stage: Stage) => {
    const leads = (active?.crm_leads ?? [])
      .filter((l) => l.stage_id === stage.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const blocked = draggingLead ? !canMoveTo(draggingLead, stage) : false;
    const isTarget = dragOverStage === stage.id && !blocked;
    const ordered = [...stages].sort((a, b) => a.position - b.position);
    const stageIdx = ordered.findIndex((s) => s.id === stage.id);

    return (
      <div
        key={stage.id}
        onDragOver={(e) => {
          if (blocked) return;
          e.preventDefault();
          setDragOverStage(stage.id);
        }}
        onDragLeave={() =>
          setDragOverStage((s) => (s === stage.id ? null : s))
        }
        onDrop={() => onDropToStage(stage)}
        className={`flex w-72 shrink-0 flex-col rounded-2xl p-3 transition-colors ${
          isTarget
            ? "bg-lime/20 ring-2 ring-lime"
            : blocked
              ? "bg-slate-200/40 opacity-50"
              : stage.kind === "won"
                ? "bg-green/10"
                : stage.kind === "lost"
                  ? "bg-red-50"
                  : "bg-slate-200/50"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2 px-1.5">
          <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-700">
            {stage.kind === "won" && (
              <Trophy className="size-3.5 shrink-0 text-green" />
            )}
            {stage.kind === "lost" && (
              <XCircle className="size-3.5 shrink-0 text-red-400" />
            )}
            {blocked && <Lock className="size-3 shrink-0 text-slate-400" />}
            <span className="truncate">{stage.name}</span>
          </h3>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
            {leads.length}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          {leads.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
              No leads
            </p>
          )}
          {leads.map((lead) => {
            const owner = memberName(lead.assigned_to);
            return (
              <div
                key={lead.id}
                draggable={mayEdit}
                onDragStart={() => setDragLeadId(lead.id)}
                onDragEnd={() => {
                  setDragLeadId(null);
                  setDragOverStage(null);
                }}
                className={`rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition ${
                  mayEdit ? "cursor-grab active:cursor-grabbing" : ""
                } ${dragLeadId === lead.id ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {lead.name}
                  </p>
                  {lead.source !== "manual" && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[0.62rem] font-medium text-teal-700">
                      <MessageSquare className="size-2.5" />
                      {lead.source === "ai" ? "AI" : "Enquiry"}
                    </span>
                  )}
                </div>
                {(lead.phone || lead.email) && (
                  <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                    {lead.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3 text-slate-300" />
                        {lead.phone}
                      </p>
                    )}
                    {lead.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="size-3 text-slate-300" />
                        {lead.email}
                      </p>
                    )}
                  </div>
                )}
                {lead.value != null && (
                  <p className="mt-1.5 text-xs font-semibold text-green">
                    {formatLKR(lead.value)}
                  </p>
                )}
                {lead.notes && (
                  <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                    {lead.notes}
                  </p>
                )}
                {superAdmin && (
                  <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-slate-500">
                    <UserRound className="size-3 text-slate-300" />
                    {owner ?? (
                      <span className="text-amber-600">Unassigned</span>
                    )}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <div className="flex gap-1">
                    {/* Back is a super-admin correction, not a normal step. */}
                    {superAdmin && (
                      <button
                        onClick={() => moveLead(lead, -1)}
                        disabled={stageIdx === 0 || !mayEdit}
                        aria-label="Move back a stage (correction)"
                        title="Move back a stage — corrections only"
                        className="grid size-7 place-items-center rounded-lg text-amber-500 transition hover:bg-amber-50 disabled:opacity-30"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => moveLead(lead, 1)}
                      disabled={stageIdx === ordered.length - 1 || !mayEdit}
                      aria-label="Move to next stage"
                      className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openDetail(lead)}
                      aria-label="View lead details"
                      className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    {mayEdit && (
                      <button
                        onClick={() => openEditLead(lead)}
                        aria-label="Edit lead"
                        className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                    {mayDelete && (
                      <button
                        onClick={() => deleteLead(lead)}
                        aria-label="Delete lead"
                        className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="CRM"
        sub={
          superAdmin
            ? "Leads move forward through the stages. Mark Won or Lost at any time."
            : "Your leads. They move forward through the stages — Won or Lost at any time."
        }
      >
        {superAdmin && (
          <button
            onClick={() => {
              setPipelineName("");
              setAddingPipeline(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="size-4" /> New pipeline
          </button>
        )}
      </PageHeader>

      {/* pipeline tabs */}
      {pipelines.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                p.id === activeId
                  ? "bg-green text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {p.name}
              <span
                className={`ml-2 text-xs ${
                  p.id === activeId ? "text-white/70" : "text-slate-400"
                }`}
              >
                {p.crm_leads.length}
              </span>
            </button>
          ))}
          {active && (
            <div className="ml-auto flex items-center gap-2">
              {mayCreate && (
                <button
                  onClick={openAddLead}
                  className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-bright"
                >
                  <Plus className="size-4" /> Add lead
                </button>
              )}
              {superAdmin && (
                <>
                  <button
                    onClick={() => {
                      setNewStageName("");
                      setManagingStages(true);
                    }}
                    aria-label="Manage stages"
                    title="Manage stages"
                    className="grid size-9 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    <Settings2 className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setPipelineName(active.name);
                      setRenaming(true);
                    }}
                    aria-label="Rename pipeline"
                    className="grid size-9 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={deletePipeline}
                    aria-label="Delete pipeline"
                    className="grid size-9 place-items-center rounded-full bg-white text-red-500 ring-1 ring-red-100 transition hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* board */}
      {pipelines.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
          <p className="text-slate-500">
            {superAdmin
              ? "No pipelines yet. Create your first pipeline to start tracking leads — enquiries can be sent here from the Enquiries page."
              : "No leads have been assigned to you yet."}
          </p>
          {superAdmin && (
            <button
              onClick={() => {
                setPipelineName("");
                setAddingPipeline(true);
              }}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus className="size-4" /> Create pipeline
            </button>
          )}
        </div>
      ) : active ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {progressStages.map(renderColumn)}
          {outcomeStages.length > 0 && (
            <div
              aria-hidden
              className="my-2 w-px shrink-0 self-stretch bg-slate-300"
            />
          )}
          {outcomeStages.map(renderColumn)}
        </div>
      ) : null}

      {/* lead detail */}
      {detail && (
        <Modal
          title={detail.name}
          sub={`${stageName(detail.stage_id)} · added ${formatDate(detail.created_at)}`}
          size="lg"
          onClose={() => setDetail(null)}
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Phone">
                {detail.phone ? (
                  <a
                    href={`tel:${detail.phone}`}
                    className="text-green hover:underline"
                  >
                    {detail.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">Not given</span>
                )}
              </DetailRow>
              <DetailRow label="Email">
                {detail.email ? (
                  <a
                    href={`mailto:${detail.email}`}
                    className="break-all text-green hover:underline"
                  >
                    {detail.email}
                  </a>
                ) : (
                  <span className="text-slate-400">Not given</span>
                )}
              </DetailRow>
              <DetailRow label="Value">
                {detail.value != null ? (
                  formatLKR(detail.value)
                ) : (
                  <span className="text-slate-400">Not set</span>
                )}
              </DetailRow>
              <DetailRow label="Came from">
                {detail.source === "enquiry"
                  ? "Contact form"
                  : detail.source === "ai"
                    ? "AI chat"
                    : "Added by hand"}
              </DetailRow>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assigned to
              </p>
              {superAdmin ? (
                <select
                  value={detail.assigned_to ?? ""}
                  onChange={(e) => assignLead(detail, e.target.value)}
                  className={input}
                >
                  <option value="">Nobody yet</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name?.trim() || m.email}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-700">
                  {memberName(detail.assigned_to) ?? "Nobody yet"}
                </p>
              )}
            </div>

            {detail.notes && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Notes
                </p>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                  {detail.notes}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <History className="size-3.5" /> Stage history
              </p>
              {history === null ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No moves recorded yet — this lead is still where it started.
                </p>
              ) : (
                <ul className="space-y-2.5 border-l border-slate-200 pl-4">
                  {history.map((h) => (
                    <li key={h.id} className="relative text-sm">
                      <span
                        className={`absolute -left-[1.32rem] top-1.5 size-2 rounded-full ${
                          h.direction === "back" || h.direction === "reopened"
                            ? "bg-amber-400"
                            : h.direction === "outcome"
                              ? "bg-green"
                              : "bg-slate-300"
                        }`}
                      />
                      <p className="text-slate-700">
                        {stageName(h.from_stage_id)} →{" "}
                        <span className="font-medium">
                          {stageName(h.to_stage_id)}
                        </span>
                        {(h.direction === "back" ||
                          h.direction === "reopened") && (
                          <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[0.65rem] font-medium text-amber-700">
                            {h.direction === "back" ? "moved back" : "reopened"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(h.moved_at)}
                        {memberName(h.moved_by)
                          ? ` · ${memberName(h.moved_by)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {(mayEdit || mayDelete) && (
            <div className="mt-6 flex gap-2 border-t border-slate-100 pt-5">
              {mayEdit && (
                <button
                  onClick={() => {
                    openEditLead(detail);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  <Pencil className="size-4" /> Edit
                </button>
              )}
              {mayDelete && (
                <button
                  onClick={() => deleteLead(detail)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="size-4" /> Delete
                </button>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* stage manager */}
      {managingStages && active && (
        <Modal
          title="Stages"
          sub={`${active.name} · leads move left to right`}
          size="lg"
          onClose={() => setManagingStages(false)}
        >
          <ul className="space-y-2">
            {[...stages]
              .sort((a, b) => a.position - b.position)
              .map((stage, i, arr) => {
                const count = (active.crm_leads ?? []).filter(
                  (l) => l.stage_id === stage.id
                ).length;
                return (
                  <li
                    key={stage.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5"
                  >
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveStage(stage, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${stage.name} earlier`}
                        className="grid size-5 place-items-center rounded text-slate-400 transition hover:bg-slate-100 disabled:opacity-25"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        onClick={() => moveStage(stage, 1)}
                        disabled={i === arr.length - 1}
                        aria-label={`Move ${stage.name} later`}
                        className="grid size-5 place-items-center rounded text-slate-400 transition hover:bg-slate-100 disabled:opacity-25"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                    <input
                      defaultValue={stage.name}
                      onBlur={(e) => renameStage(stage, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      aria-label={`Rename ${stage.name}`}
                      className="min-w-0 flex-1 rounded-lg border border-transparent px-2.5 py-1.5 text-sm outline-none transition hover:border-slate-200 focus:border-green"
                    />
                    {stage.kind !== "active" && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                          stage.kind === "won"
                            ? "bg-green/10 text-green"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {stage.kind}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-slate-400">
                      {count}
                    </span>
                    <button
                      onClick={() => removeStage(stage)}
                      aria-label={`Delete ${stage.name}`}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Won and Lost are outcomes, not steps — a lead can be marked with
            either from any stage. Everything else runs in order, and leads
            only move forward through them.
          </p>

          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
            <input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addStage();
              }}
              placeholder="New stage name"
              className={input}
            />
            <button
              onClick={addStage}
              disabled={busy || !newStageName.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        </Modal>
      )}

      {/* deleting a stage that still holds leads */}
      {stageToRemove && (
        <Modal
          title={`Delete "${stageToRemove.stage.name}"?`}
          layer="top"
          onClose={() => setStageToRemove(null)}
        >
          <p className="text-sm leading-relaxed text-slate-600">
            {stageToRemove.leads}{" "}
            {stageToRemove.leads === 1 ? "lead is" : "leads are"} still in this
            stage. Choose where they should go.
          </p>
          <select
            value={moveLeadsTo}
            onChange={(e) => setMoveLeadsTo(e.target.value)}
            className={`${input} mt-4`}
          >
            <option value="">Choose a stage…</option>
            {stages
              .filter((s) => s.id !== stageToRemove.stage.id)
              .sort((a, b) => a.position - b.position)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setStageToRemove(null)}
              className="flex-1 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => removeStage(stageToRemove.stage, moveLeadsTo)}
              disabled={busy || !moveLeadsTo}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Move &amp; delete
            </button>
          </div>
        </Modal>
      )}

      {/* pipeline name modal (add / rename) */}
      {(addingPipeline || renaming) && (
        <Modal
          title={addingPipeline ? "New pipeline" : "Rename pipeline"}
          onClose={() => {
            setAddingPipeline(false);
            setRenaming(false);
          }}
        >
          <input
            autoFocus
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (addingPipeline) createPipeline();
                else renamePipeline();
              }
            }}
            placeholder="e.g. Sales Pipeline"
            className={input}
          />
          {addingPipeline && (
            <p className="mt-2 text-xs text-slate-400">
              Created with stages: New → Contacted → Qualified, plus the Won
              and Lost outcomes. You can change these afterwards.
            </p>
          )}
          <button
            onClick={addingPipeline ? createPipeline : renamePipeline}
            disabled={busy || !pipelineName.trim()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {addingPipeline ? "Create pipeline" : "Save name"}
          </button>
        </Modal>
      )}

      {/* lead modal (add / edit) */}
      {leadModal && (
        <Modal
          title={leadModal.mode === "add" ? "Add lead" : "Edit lead"}
          layer={detail ? "top" : "base"}
          onClose={() => setLeadModal(null)}
        >
          <div className="space-y-3">
            <input
              autoFocus
              value={leadForm.name}
              onChange={(e) =>
                setLeadForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Lead name *"
              className={input}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={leadForm.phone}
                onChange={(e) =>
                  setLeadForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="Phone"
                className={input}
              />
              <input
                value={leadForm.value}
                onChange={(e) =>
                  setLeadForm((f) => ({ ...f, value: e.target.value }))
                }
                placeholder="Value (Rs)"
                type="number"
                className={input}
              />
            </div>
            <input
              value={leadForm.email}
              onChange={(e) =>
                setLeadForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="Email"
              type="email"
              className={input}
            />
            <textarea
              value={leadForm.notes}
              onChange={(e) =>
                setLeadForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Notes"
              rows={3}
              className={`${input} resize-none`}
            />
          </div>
          <button
            onClick={saveLead}
            disabled={busy || !leadForm.name.trim()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {leadModal.mode === "add" ? "Add lead" : "Save changes"}
          </button>
        </Modal>
      )}
    </>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-sm text-slate-700">{children}</p>
    </div>
  );
}
