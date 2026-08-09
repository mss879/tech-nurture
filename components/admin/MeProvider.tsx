"use client";

import { createContext, useContext } from "react";
import type { AdminProfile, Capability } from "@/lib/admin/types";
import { can, isDeptHead, isOverseer, isSuperAdmin } from "@/lib/admin/types";

/* Makes the signed-in person's profile available to every admin client
   component. Fed once by the server layout, so views can hide buttons
   they aren't allowed to press without fetching anything. */

const MeContext = createContext<AdminProfile | null>(null);

export function AdminMeProvider({
  me,
  children,
}: {
  me: AdminProfile;
  children: React.ReactNode;
}) {
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function useMe() {
  return useContext(MeContext);
}

export function useIsSuperAdmin() {
  const me = useMe();
  return me ? isSuperAdmin(me) : false;
}

export function useIsDeptHead() {
  const me = useMe();
  return me ? isDeptHead(me) : false;
}

/* Whether to offer the "whole team" views at all — the super admin's
   everyone, or a head's department. */
export function useIsOverseer() {
  const me = useMe();
  return me ? isOverseer(me) : false;
}

/* Hiding a button is a courtesy, not protection — the API route checks the
   same capability before it writes anything. */
export function useCan(capability: Capability) {
  const me = useMe();
  return me ? can(me, capability) : false;
}
