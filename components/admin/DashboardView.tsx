"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  KanbanSquare,
  ArrowUpRight,
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

type Summary = {
  stats: {
    total_enquiries: number;
    new_enquiries: number;
    pipelines: number;
    leads: number;
  };
  recentEnquiries: {
    id: string;
    created_at: string;
    name: string;
    phone: string;
    service: string | null;
    status: string;
  }[];
};

export default function DashboardView() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api<Summary>("/api/admin/summary"));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (error || !data) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          sub="Overview of enquiries and your CRM."
        />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  const { stats } = data;
  const cards = [
    {
      label: "Enquiries",
      value: stats.total_enquiries,
      hint: `${stats.new_enquiries} new`,
      icon: MessageSquare,
      href: "/admin/enquiries",
    },
    {
      label: "CRM",
      value: stats.leads,
      hint: `${stats.pipelines} pipeline${stats.pipelines === 1 ? "" : "s"}`,
      icon: KanbanSquare,
      href: "/admin/crm",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        sub="Overview of orders, enquiries and your CRM."
      />

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-green/10">
                <c.icon className="size-5 text-green" />
              </span>
              <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-green" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {c.value}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              {c.label} <span className="text-slate-300">·</span>{" "}
              <span className="text-slate-400">{c.hint}</span>
            </p>
          </Link>
        ))}
      </div>

      {/* recent previews */}
      <div className="mt-8 grid gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-800">Recent enquiries</h2>
            <Link
              href="/admin/enquiries"
              className="text-sm font-medium text-green hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentEnquiries.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              No enquiries yet — contact form submissions land here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentEnquiries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {e.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {e.service ?? "General"} · {formatDate(e.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
