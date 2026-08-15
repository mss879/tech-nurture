import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { notify } from "@/lib/admin/notify";
import { buildSystemPrompt, GREETING, contactLine } from "@/lib/ai/context";
import { districtFromAddress } from "@/lib/ai/company";
import {
  isTodayOrLater,
  isSunday,
  weekdayOf,
  nextWeekday,
  nextWorkingDay,
} from "@/lib/ai/now";
import { phoneKey } from "@/lib/phone";
import { getProducts } from "@/lib/products.server";
import { site, bookingServices, bookingTimeSlots, districts } from "@/lib/site";

/* Who an AI-captured lead belongs to until someone hands it on. There is
   exactly one super admin — the owner — so this is unambiguous. Returns
   null before 014 has run, in which case the lead stays unassigned, which
   is the old behaviour. */
async function superAdminId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("role", "super_admin")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export const runtime = "nodejs";
/* Headroom for a multi-step turn: the model may call a tool, get a
   correctable failure back, and call again before it writes its reply. */
export const maxDuration = 60;

const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;
const MAX_SESSION_ID = 128;

/* The model is configurable so the assistant can be upgraded without a code
   change. gpt-4o-mini is the proven default on the client's current key. */
const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

const NOT_CONFIGURED_REPLY = `I'm just being set up right now — please ${contactLine()} and our team will help you straight away.`;
const ERROR_REPLY = `Sorry — something went wrong on my side just then. I've alerted our team, and someone will pick this up shortly. If it's urgent, please ${contactLine()}.`;

/* Best-effort in-memory rate limit. Bounds abuse of this public,
   unauthenticated endpoint (which runs a paid OpenAI call and can write
   to the DB via tools). Effective on a single instance; for serverless
   deployments back it with a shared store (e.g. Upstash / Vercel KV) or
   add a bot-check token — see supabase/README.md. */
const WINDOW_MS = 60_000;
const MAX_REQ_PER_WINDOW = 15;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return arr.length > MAX_REQ_PER_WINDOW;
}

/* ---------- matching the customer's words to our fixed lists --------- */

/* The allowed booking options contain typography a model cannot be relied
   on to reproduce byte-for-byte — em dashes in "Air Conditioning — Repair /
   Service", a middle dot in "Morning · 8:30am – 12:00pm". Strict equality
   on those strings failed the booking and blamed the customer. Compare on a
   flattened form instead: dashes and dots become spaces, case and spacing
   stop mattering. */
