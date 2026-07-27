"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Trash2,
  Phone,
  Mail,
  KanbanSquare,
  Loader2,
  Check,
} from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  StatusBadge,
  PageHeader,
  formatDate,
} from "./ui";
import { useMe } from "./MeProvider";
import { can } from "@/lib/admin/types";

const STATUSES = ["new", "contacted", "in_crm", "closed"];

type Enquiry = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  province: string | null;
  message: string | null;
  status: string;
};

type Pipeline = { id: string; name: string };

export default function EnquiriesView() {
  const me = useMe();
  // Pushing an enquiry into the CRM creates a lead, so it needs the same
  // permission as adding one directly.
  const mayCreateLeads = me ? can(me, "can_create_leads") : false;
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sending, setSending] = useState<string | null>(null);
  const [pipelineChoice, setPipelineChoice] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [enq, pipes] = await Promise.all([
        api<{ enquiries: Enquiry[] }>("/api/admin/enquiries"),
        api<{ pipelines: Pipeline[] }>("/api/admin/crm/pipelines").catch(
          () => ({ pipelines: [] as Pipeline[] })
        ),
      ]);
      setEnquiries(enq.enquiries);
      setPipelines(pipes.pipelines);
      if (pipes.pipelines.length > 0) setPipelineChoice(pipes.pipelines[0].id);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const prev = enquiries;
    setEnquiries(
      (list) => list?.map((x) => (x.id === id ? { ...x, status } : x)) ?? null
    );
    try {
      await api("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      setEnquiries(prev ?? null);
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry permanently?")) return;
    try {
      await api(`/api/admin/enquiries?id=${id}`, { method: "DELETE" });
      setEnquiries((list) => list?.filter((x) => x.id !== id) ?? null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const sendToCrm = async (enquiry: Enquiry) => {
    if (!pipelineChoice) return;
    setSending(enquiry.id);
    try {
      await api("/api/admin/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: pipelineChoice,
          enquiryId: enquiry.id,
        }),
      });
      setEnquiries(
        (list) =>
          list?.map((x) =>
            x.id === enquiry.id ? { ...x, status: "in_crm" } : x
          ) ?? null
      );
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(null);
    }
  };

  if (loading) return <Spinner />;
  if (error || !enquiries) {
    return (
      <>
        <PageHeader
          title="Enquiries"
          sub="Submissions from the contact form."
        />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  const filtered =
    filter === "all" ? enquiries : enquiries.filter((e) => e.status === filter);

  return (
    <>
      <PageHeader title="Enquiries" sub="Submissions from the contact form.">
        <div className="flex flex-wrap gap-1.5">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                filter === s
                  ? "bg-ink text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </PageHeader>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
          {enquiries.length === 0
            ? "No enquiries yet — contact form submissions will appear here."
            : "No enquiries with this status."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const isOpen = expanded === e.id;
            return (
              <div
                key={e.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 text-left transition hover:bg-slate-50/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">
                      {e.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {e.service ?? "General"} · {formatDate(e.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                  <ChevronDown
                    className={`size-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-6 py-5">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-600">
                          <span className="flex items-center gap-2">
                            <Phone className="size-3.5 text-slate-400" />
                            <a
                              href={`tel:${e.phone}`}
                              className="hover:text-green"
                            >
                              {e.phone}
                            </a>
                          </span>
                          {e.email && (
                            <span className="flex items-center gap-2">
                              <Mail className="size-3.5 text-slate-400" />
                              <a
                                href={`mailto:${e.email}`}
                                className="hover:text-green"
                              >
                                {e.email}
                              </a>
                            </span>
                          )}
                          {e.province && (
                            <span className="text-slate-500">
                              {e.province} Province
                            </span>
                          )}
                        </div>
                        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                          {e.message || "No message provided."}
                        </p>
                      </div>

                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Actions
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={e.status}
                            onChange={(ev) =>
                              updateStatus(e.id, ev.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-green"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteEnquiry(e.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </button>
                        </div>

                        {mayCreateLeads && (
                          <>
                        <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Send to CRM
                        </h3>
                        {pipelines.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            No pipelines yet.{" "}
                            <Link
                              href="/admin/crm"
                              className="font-medium text-green hover:underline"
                            >
                              Create one in the CRM
                            </Link>{" "}
                            first.
                          </p>
                        ) : e.status === "in_crm" ? (
                          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600">
                            <Check className="size-4" /> Already in CRM
                          </p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={pipelineChoice}
                              onChange={(ev) =>
                                setPipelineChoice(ev.target.value)
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-green"
                            >
                              {pipelines.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => sendToCrm(e)}
                              disabled={sending === e.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
                            >
                              {sending === e.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <KanbanSquare className="size-3.5" />
                              )}
                              Send to CRM
                            </button>
                          </div>
                        )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
