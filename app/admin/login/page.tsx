"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink">
      <Loader2 className="size-6 animate-spin text-white/40" />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Only allow internal absolute paths — reject absolute ("https://…"),
  // protocol-relative ("//evil.com") and backslash ("/\evil.com") targets
  // that a browser would resolve to an external origin (open-redirect).
  const rawNext = params.get("next") || "/admin";
  const next =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.startsWith("/\\")
      ? rawNext
      : "/admin";
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createBrowserSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      // Session cookies are now set; refresh so the middleware sees them.
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sign in. Try again."
      );
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-lime focus:bg-white/10";

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/tech-nature-side.png"
            alt="TechNurture"
            width={200}
            height={61}
            className="h-10 w-auto brightness-0 invert"
            priority
          />
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-lime">
            <Lock className="size-3" /> Admin access
          </p>
        </div>

        {!configured ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 text-center">
            <AlertTriangle className="mx-auto size-8 text-amber-400" />
            <h1 className="mt-3 text-base font-semibold text-white">
              Supabase isn&apos;t configured yet
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Add your Supabase keys to{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              and create an admin user in the Supabase dashboard
              (Authentication → Users), then restart the dev server.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@technurture.lk"
                  className={field}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={field}
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink transition hover:bg-lime-bright disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-white/30">
          TechNurture admin · authorized users only
        </p>
      </div>
    </div>
  );
}