function flatten(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[‐-―−–—-]/g, " ") // every kind of dash
    .replace(/[·•/,]/g, " ")
    .replace(/[^a-z0-9:.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Canonical option for a free-text value, or null if nothing matches. */
function matchOption(value: string, options: readonly string[]): string | null {
  const v = flatten(value);
  if (!v) return null;

  const exact = options.find((o) => flatten(o) === v);
  if (exact) return exact;

  // "Morning" → "Morning · 8:30am – 12:00pm". A prefix is specific, so it
  // is tried before looser containment.
  const prefix = options.filter((o) => flatten(o).startsWith(v));
  if (prefix.length === 1) return prefix[0];

  // The model sent something longer that wraps the real option.
  const wraps = options.filter((o) => v.includes(flatten(o)));
  if (wraps.length > 0)
    return wraps.sort((a, b) => flatten(b).length - flatten(a).length)[0];

  /* Loose containment last, and only for a value long enough to mean
     something — otherwise "service" alone would match half the list and
     silently book the wrong job. */
  if (v.length >= 6) {
    const loose = options.filter((o) => flatten(o).includes(v));
    if (loose.length === 1) return loose[0];
  }
  return prefix[0] ?? null;
}

/* ---------- phone numbers ------------------------------------------- */

/* Sri Lankan numbers arrive as "0777101001", "077 710 1001", "+94777101001"
   or "94777101001". Keep what the customer typed (the team dials it), but
   confirm it is a plausible number before writing it anywhere. */
function normalizePhone(raw: string): string | null {
  const text = String(raw ?? "").trim();
  const digits = text.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  return text.slice(0, 40);
}

/* ---------- transcript ---------------------------------------------- */

/* Transcript writes are awaited before the response is returned: on a
   serverless host the process can be frozen the moment the response is
   sent, and a fire-and-forget insert is simply lost. An admin reading a
   conversation with holes in it can't help the customer. */
async function logMessage(
  supabase: SupabaseClient,
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const { error } = await supabase
    .from("ai_messages")
    .insert({ session_id: sessionId, role, content });
  if (error) console.error("ai_messages insert failed:", error.message);
}

/* Ensure a chat_sessions row exists and bump its activity; returns the mode. */
async function upsertSession(supabase: SupabaseClient, sessionId: string) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .upsert(
      { session_id: sessionId, last_message_at: new Date().toISOString() },
      { onConflict: "session_id" }
    )
    .select("mode, status")
    .single();
  if (error) {
    console.error("chat session upsert failed:", error.message);
    return { mode: "ai", status: "open" };
  }
  return data ?? { mode: "ai", status: "open" };
}

/* Put a name/phone on the session as soon as we learn it, so the admin chat
   list shows a person rather than "Website visitor" — and so the team can
   call back even if the conversation never reaches a booking. */
async function rememberContact(
  supabase: SupabaseClient,
  sessionId: string,
  info: { name?: string | null; phone?: string | null }
) {
  const patch: Record<string, unknown> = {};
  if (info.name?.trim()) patch.customer_name = info.name.trim();
  if (info.phone?.trim()) patch.customer_phone = info.phone.trim();
  if (Object.keys(patch).length === 0) return;
  const { error } = await supabase
    .from("chat_sessions")
    .update(patch)
    .eq("session_id", sessionId);
  if (error) console.error("chat session contact update failed:", error.message);
}

/* Raise the "this conversation needs a person" flag in /admin/chats. Used
   both when the customer asks for a human and when the assistant breaks. */
async function flagForHuman(supabase: SupabaseClient, sessionId: string) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .update({ handoff_requested_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .select("session_id");
  if (error) {
    console.error("handoff flag failed:", error.message);
    return false;
  }
  // An update that matched no row is not a handoff, however green the
  // result looks — promising a callback nobody was told about is worse
  // than admitting we couldn't do it.
  return (data?.length ?? 0) > 0;
}

/* Pull the most recent phone number out of what the customer typed. Used
   only to salvage a broken conversation, so the team has something to dial. */
function phoneFromMessages(messages: { role: string; content: string }[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "user") continue;
    const m = messages[i].content.match(/(?:\+?94|0)[\s-]?\d[\d\s-]{7,12}/);
    if (m) return normalizePhone(m[0]);
  }
  return null;
}

/* Notify the owner that a visitor asked for a human. In-admin the handoff is
   always flagged; this optional email pings the owner when they're away. No-op
   unless RESEND_API_KEY (+ a recipient) is configured. */
function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string
  );
}

async function notifyOwnerHandoff(
  sessionId: string,
  info: { reason?: string; name?: string; phone?: string }
) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_NOTIFICATION_EMAIL;
  /* Deliberately no fallback to site.email: that address is still a
     placeholder, so falling back to it would send handoff alerts into a
     mailbox nobody reads while looking like it worked. */
  if (!key || !to) {
    if (key && !to)
      console.warn(
        "handoff email skipped: set OWNER_NOTIFICATION_EMAIL to receive these alerts"
      );
    return;
  }
  const from = process.env.RESEND_FROM || `TechNurture <noreply@${site.domain}>`;
  const link = `https://${site.domain}/admin/chats?id=${encodeURIComponent(sessionId)}`;
  // Visitor-supplied values — escape before putting them in HTML.
  const rows = [
    info.name && `Name: ${escapeHtml(info.name)}`,
    info.phone && `Phone: ${escapeHtml(info.phone)}`,
    info.reason && `Reason: ${escapeHtml(info.reason)}`,
  ]
    .filter(Boolean)
    .join("<br>");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "A website visitor wants to talk — TechNurture",
        html: `<p>A visitor on the TechNurture website chat has asked to speak with a person.</p>${
          rows ? `<p>${rows}</p>` : ""
        }<p><a href="${link}">Open the conversation in the admin →</a></p>`,
      }),
    });
    if (!res.ok)
      console.error("handoff email rejected:", res.status, await res.text());
  } catch (e) {
    console.error("handoff email failed:", e);
  }
}

