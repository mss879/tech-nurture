"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/* Shown when someone is signed in but has no active admin profile —
   either an account created straight in the Supabase dashboard, or one a
   super admin has switched off. Signing out has to be available here, or
   they'd have no way to try a different account. */
export default function NoAccessView() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await createBrowserSupabase().auth.signOut();
    } catch {
      // ignore — still send them to the login screen
    }
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/tech-nature-side.png"
          alt="TechNurture"
          width={200}
          height={61}
          className="mx-auto h-10 w-auto brightness-0 invert"
          priority
        />
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <ShieldAlert className="mx-auto size-9 text-amber-400" />
          <h1 className="mt-4 text-base font-semibold text-white">
            Your account doesn&apos;t have access yet
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            You&apos;re signed in, but an administrator hasn&apos;t set up your
            dashboard access — or it has been switched off. Ask them to add you
            under <span className="text-white/80">Users &amp; Access</span>.
          </p>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink transition hover:bg-lime-bright disabled:opacity-60"
          >
            {signingOut && <Loader2 className="size-4 animate-spin" />}
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
