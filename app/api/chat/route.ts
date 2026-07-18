import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { SYSTEM_PROMPT, GREETING } from "@/lib/ai/context";
import { site, bookingServices, bookingTimeSlots, districts } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;
const MAX_SESSION_ID = 128;
const MAX_INSERTS_PER_REQUEST = 1; // one booking OR one lead per message

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

/* Case-insensitive match to one of the allowed option strings; returns the
   canonical value (or null). Keeps free-text tool args on the allow-list. */
function matchOption(value: string, options: readonly string[]): string | null {
  const v = String(value ?? "").trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === v) ?? null;
}

/* Fire-and-forget conversation logging (service-role, never blocks the reply). */
function logMessage(sessionId: string, role: "user" | "assistant", content: string) {
  const supabase = getServerSupabase();
  if (!supabase) return;
  supabase
    .from("ai_messages")
    .insert({ session_id: sessionId, role, content })
    .then(({ error }) => {
      if (error) console.error("ai_messages insert failed:", error.message);
    });
}

/* A real calendar date (rejects 2026-02-30) that isn't in the past,
   compared in Sri Lanka local time (UTC+5:30). Mirrors /api/bookings. */
function isValidFutureDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!m) return false;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const real =
    date.getUTCFullYear() === +m[1] &&
    date.getUTCMonth() === +m[2] - 1 &&
    date.getUTCDate() === +m[3];
  if (!real) return false;
  const lkNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayLK = Date.UTC(
    lkNow.getUTCFullYear(),
    lkNow.getUTCMonth(),
    lkNow.getUTCDate()
  );
  return date.getTime() >= todayLK;
}

const fallback = (content: string) => Response.json({ content });

