import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav } from "@/lib/admin/permissions";

export const runtime = "nodejs";

type LastMsg = {
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

/* GET
   - ?count=pending → { pending } : open conversations awaiting a human (for the badge)
   - ?id=<sessionId> → { session, messages } : one conversation's full thread
   - (none)         → { sessions } : all conversations, newest activity first, each
                                     annotated with its last message                */
export async function GET(request: Request) {
  const gate = await requireNav("chats");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const url = new URL(request.url);

  if (url.searchParams.get("count") === "pending") {
    const { count } = await supabase
      .from("chat_sessions")
      .select("session_id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("mode", "ai")
      .not("handoff_requested_at", "is", null);
    return Response.json({ pending: count ?? 0 });
  }

  const id = url.searchParams.get("id");
  if (id) {
    const [{ data: session }, { data: messages }] = await Promise.all([
      supabase.from("chat_sessions").select("*").eq("session_id", id).maybeSingle(),
      supabase
        .from("ai_messages")
        .select("id, role, content, created_at")
        .eq("session_id", id)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);
    if (!session) {
      return Response.json({ error: "Conversation not found." }, { status: 404 });
    }
    return Response.json({ session, messages: messages ?? [] });
  }

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("chats list failed:", error);
    return Response.json(
      { error: "Could not load conversations. Have you run 013_live_chat.sql?" },
      { status: 500 }
    );
  }

  // Attach each session's most recent message as a preview.
  const ids = (sessions ?? []).map((s) => s.session_id);
  const lastBy = new Map<string, LastMsg>();
  if (ids.length > 0) {
    const { data: recent } = await supabase
      .from("ai_messages")
      .select("session_id, role, content, created_at")
      .in("session_id", ids)
      .order("created_at", { ascending: false })
      .limit(400);
    for (const m of (recent ?? []) as LastMsg[]) {
      if (!lastBy.has(m.session_id)) lastBy.set(m.session_id, m);
    }
  }

  return Response.json({
    sessions: (sessions ?? []).map((s) => ({
      ...s,
      last: lastBy.get(s.session_id) ?? null,
    })),
  });
}

/* POST { sessionId, content } — reply as the human team. Auto-switches the
   conversation to manual so the AI stops answering. */
export async function POST(request: Request) {
  const gate = await requireNav("chats");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!sessionId || !content) {
    return Response.json(
      { error: "sessionId and content are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("ai_messages")
    .insert({ session_id: sessionId, role: "agent", content: content.slice(0, 4000) });
  if (error) {
    console.error("agent message insert failed:", error);
    return Response.json({ error: "Could not send message." }, { status: 500 });
  }

  await supabase
    .from("chat_sessions")
    .update({ mode: "manual", last_message_at: new Date().toISOString() })
    .eq("session_id", sessionId);

  return Response.json({ ok: true });
}

/* PATCH { sessionId, mode?, status? } — toggle AI/manual, open/close. */
export async function PATCH(request: Request) {
  const gate = await requireNav("chats");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.mode === "ai" || body.mode === "manual") update.mode = body.mode;
  if (body.status === "open" || body.status === "closed") update.status = body.status;
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("chat_sessions")
    .update(update)
    .eq("session_id", body.sessionId);
  if (error) {
    console.error("chat session update failed:", error);
    return Response.json({ error: "Could not update conversation." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

/* DELETE ?id=<sessionId> — remove a conversation and its messages. */
export async function DELETE(request: Request) {
  const gate = await requireNav("chats");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  await supabase.from("ai_messages").delete().eq("session_id", id);
  const { error } = await supabase.from("chat_sessions").delete().eq("session_id", id);
  if (error) {
    console.error("chat delete failed:", error);
    return Response.json({ error: "Could not delete conversation." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
