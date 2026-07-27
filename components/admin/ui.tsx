"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Loader2,
  PlugZap,
  AlertTriangle,
  X,
  CheckCircle2,
  Info,
} from "lucide-react";

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
            and run every SQL file in{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              supabase/migrations
            </code>{" "}
            in order in the Supabase SQL editor. Then restart the dev server.
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

/* ---------- Modal ----------------------------------------------------

   The shared dialog for the whole admin. Closes on backdrop click and on
   Escape, and locks body scroll while open. Stack a second Modal on top
   of a first by passing layer="top" (e.g. an edit form opened from a
   detail view) so it renders above it.                                  */

const modalWidths = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-3xl",
} as const;

// Nested modals each lock scroll; only the last one to close restores it.
let scrollLocks = 0;

export function Modal({
  title,
  sub,
  onClose,
  children,
  size = "sm",
  align = "center",
  layer = "base",
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: keyof typeof modalWidths;
  align?: "center" | "start";
  layer?: "base" | "top";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    scrollLocks += 1;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 grid p-4 ${
        layer === "top" ? "z-[96]" : "z-[95]"
      } ${align === "center" ? "place-items-center" : "place-items-start justify-center"}`}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${modalWidths[size]}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Toasts ---------------------------------------------------

   Non-blocking feedback, so permission and validation messages don't
   need a blocking alert(). Mounted once in AdminShell.                  */

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<
  ((message: string, kind?: ToastKind) => void) | null
>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = "error") => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* above modals (z-[95]/z-[96]) so errors raised inside one are seen */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[110] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ${
              t.kind === "error"
                ? "bg-red-50 text-red-700 ring-red-200"
                : t.kind === "success"
                  ? "bg-green-50 text-green-700 ring-green-200"
                  : "bg-white text-slate-700 ring-slate-200"
            }`}
          >
            {t.kind === "error" ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            ) : t.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0" />
            )}
            <p className="flex-1 leading-relaxed">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="mt-0.5 shrink-0 opacity-50 transition hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* Falls back to alert() when used outside a provider, so a message is
   never silently swallowed. */
export function useToast() {
  const push = useContext(ToastContext);
  return (
    push ??
    ((message: string) => {
      alert(message);
    })
  );
}
