"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  X,
  Loader2,
} from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  PageHeader,
  formatLKR,
} from "./ui";

type Lead = {
  id: string;
  created_at: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: "manual" | "enquiry";
  enquiry_id: string | null;
  value: number | null;
  notes: string | null;
};

type Stage = { id: string; name: string; position: number };

type Pipeline = {
  id: string;
  name: string;
  created_at: string;
  crm_stages: Stage[];
  crm_leads: Lead[];
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

export default function CrmView() {
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null);
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

  // lead add/edit
  const [leadModal, setLeadModal] = useState<
    { mode: "add" } | { mode: "edit"; lead: Lead } | null
  >(null);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);

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

  const active = pipelines?.find((p) => p.id === activeId) ?? null;

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
      alert((e as Error).message);
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
      alert((e as Error).message);
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
      alert((e as Error).message);
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
      await load(active.id);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Move a lead to a specific stage (optimistic), used by both the
  // ◄ ► buttons and drag-and-drop.
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
      alert((e as Error).message);
      await load(active.id);
    }
  };

  const moveLead = (lead: Lead, direction: -1 | 1) => {
    if (!active) return;
    const stages = active.crm_stages;
    const idx = stages.findIndex((s) => s.id === lead.stage_id);
    const target = stages[idx + direction];
    if (!target) return;
    moveLeadToStage(lead.id, target.id);
  };

  const onDropToStage = (stageId: string) => {
    setDragOverStage(null);
    const id = dragLeadId;
    setDragLeadId(null);
    if (!id) return;
    const lead = active?.crm_leads.find((l) => l.id === id);
    if (lead && lead.stage_id !== stageId) moveLeadToStage(id, stageId);
  };

  const deleteLead = async (lead: Lead) => {
    if (!active) return;
    if (!confirm(`Delete lead "${lead.name}"?`)) return;
    try {
      await api(`/api/admin/crm/leads?id=${lead.id}`, { method: "DELETE" });
      await load(active.id);
    } catch (e) {
      alert((e as Error).message);
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

  return (
    <>
      <PageHeader title="CRM" sub="Drag leads between stages, or use the arrows.">
        <button
          onClick={() => {
            setPipelineName("");
            setAddingPipeline(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="size-4" /> New pipeline
        </button>
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
              <button
                onClick={openAddLead}
                className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-bright"
              >
                <Plus className="size-4" /> Add lead
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
            </div>
          )}
        </div>
      )}

      {/* board */}
      {pipelines.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
          <p className="text-slate-500">
            No pipelines yet. Create your first pipeline to start tracking
            leads — enquiries can be sent here from the Enquiries page.
          </p>
          <button
            onClick={() => {
              setPipelineName("");
              setAddingPipeline(true);
            }}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="size-4" /> Create pipeline
          </button>
        </div>
      ) : active ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {active.crm_stages.map((stage, stageIdx) => {
            const leads = active.crm_leads
              .filter((l) => l.stage_id === stage.id)
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );
            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.id);
                }}
                onDragLeave={() =>
                  setDragOverStage((s) => (s === stage.id ? null : s))
                }
                onDrop={() => onDropToStage(stage.id)}
                className={`flex w-72 shrink-0 flex-col rounded-2xl p-3 transition-colors ${
                  dragOverStage === stage.id
                    ? "bg-lime/20 ring-2 ring-lime"
                    : "bg-slate-200/50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between px-1.5">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {stage.name}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                    {leads.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5">
                  {leads.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                      No leads
                    </p>
                  )}
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDragLeadId(lead.id)}
                      onDragEnd={() => {
                        setDragLeadId(null);
                        setDragOverStage(null);
                      }}
                      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition active:cursor-grabbing ${
                        dragLeadId === lead.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {lead.name}
                        </p>
                        {lead.source === "enquiry" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[0.62rem] font-medium text-teal-700">
                            <MessageSquare className="size-2.5" /> Enquiry
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
                        <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                          {lead.notes}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveLead(lead, -1)}
                            disabled={stageIdx === 0}
                            aria-label="Move to previous stage"
                            className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <button
                            onClick={() => moveLead(lead, 1)}
                            disabled={stageIdx === active.crm_stages.length - 1}
                            aria-label="Move to next stage"
                            className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditLead(lead)}
                            aria-label="Edit lead"
                            className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead)}
                            aria-label="Delete lead"
                            className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

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
              if (e.key === "Enter")
                addingPipeline ? createPipeline() : renamePipeline();
            }}
            placeholder="e.g. Sales Pipeline"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
          />
          {addingPipeline && (
            <p className="mt-2 text-xs text-slate-400">
              Created with stages: New → Contacted → Qualified → Won → Lost.
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={leadForm.phone}
                onChange={(e) =>
                  setLeadForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="Phone"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
              />
              <input
                value={leadForm.value}
                onChange={(e) =>
                  setLeadForm((f) => ({ ...f, value: e.target.value }))
                }
                placeholder="Value (Rs)"
                type="number"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
              />
            </div>
            <input
              value={leadForm.email}
              onChange={(e) =>
                setLeadForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="Email"
              type="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
            />
            <textarea
              value={leadForm.notes}
              onChange={(e) =>
                setLeadForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Notes"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green"
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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