export async function POST(request: Request) {
  // No AI key yet → degrade gracefully instead of erroring.
  if (!process.env.OPENAI_API_KEY) {
    return fallback(
      `I'm just being set up right now — please call us on **${site.phone}** or [WhatsApp us](https://wa.me/${site.whatsapp}) and our team will help you straight away.`
    );
  }

  const body = await request.json().catch(() => null);
  const sessionId =
    typeof body?.sessionId === "string" && body.sessionId
      ? body.sessionId.slice(0, MAX_SESSION_ID)
      : "anon";

  // Best-effort rate limit before any paid/DB work.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(`${ip}:${sessionId}`)) {
    return fallback(
      "You're sending messages a little too fast — please wait a few seconds and try again."
    );
  }

  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .slice(-100)
    .filter(
      (m: unknown): m is { role: string; content: string } =>
        !!m &&
        typeof m === "object" &&
        (("role" in m && (m.role === "user" || m.role === "assistant")) as boolean) &&
        "content" in m &&
        typeof (m as { content: unknown }).content === "string"
    )
    .slice(-MAX_MESSAGES)
    .map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, MAX_CHARS),
    }));

  if (messages.length === 0) return fallback(GREETING);

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser) logMessage(sessionId, "user", lastUser.content);

  // A single request may create at most one booking or one lead — stops the
  // model (or a crafted message) from emitting many inserts in one call.
  let insertsThisRequest = 0;

  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages,
      // 1 model call + tool exec + follow-up reply (with headroom).
      stopWhen: stepCountIs(5),
      tools: {
        create_booking: tool({
          description:
            "Book a service visit once you have name, phone, service, district, a valid future date (YYYY-MM-DD) and a preferred time slot.",
          inputSchema: z.object({
            name: z.string().describe("Customer full name"),
            phone: z.string().describe("Contact phone number"),
            service: z.string().describe("Service type (from the allowed list)"),
            district: z.string().describe("Sri Lankan district (from the allowed list)"),
            preferred_date: z.string().describe("Preferred date, format YYYY-MM-DD, today or later"),
            preferred_time: z.string().describe("Preferred time slot (from the allowed list)"),
            email: z.string().optional().describe("Email (optional)"),
            address: z.string().optional().describe("Service address (optional)"),
            message: z.string().optional().describe("Any extra details (optional)"),
          }),
          execute: async (input) => {
            const supabase = getServerSupabase();
            if (!supabase) return { success: false, reason: "not_configured" };
            if (!input.name?.trim() || !input.phone?.trim())
              return { success: false, reason: "missing_contact" };
            if (!isValidFutureDate(input.preferred_date))
              return { success: false, reason: "invalid_date" };

            // Keep free-text fields on the allowed lists (don't trust the prompt).
            const service = matchOption(input.service, bookingServices);
            if (!service)
              return { success: false, reason: "invalid_service", allowed: bookingServices };
            const district = matchOption(input.district, districts);
            if (!district)
              return { success: false, reason: "invalid_district", allowed: districts };
            const preferred_time = matchOption(input.preferred_time, bookingTimeSlots);
            if (!preferred_time)
              return { success: false, reason: "invalid_time", allowed: bookingTimeSlots };

            if (insertsThisRequest >= MAX_INSERTS_PER_REQUEST)
              return { success: false, reason: "rate_limited" };
            insertsThisRequest++;

            const { error } = await supabase.from("bookings").insert({
              name: input.name.trim(),
              phone: input.phone.trim(),
              email: input.email?.trim() || null,
              service,
              district,
              preferred_date: input.preferred_date.trim(),
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
            return {
              success: true,
              booking: {
                name: input.name,
                service,
                district,
                preferred_date: input.preferred_date,
                preferred_time,
              },
            };
          },
        }),

        save_lead: tool({
          description:
            "Capture a prospective customer for follow-up / a quotation. Use when they want a callback or quote but aren't ready to pick a date. Requires at least name and phone.",
          inputSchema: z.object({
            name: z.string().describe("Customer full name"),
            phone: z.string().describe("Contact phone number"),
            email: z.string().optional().describe("Email (optional)"),
            service_interest: z
              .string()
              .optional()
              .describe("What service they're interested in (optional)"),
            message: z.string().optional().describe("Any notes about their need (optional)"),
          }),
          execute: async (input) => {
            const supabase = getServerSupabase();
            if (!supabase) return { success: false, reason: "not_configured" };
            if (!input.name?.trim() || !input.phone?.trim())
              return { success: false, reason: "missing_contact" };

            if (insertsThisRequest >= MAX_INSERTS_PER_REQUEST)
              return { success: false, reason: "rate_limited" };
            insertsThisRequest++;

            const { data: enq, error } = await supabase
              .from("enquiries")
              .insert({
                name: input.name.trim(),
                phone: input.phone.trim(),
                email: input.email?.trim() || null,
                service: input.service_interest?.trim() || null,
                message: input.message?.trim()
                  ? `${input.message.trim()}\n\n(Captured by the AI assistant)`
                  : "Lead captured by the AI assistant",
                status: "new",
              })
              .select("id")
              .single();

            if (error || !enq) {
              console.error("ai save_lead failed:", error?.message);
              return { success: false, reason: "db_error" };
            }

            // If a CRM pipeline exists, also drop the lead into its first stage.
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
                  await supabase.from("crm_leads").insert({
                    pipeline_id: pipeline.id,
                    stage_id: stage.id,
                    name: input.name.trim(),
                    phone: input.phone.trim(),
                    email: input.email?.trim() || null,
                    source: "ai",
                    enquiry_id: enq.id,
                    notes:
                      [
                        input.service_interest && `Interest: ${input.service_interest}`,
                        input.message,
                      ]
                        .filter(Boolean)
                        .join("\n") || null,
                  });
                  await supabase
                    .from("enquiries")
                    .update({ status: "in_crm" })
                    .eq("id", enq.id);
                }
              }
            } catch (e) {
              console.error("ai lead → CRM push failed:", e);
              // the enquiry is still saved; not fatal
            }

            return { success: true, lead: { name: input.name, phone: input.phone } };
          },
        }),
      },
    });

    const content =
      result.text?.trim() ||
      "Sorry, I didn't quite catch that — could you say it another way?";
    logMessage(sessionId, "assistant", content);
    return fallback(content);
  } catch (e) {
    console.error("chat route error:", e);
    return fallback(
      `Sorry, I hit a snag. Please call us on **${site.phone}** or [WhatsApp us](https://wa.me/${site.whatsapp}) and we'll help right away.`
    );
  }
}
