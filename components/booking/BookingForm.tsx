"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import {
  whatsappLink,
  bookingServices,
  bookingTimeSlots,
  districts,
} from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  service: bookingServices[0],
  district: districts[0],
  preferred_date: "",
  preferred_time: bookingTimeSlots[0],
  address: "",
  message: "",
};

export default function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [minDate, setMinDate] = useState("");
  const [form, setForm] = useState(emptyForm);

  // Set the "no earlier than today" constraint on the client only, to avoid a
  // server/client hydration mismatch. Use the browser's LOCAL date (en-CA →
  // YYYY-MM-DD) so it isn't off by one before ~5:30am in Sri Lanka (UTC+5:30).
  useEffect(() => {
    setMinDate(new Date().toLocaleDateString("en-CA"));
  }, []);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const whatsappMsg = `New service booking — TechNurture
Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email || "—"}
Service: ${form.service}
District: ${form.district}
Preferred date: ${form.preferred_date || "—"}
Preferred time: ${form.preferred_time}
Address: ${form.address || "—"}
Notes: ${form.message || "—"}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || "Something went wrong while submitting your booking."
        );
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const field =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-ink placeholder:text-slate/40 outline-none transition focus:border-green focus:ring-1 focus:ring-green/20";
  const label = "mb-2 block text-sm font-medium text-slate/75";

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green/30 bg-green/5 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-green" />
        <h3 className="mt-4 text-xl font-semibold text-ink">
          Booking received!
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate/60">
          Thank you, {form.name.split(" ")[0]}. We&apos;ve received your booking
          for <span className="font-medium text-ink">{form.service}</span> in{" "}
          {form.district} on {form.preferred_date} ({form.preferred_time}). Our
          team will call you shortly to confirm.
        </p>
        <button
          onClick={() => {
            setForm(emptyForm);
            setStatus("idle");
          }}
          className="mt-6 text-sm font-medium text-green underline underline-offset-4 hover:text-green-600"
        >
          Make another booking
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your name"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="phone">
            Phone / WhatsApp
          </label>
          <input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="07X XXX XXXX"
            className={field}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="email">
          Email <span className="text-slate/40">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com"
          className={field}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="service">
            Service type
          </label>
          <select
            id="service"
            value={form.service}
            onChange={(e) => update("service", e.target.value)}
            className={`${field} appearance-none bg-white`}
          >
            {bookingServices.map((s) => (
              <option key={s} className="bg-white text-ink">
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="district">
            District
          </label>
          <select
            id="district"
            value={form.district}
            onChange={(e) => update("district", e.target.value)}
            className={`${field} appearance-none bg-white`}
          >
            {districts.map((d) => (
              <option key={d} className="bg-white text-ink">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="preferred_date">
            Preferred date
          </label>
          <input
            id="preferred_date"
            type="date"
            required
            value={form.preferred_date}
            min={minDate || undefined}
            onChange={(e) => update("preferred_date", e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="preferred_time">
            Preferred time
          </label>
          <select
            id="preferred_time"
            value={form.preferred_time}
            onChange={(e) => update("preferred_time", e.target.value)}
            className={`${field} appearance-none bg-white`}
          >
            {bookingTimeSlots.map((t) => (
              <option key={t} className="bg-white text-ink">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="address">
          Service address <span className="text-slate/40">(optional)</span>
        </label>
        <input
          id="address"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Street / building, area"
          className={field}
        />
      </div>

      <div>
        <label className={label} htmlFor="message">
          Anything we should know? <span className="text-slate/40">(optional)</span>
        </label>
        <textarea
          id="message"
          rows={3}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="e.g. Split AC not cooling, 2 units, 3rd floor…"
          className={`${field} resize-none`}
        />
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-800">
          <p>{errorMsg}</p>
          <a
            href={whatsappLink(whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-semibold text-green underline underline-offset-2 hover:text-green-600"
          >
            Or send this booking via WhatsApp instead →
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-lime inline-flex w-full items-center justify-center gap-2 px-7 py-4 text-sm uppercase tracking-wider disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            Submitting… <Loader2 className="size-4 animate-spin" />
          </>
        ) : (
          <>
            Book Service <CalendarCheck className="size-4" />
          </>
        )}
      </button>
      <p className="text-xs text-slate/50">
        We&apos;ll call you to confirm the visit. Prefer WhatsApp?{" "}
        <a
          href={whatsappLink(whatsappMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green font-semibold underline underline-offset-2 hover:text-green-600"
        >
          Book via WhatsApp
        </a>
        .
      </p>
    </form>
  );
}
