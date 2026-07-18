"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CalendarCheck,
  Users,
  KanbanSquare,
  Newspaper,
  ArrowUpRight,
  Eye,
  UserCheck,
  MapPin,
  Clock,
  Repeat,
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

type Stats = {
  total_enquiries: number;
  new_enquiries: number;
  total_bookings: number;
  new_bookings: number;
  handling_bookings: number;
  completed_bookings: number;
  pipelines: number;
  leads: number;
  total_clients: number;
  returning_clients: number;
  total_posts: number;
  published_posts: number;
  total_views: number;
  unique_visitors: number;
};

type Summary = {
  stats: Stats;
  recentEnquiries: {
    id: string;
    created_at: string;
    name: string;
    service: string | null;
    status: string;
  }[];
  recentBookings: {
    id: string;
    created_at: string;
    name: string;
    service: string;
    district: string;
    preferred_date: string;
    preferred_time: string;
    status: string;
  }[];
};

type Analytics = {
  overview: {
    total_views: number;
    unique_visitors: number;
    views_7d: number;
    unique_7d: number;
    views_24h: number;
  };
  byRegion: { region: string; views: number; unique_visitors: number }[];
  byCity: { city: string; views: number; unique_visitors: number }[];
  byHour: { hour: number; views: number }[];
  topPaths: { path: string; views: number }[];
};

export default function DashboardView() {
  const [data, setData] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, an] = await Promise.all([
        api<Summary>("/api/admin/summary"),
        api<Analytics>("/api/admin/analytics").catch(() => null),
      ]);
      setData(summary);
      setAnalytics(an);
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
        <PageHeader title="Dashboard" sub="Overview of your business." />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  const { stats } = data;
  const cards = [
    {
      label: "Inquiries",
      value: stats.total_enquiries,
      hint: `${stats.new_enquiries} new`,
      icon: MessageSquare,
      href: "/admin/enquiries",
    },
    {
      label: "Bookings",
      value: stats.total_bookings,
      hint: `${stats.new_bookings} new · ${stats.handling_bookings} handling`,
      icon: CalendarCheck,
      href: "/admin/bookings",
    },
    {
      label: "Clients",
      value: stats.total_clients,
      hint: `${stats.returning_clients} returning`,
      icon: Users,
      href: "/admin/clients",
    },
    {
      label: "CRM leads",
      value: stats.leads,
      hint: `${stats.pipelines} pipeline${stats.pipelines === 1 ? "" : "s"}`,
      icon: KanbanSquare,
      href: "/admin/crm",
    },
    {
      label: "Blog posts",
      value: stats.total_posts,
      hint: `${stats.published_posts} published`,
      icon: Newspaper,
      href: "/admin/blog",
    },
  ];

  const maxHour = Math.max(1, ...(analytics?.byHour.map((h) => h.views) ?? [0]));

  return (
    <>
      <PageHeader
        title="Dashboard"
        sub="Inquiries, bookings, clients, content and site traffic at a glance."
      />

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
              {c.label}
              <span className="mt-0.5 block text-xs text-slate-400">
                {c.hint}
              </span>
            </p>
          </Link>
        ))}
      </div>

      {/* analytics */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Site analytics
        </h2>

        {!analytics ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-400">
            Analytics will appear here once{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              008_analytics.sql
            </code>{" "}
            is run and visitors start arriving.
          </div>
        ) : (
          <div className="space-y-4">
            {/* overview tiles */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MiniTile
                icon={UserCheck}
                value={analytics.overview.unique_visitors}
                label="Unique visitors"
              />
              <MiniTile
                icon={Eye}
                value={analytics.overview.total_views}
                label="Total page views"
              />
              <MiniTile
                icon={Users}
                value={analytics.overview.unique_7d}
                label="Unique · last 7 days"
              />
              <MiniTile
                icon={Clock}
                value={analytics.overview.views_24h}
                label="Views · last 24h"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              {/* by-hour bar chart */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="size-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Traffic by hour of day
                  </h3>
                </div>
                {analytics.overview.total_views === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No visits recorded yet.
                  </p>
                ) : (
                  <>
                    <div className="flex h-40 items-end gap-1">
                      {analytics.byHour.map((h) => (
                        <div
                          key={h.hour}
                          className="group relative flex flex-1 flex-col items-center justify-end"
                          title={`${h.hour}:00 — ${h.views} views`}
                        >
                          <div
                            className="w-full rounded-t bg-green/80 transition group-hover:bg-green"
                            style={{
                              height: `${Math.max(
                                2,
                                (h.views / maxHour) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[0.6rem] text-slate-400">
                      <span>12am</span>
                      <span>6am</span>
                      <span>12pm</span>
                      <span>6pm</span>
                      <span>11pm</span>
                    </div>
                  </>
                )}
              </div>

              {/* locations */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="size-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Top locations
                  </h3>
                </div>
                <LocationList
                  rows={
                    (analytics.byCity.some((c) => c.city !== "Unknown")
                      ? analytics.byCity.map((c) => ({
                          name: c.city,
                          views: c.views,
                        }))
                      : analytics.byRegion.map((r) => ({
                          name: r.region,
                          views: r.views,
                        }))) ?? []
                  }
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* recent activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RecentPanel title="Recent bookings" href="/admin/bookings">
          {data.recentBookings.length === 0 ? (
            <Empty text="No bookings yet — they arrive from the /book page." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {b.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {b.service} · {b.district} · {b.preferred_date}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </RecentPanel>

        <RecentPanel title="Recent inquiries" href="/admin/enquiries">
          {data.recentEnquiries.length === 0 ? (
            <Empty text="No inquiries yet — contact form submissions land here." />
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
        </RecentPanel>
      </div>
    </>
  );
}

function MiniTile({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <Icon className="size-5 text-green" />
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function LocationList({ rows }: { rows: { name: string; views: number }[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        No location data yet.
      </p>
    );
  }
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-slate-600">{r.name}</span>
            <span className="shrink-0 pl-2 font-medium text-slate-500">
              {r.views}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-lime-dark"
              style={{ width: `${(r.views / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RecentPanel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <Link
          href={href}
          className="text-sm font-medium text-green hover:underline"
        >
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-6 py-10 text-center text-sm text-slate-400">{text}</p>;
}