/* ---------- tool-call repair ---------------------------------------- */

/* The SDK throws InvalidToolInputError when the model's arguments don't
   match the schema, and that throw kills the whole turn — which is exactly
   how a real customer got "Sorry, I hit a snag" after typing their name and
   phone number. Models routinely emit a phone number as the JSON number
   777101001 instead of the string "0777101001" (losing the leading zero
   into the bargain). Coerce the primitives back to strings and let the turn
   continue; nothing here needs a second model call. */
function repairToolInput(raw: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const out: Record<string, unknown> = {};
  let changed = false;
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === "number" || typeof v === "boolean") {
      out[k] = String(v);
      changed = true;
    } else if (v === null || v === undefined) {
      /* Empty string rather than dropped: an absent required field would
         fail validation all over again and take the turn down with it,
         whereas "" reaches the tool and comes back as a missing_field the
         model can actually fix. */
      out[k] = "";
      changed = true;
    } else {
      out[k] = v;
    }
  }
  return changed ? JSON.stringify(out) : null;
}

/* ---------- the route ------------------------------------------------ */

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId =
    typeof body?.sessionId === "string" && body.sessionId
      ? body.sessionId.slice(0, MAX_SESSION_ID)
      : "anon";

  // Best-effort rate limit before any paid/DB work.
  /* Keyed on the IP alone. Including the caller-supplied sessionId let a
     script mint a fresh id per request and never hit the cap at all — the
     limit has to be on something the caller doesn't choose. */
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({
      mode: "ai",
      content:
        "You're sending messages a little too fast — please wait a few seconds and try again.",
    });
  }

  // Accept user/assistant/agent history; the human 'agent' turns are shown to
  // the model as assistant turns for context.
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .slice(-100)
    .filter(
      (m: unknown): m is { role: string; content: string } =>
        !!m &&
        typeof m === "object" &&
        "role" in m &&
        (m.role === "user" || m.role === "assistant" || m.role === "agent") &&
        "content" in m &&
        typeof (m as { content: unknown }).content === "string"
    )
    .slice(-MAX_MESSAGES)
    .map((m: { role: string; content: string }) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content.slice(0, MAX_CHARS),
    }));

  if (messages.length === 0)
    return Response.json({ mode: "ai", content: GREETING });

  const supabase = getServerSupabase();

  // Without Supabase we can't persist or check mode — degrade gracefully.
  if (!supabase) return Response.json({ mode: "ai", content: NOT_CONFIGURED_REPLY });

  /* The agent needs to read chat_sessions (for manual-mode takeover) and
     write enquiries/CRM rows, none of which the public anon key may do. On
     the anon key it would half-work — bookings saved, takeover ignored,
     leads dropped — so say so loudly rather than fail in pieces. */
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "AI chat disabled: SUPABASE_SERVICE_ROLE_KEY is required (the anon key cannot read chat sessions or write leads)."
    );
    return Response.json({ mode: "ai", content: NOT_CONFIGURED_REPLY });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  // Record the session + the incoming message, and read the current mode.
  const session = await upsertSession(supabase, sessionId);
  if (lastUser) await logMessage(supabase, sessionId, "user", lastUser.content);

  // Manual mode → a human is handling this chat; don't run the AI. The widget
  // will show the team's replies via polling.
  if (session.mode === "manual") {
    return Response.json({ mode: session.mode, content: null });
  }

  /* A conversation the team closed shouldn't swallow the visitor's messages.
     Reopen it — they came back with something new — and flag it so whoever
     closed it sees the reply. */
  if (session.status === "closed") {
    await supabase
      .from("chat_sessions")
      .update({ status: "open" })
      .eq("session_id", sessionId);
    await flagForHuman(supabase, sessionId);
  }

  // AI mode but no key yet → graceful reply. The message is still saved, so a
  // human can pick it up from the admin.
  if (!process.env.OPENAI_API_KEY) {
    await logMessage(supabase, sessionId, "assistant", NOT_CONFIGURED_REPLY);
    return Response.json({ mode: "ai", content: NOT_CONFIGURED_REPLY });
  }

  /* One booking and one lead per request, counted only when the write
     actually lands. The old code decremented before the insert, so a booking
     that failed spent the budget and the save_lead fallback was then refused
     as "rate_limited" — the customer had handed over their name, phone and
     address and ended up as zero rows anywhere. */
  let bookingsCreated = 0;
  let leadsCreated = 0;
  /* If a lead was filed before the booking landed, we go back and say so on
     the enquiry, so nobody rings a customer who is already in the diary. */
  let leadEnquiryId: string | null = null;
  let leadPhoneKey: string | null = null;

  // Only the opening turn should be greeted; mid-conversation the greeting
  // instruction made the model reintroduce itself over and over.
  const firstTurn =
    messages.filter((m: { role: string }) => m.role === "user").length <= 1;

  /* The shop the assistant is sitting next to. Read live so a product added
     in the admin is quotable straight away; an empty result just leaves the
     product section out of the prompt. */
  const products = await getProducts().catch((e) => {
    console.error("chat: product catalogue read failed:", e);
    return [];
  });

  const systemPrompt = buildSystemPrompt(new Date(), { firstTurn, products });

  try {
    const result = await generateText({
      model: openai(MODEL),
      /* Customers type their name, phone and home address into this chat.
         OpenAI retains request payloads by default; turn that off so the
         personal data stays in our own database. */
      providerOptions: { openai: { store: false } },
      system: systemPrompt,
      messages,
      /* Room to recover: call a tool, read a correctable failure, fix the
         argument, call again, then write the reply. */
      stopWhen: stepCountIs(8),
      maxRetries: 2,
      repairToolCall: async ({ toolCall }) => {
        const repaired = repairToolInput(toolCall.input);
        if (!repaired) return null;
        console.warn(`repaired tool input for ${toolCall.toolName}`);
        return { ...toolCall, input: repaired };
      },
      tools: {
        create_booking: tool({
          description:
            "Book a service visit once you have name, phone, service, district, a valid future date (YYYY-MM-DD) and a preferred time slot. All arguments are strings — send a phone number as text so its leading zero survives.",
          /* Every field is optional in the SCHEMA and required in the CODE.
             That is deliberate: the SDK throws InvalidToolInputError when a
             field is missing or the wrong JSON type, and that throw aborts
             the whole turn — which is precisely how a customer who had just
             typed their name and phone number got "Sorry, I hit a snag".
             A missing field is a thing the model can fix if we tell it; a
             thrown error is a dead conversation. So the schema accepts what
             the model sends and the checks below hand back a reason it can
             act on. */
          inputSchema: z.object({
            name: z.string().optional().describe("REQUIRED. Customer full name"),
            phone: z
              .string()
              .optional()
              .describe("REQUIRED. Contact phone number, as text (e.g. \"0777101001\")"),
            service: z.string().optional().describe("REQUIRED. Service type (from the allowed list)"),
            district: z
              .string()
              .optional()
              .describe("REQUIRED. Sri Lankan district (from the allowed list)"),
            preferred_date: z
              .string()
              .optional()
              .describe("REQUIRED. Preferred date, format YYYY-MM-DD, today or later"),
            preferred_day: z
              .string()
              .optional()
              .describe(
                "REQUIRED. The weekday you believe preferred_date falls on, e.g. \"Thursday\". Checked against the real calendar."
              ),
            preferred_time: z
              .string()
              .optional()
              .describe("REQUIRED. Preferred time slot (from the allowed list)"),
            email: z.string().optional().describe("Email (optional)"),
            address: z.string().optional().describe("Service address (optional)"),
            message: z.string().optional().describe("Any extra details (optional)"),
          }),
          execute: async (input) => {
            try {
              if (!input.name?.trim()) return { success: false, reason: "missing_contact", missing: "name" };
              const phone = normalizePhone(input.phone ?? "");
              if (!phone) return { success: false, reason: "missing_contact", missing: "phone" };
              for (const field of ["service", "district", "preferred_date", "preferred_time"] as const) {
                if (!input[field]?.trim())
                  return { success: false, reason: "missing_field", missing: field };
              }

              // Learn the customer early: even if the booking fails below,
              // the team can now see and call this person.
              await rememberContact(supabase, sessionId, { name: input.name, phone });

              const date = String(input.preferred_date ?? "").trim();
              if (!isTodayOrLater(date))
                return {
                  success: false,
                  reason: "invalid_date",
                  hint: `"${date}" is not a valid date at or after today. Use the date table in your instructions.`,
                };
              /* Make the model agree with the calendar before we write a
                 visit into the diary. Asking it to name the weekday and
                 checking that name is what catches the failure that started
                 all this: told "this Thursday", it booked a Tuesday and
                 called it Thursday. A date the customer never agreed to is
                 a wasted van and a lost customer. */
              const actualDay = weekdayOf(date);
              const claimedDay = String(input.preferred_day ?? "").trim();
              if (claimedDay && flatten(claimedDay) !== flatten(actualDay)) {
                const corrected = nextWeekday(claimedDay);
                return {
                  success: false,
                  reason: "date_day_mismatch",
                  hint:
                    `${date} is a ${actualDay}, not a ${claimedDay}.` +
                    (corrected
                      ? ` The next ${claimedDay} is ${corrected}. Use that, and tell the customer the day and date you have booked.`
                      : " Re-read the named-days list in your instructions."),
                };
              }

              if (isSunday(date))
                return {
                  success: false,
                  reason: "closed_sunday",
                  hint: `${date} is a Sunday and we are closed. Offer the customer ${nextWorkingDay()} or another working day.`,
                };

              const service = matchOption(input.service ?? "", bookingServices);
              if (!service)
                return { success: false, reason: "invalid_service", allowed: bookingServices };

              /* Customers give a street address, not a district. If the
                 district doesn't match, try to read it out of the address
                 before giving up on them. */
              let district = matchOption(input.district ?? "", districts);
              if (!district) district = districtFromAddress(input.district ?? "");
              if (!district && input.address) district = districtFromAddress(input.address);
              if (!district)
                return { success: false, reason: "invalid_district", allowed: districts };

              const preferred_time = matchOption(input.preferred_time ?? "", bookingTimeSlots);
              if (!preferred_time)
                return { success: false, reason: "invalid_time", allowed: bookingTimeSlots };

              if (bookingsCreated >= 1)
                return { success: false, reason: "rate_limited" };

              /* A model that re-reads the conversation can call this twice
                 for the same visit. Don't give the team a duplicate job. */
              const key = phoneKey(phone);
              if (key) {
                const { data: dupe } = await supabase
                  .from("bookings")
                  .select("id")
                  .eq("phone_key", key)
                  .eq("preferred_date", date)
                  .eq("service", service)
                  .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
                  .limit(1)
                  .maybeSingle();
                if (dupe) {
                  bookingsCreated++;
                  return {
                    success: true,
                    already_booked: true,
                    booking: { name: input.name, service, district, preferred_date: date, preferred_time },
                  };
                }
              }

              const { error } = await supabase.from("bookings").insert({
                name: input.name.trim(),
                phone,
                email: input.email?.trim() || null,
                service,
                district,
                preferred_date: date,
                preferred_time,
                address: input.address?.trim() || null,
                message: input.message?.trim() || null,
                source: "ai",
                status: "new",
              });
              if (error) {
                console.error("ai create_booking failed:", error.message);
                return { success: false, reason: "db_error" };
              }
              bookingsCreated++;

              if (leadEnquiryId && leadPhoneKey && leadPhoneKey === phoneKey(phone)) {
                await supabase
                  .from("enquiries")
                  .update({
                    message: `Visit booked by the AI assistant for ${date} (${weekdayOf(date)}), ${preferred_time} — ${service}. No callback needed unless the customer asks.`,
                  })
                  .eq("id", leadEnquiryId);
              }

              return {
                success: true,
                booking: {
                  name: input.name,
                  service,
                  district,
                  preferred_date: date,
                  preferred_day: weekdayOf(date),
                  preferred_time,
                },
              };
            } catch (e) {
              /* A tool that throws takes the whole turn down with it, so
                 nothing in here is allowed to escape. */
              console.error("create_booking crashed:", e);
              return { success: false, reason: "unexpected_error" };
            }
          },
        }),

        save_lead: tool({
          description:
            "Capture a prospective customer for follow-up / a quotation. Use when they want a callback or quote but aren't ready to pick a date, and as the fallback whenever a booking cannot be completed. Requires at least name and phone. All arguments are strings.",
          // Optional in the schema, required in the code — see create_booking.
          inputSchema: z.object({
            name: z.string().optional().describe("REQUIRED. Customer full name"),
            phone: z.string().optional().describe("REQUIRED. Contact phone number, as text"),
            email: z.string().optional().describe("Email (optional)"),
            service_interest: z.string().optional().describe("Service they're interested in (optional)"),
            district: z.string().optional().describe("Their district or town, if known (optional)"),
            address: z.string().optional().describe("Their address, if given (optional)"),
            message: z.string().optional().describe("Any notes about their need (optional)"),
          }),
          execute: async (input) => {
            try {
              if (!input.name?.trim()) return { success: false, reason: "missing_contact", missing: "name" };
              const phone = normalizePhone(input.phone ?? "");
              if (!phone) return { success: false, reason: "missing_contact", missing: "phone" };

              await rememberContact(supabase, sessionId, { name: input.name, phone });

              /* A confirmed booking IS the follow-up. Left to the prompt
                 alone the model books the visit and then files a lead for
                 the same person, so the team calls a customer who is
                 already in the diary. */
              if (bookingsCreated >= 1)
                return {
                  success: false,
                  reason: "already_booked",
                  hint: "This customer's visit is already booked — there is nothing to follow up. Just confirm the booking to them.",
                };

              if (leadsCreated >= 1) return { success: false, reason: "rate_limited" };

              /* Where the customer is decides who gets dispatched, so keep
                 it even though enquiries has no district column. */
              const district =
                (input.district && matchOption(input.district, districts)) ||
                (input.district && districtFromAddress(input.district)) ||
                (input.address && districtFromAddress(input.address)) ||
                null;
              const location = [district, input.address?.trim()].filter(Boolean).join(" — ");

              const noteLines = [
                input.message?.trim(),
                location && `Location: ${location}`,
                "(Captured by the AI assistant)",
              ].filter(Boolean);

              const { data: enq, error } = await supabase
                .from("enquiries")
                .insert({
                  name: input.name.trim(),
                  phone,
                  email: input.email?.trim() || null,
                  service: input.service_interest?.trim() || null,
                  message: noteLines.join("\n\n"),
                  status: "new",
                })
                .select("id")
                .single();

              if (error || !enq) {
                console.error("ai save_lead failed:", error?.message);
                return { success: false, reason: "db_error" };
              }
              leadsCreated++;
              leadEnquiryId = enq.id as string;
              leadPhoneKey = phoneKey(phone);

              try {
                const { data: pipeline } = await supabase
                  .from("crm_pipelines")
                  .select("id")
                  .order("created_at", { ascending: true })
                  .limit(1)
                  .maybeSingle();
                if (pipeline) {
                  const { data: stage } = await supabase
                    .from("crm_stages")
                    .select("id")
                    .eq("pipeline_id", pipeline.id)
                    .order("position", { ascending: true })
                    .limit(1)
                    .maybeSingle();
                  if (stage) {
                    /* Give it an owner. Everyone except the super admin
                       sees the board filtered to the people they're allowed
                       to see, and an unassigned lead matches nobody — so a
                       lead left with assigned_to NULL is invisible to every
                       department head and member until somebody happens to
                       notice it. Parking it with the owner means it lands
                       in a real inbox with a real notification, and they can
                       hand it on from the board. */
                    const owner = await superAdminId(supabase);

                    const { data: lead } = await supabase
                      .from("crm_leads")
                      .insert({
                        pipeline_id: pipeline.id,
                        stage_id: stage.id,
                        name: input.name.trim(),
                        phone,
                        email: input.email?.trim() || null,
                        source: "ai",
                        enquiry_id: enq.id,
                        assigned_to: owner,
                        assigned_at: owner ? new Date().toISOString() : null,
                        notes:
                          [
                            input.service_interest && `Interest: ${input.service_interest}`,
                            location && `Location: ${location}`,
                            input.message,
                          ]
                            .filter(Boolean)
                            .join("\n") || null,
                      })
                      .select("id")
                      .single();

                    if (owner && lead) {
                      await notify(supabase, [
                        {
                          user_id: owner,
                          kind: "lead_assigned",
                          title: `New AI lead: ${input.name.trim()}`,
                          body: input.service_interest
                            ? `Interested in ${input.service_interest}.`
                            : null,
                          href: "/admin/crm",
                          lead_id: lead.id,
                        },
                      ]);
                    }

                    await supabase
                      .from("enquiries")
                      .update({ status: "in_crm" })
                      .eq("id", enq.id);
                  }
                }
              } catch (e) {
                console.error("ai lead → CRM push failed:", e);
              }

              return { success: true, lead: { name: input.name, phone } };
            } catch (e) {
              console.error("save_lead crashed:", e);
              return { success: false, reason: "unexpected_error" };
            }
          },
        }),

        request_human: tool({
          description:
            "Escalate to a human team member. Call this when the customer explicitly asks to speak to a person / the owner / a real agent, or when you genuinely cannot help. Call it once per conversation. After it succeeds, tell the customer a team member will join the chat shortly.",
          inputSchema: z.object({
            reason: z.string().optional().describe("Short reason for the handoff"),
            name: z.string().optional().describe("Customer name, if known"),
            phone: z.string().optional().describe("Customer phone, if known"),
          }),
          execute: async ({ reason, name, phone }) => {
            try {
              const tidyPhone = phone ? normalizePhone(phone) : null;
              await rememberContact(supabase, sessionId, { name, phone: tidyPhone });
              const flagged = await flagForHuman(supabase, sessionId);
              if (!flagged) return { success: false, reason: "db_error" };
              await notifyOwnerHandoff(sessionId, {
                reason,
                name,
                phone: tidyPhone ?? undefined,
              });
              return {
                success: true,
                message: "A team member has been notified and will join this chat shortly.",
              };
            } catch (e) {
              console.error("request_human crashed:", e);
              return { success: false, reason: "unexpected_error" };
            }
          },
        }),
      },
    });

    let content = result.text?.trim() ?? "";

    /* The step budget can run out on a tool call, leaving the turn with no
       words in it. Rather than answer a customer with a shrug, ask the model
       once more — with the tool results already in context and no tools to
       call — for the sentence it owed them. */
    if (!content) {
      try {
        const followUp = await generateText({
          model: openai(MODEL),
          system: systemPrompt,
          messages: [
            ...messages,
            ...result.response.messages,
            {
              role: "user" as const,
              content:
                "Write your reply to the customer now, in one or two short sentences. Do not call any tools.",
            },
          ],
          maxRetries: 1,
        });
        content = followUp.text?.trim() ?? "";
      } catch (e) {
        console.error("chat follow-up reply failed:", e);
      }
    }

    if (!content) {
      content = "Sorry, I didn't quite catch that — could you say it another way?";
    }

    await logMessage(supabase, sessionId, "assistant", content);
    return Response.json({ mode: "ai", content });
  } catch (e) {
    console.error("chat route error:", e);

    /* The old code returned this reply and dropped everything else on the
       floor: the failure never reached ai_messages, so the admin transcript
       just stopped, and a customer who had already handed over their name,
       phone and address was left with a dead end nobody knew about. Now the
       failure is written down, the number is kept, and the conversation is
       raised for a person. */
    try {
      const phone = phoneFromMessages(messages);
      if (phone) await rememberContact(supabase, sessionId, { phone });
      await flagForHuman(supabase, sessionId);
      await logMessage(supabase, sessionId, "assistant", ERROR_REPLY);
    } catch (inner) {
      console.error("chat route error handling failed:", inner);
    }

    return Response.json({ mode: "ai", content: ERROR_REPLY });
  }
}
