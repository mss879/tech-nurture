"use client";

import { Loader2, PlugZap, AlertTriangle } from "lucide-react";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLKR(amount: number) {
  return `Rs ${Number(amount).toLocaleString("en-LK")}`;
}

/* Consistent fetch helper: throws with the API's error message,
   and flags 503 so screens can show the "connect Supabase" state. */
export class ApiError extends Error {
  notConfigured: boolean;
  constructor(message: string, notConfigured = false) {
    super(message);
    this.notConfigured = notConfigured;
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed (${res.status})`,
      res.status === 503
    );
  }
  return data as T;
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-24 text-slate-400">
      <Loader2 className="size-7 animate-spin" />
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError | Error;
  onRetry?: () => void;
}) {
  const notConfigured = error instanceof ApiError && error.notConfigured;

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
      {notConfigured ? (
        <>
          <PlugZap className="mx-auto size-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            Connect Supabase to activate the admin
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Add your project keys to{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              technature-web/.env.local
            </code>{" "}
            and run the SQL files in{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              supabase/migrations
            </code>{" "}
            (001 → 011) in the Supabase SQL editor. Then restart the dev
            server.
          </p>
        </>
      ) : (
        <>
          <AlertTriangle className="mx-auto size-10 text-amber-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error.message}</p>
        </>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

const badgeStyles: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-200",
  contacted: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-violet-50 text-violet-700 ring-violet-200",
  delivered: "bg-green-50 text-green-700 ring-green-200",
  cancelled: "bg-red-50 text-red-600 ring-red-200",
  in_crm: "bg-teal-50 text-teal-700 ring-teal-200",
  closed: "bg-slate-100 text-slate-500 ring-slate-200",
  // service bookings
  handling: "bg-orange-50 text-orange-700 ring-orange-200",
  completed: "bg-green-50 text-green-700 ring-green-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        badgeStyles[status] ?? "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
