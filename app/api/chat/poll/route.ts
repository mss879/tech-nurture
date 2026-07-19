import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* The chat widget polls this to receive the human team's replies (role 'agent')
   and to learn whether the conversation has switched to manual mode. Read-only,
   scoped to the caller's own (random, client-held) session id, via the
   service-role key so the public anon key can't read transcripts directly. */
export async function GET(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return Response.json({ messages: [], mode: "ai", status: "open" });
  }

  const url = new URL(request.url);
  const sessionId = (url.searchParams.get("sessionId") || "").slice(0, 128);
  const after = url.searchParams.get("after");
  if (!sessionId) {
    return Response.json({ messages: [], mode: "ai", status: "open" });
  }

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("mode, status")
    .eq("session_id", sessionId)
    .maybeSingle();

  let q = supabase
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .eq("role", "agent")
    .order("created_at", { ascending: true })
    .limit(50);
  if (after) q = q.gt("created_at", after);
  const { data: msgs } = await q;

  return Response.json({
    messages: msgs ?? [],
    mode: session?.mode ?? "ai",
    status: session?.status ?? "open",
  });
}
