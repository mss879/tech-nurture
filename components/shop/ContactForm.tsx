"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { whatsappLink } from "@/lib/site";

const serviceOptions = [
  "Water Purifier — Installation",
  "Water Purifier — Service / Repair",
  "Air Conditioning — Installation",
  "Air Conditioning — Service / Repair",
  "Annual Maintenance Contract (AMC)",
  "Spare Parts / Filters",
  "Other",
];

const provinces = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: serviceOptions[0],
    province: provinces[0],
    message: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const whatsappMsg = `New inquiry — TechNurture
Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email || "—"}
Service: ${form.service}
Province: ${form.province}
Details: ${form.message || "—"}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || "Something went wrong while sending your enquiry."
        );
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const field =
    "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-mist placeholder:text-mist/35 outline-none transition focus:border-lime focus:bg-white/[0.07]";
  const label = "mb-2 block text-sm font-medium text-mist/70";

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-lime/30 bg-lime/5 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-lime" />
        <h3 className="mt-4 text-xl font-semibold text-mist">
          Enquiry received!
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mist/60">
          Thank you, {form.name.split(" ")[0]}. Our team has your enquiry and
          will contact you as soon as possible.
        </p>
        <button
          onClick={() => {
            setForm({
              name: "",
              phone: "",
              email: "",
              service: serviceOptions[0],
              province: provinces[0],
              message: "",
            });
            setStatus("idle");
          }}
          className="mt-6 text-sm font-medium text-lime underline-offset-4 hover:underline"
        >
          Send another enquiry
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
          Email <span className="text-mist/40">(optional)</span>
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
            Service needed
          </label>
          <select
            id="service"
            value={form.service}
            onChange={(e) => update("service", e.target.value)}
            className={`${field} appearance-none`}
          >
            {serviceOptions.map((s) => (
              <option key={s} className="bg-ink">
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="province">
            Province
          </label>
          <select
            id="province"
            value={form.province}
            onChange={(e) => update("province", e.target.value)}
            className={`${field} appearance-none`}
          >
            {provinces.map((p) => (
              <option key={p} className="bg-ink">
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="message">
          Tell us about your requirement
        </label>
        <textarea
          id="message"
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="e.g. RO purifier service for an office in Colombo…"
          className={`${field} resize-none`}
        />
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <p>{errorMsg}</p>
          <a
            href={whatsappLink(whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-semibold text-lime underline underline-offset-2"
          >
            Or send it via WhatsApp instead →
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
            Sending… <Loader2 className="size-4 animate-spin" />
          </>
        ) : (
          <>
            Send Enquiry <Send className="size-4" />
          </>
        )}
      </button>
      <p className="text-xs text-mist/40">
        Your enquiry goes straight to our team and we&apos;ll get back to you as
        soon as possible. Prefer WhatsApp?{" "}
        <a
          href={whatsappLink(whatsappMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lime underline-offset-2 hover:underline"
        >
          Message us directly
        </a>
        .
      </p>
    </form>
  );
}
