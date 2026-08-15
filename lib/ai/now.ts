/* Sri Lanka civil time (Asia/Colombo, UTC+5:30, no DST).

   The AI assistant books real service visits, so every date it reasons
   about has to be the customer's date, not the server's. A model with no
   clock invents one: before this module the assistant told a customer on
   15 August 2026 that "next Monday is October 30, 2023", and because
   isValidFutureDate then rejected the past date, no AI booking could ever
   be created. Everything time-related for the agent goes through here. */

export const TZ = "Asia/Colombo";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/* A calendar day in Colombo, held as YYYY-MM-DD. Arithmetic is done on a
   UTC-midnight Date built from those parts, so it never drifts across a
   timezone boundary. */
export type CivilDate = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function partsOf(at: Date) {
  // en-CA formats as YYYY-MM-DD, which is exactly the shape we store.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(at)) p[part.type] = part.value;
  return p;
}

/** Today's date in Colombo, as YYYY-MM-DD. */
export function today(at: Date = new Date()): CivilDate {
  const p = partsOf(at);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Current wall-clock time in Colombo, as HH:MM (24h). */
export function timeOfDay(at: Date = new Date()): string {
  const p = partsOf(at);
  // Intl renders midnight as "24" in some ICU builds; normalise it.
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${hour}:${p.minute}`;
}

/** Hour of the day in Colombo, 0–23. */
export function hourOfDay(at: Date = new Date()): number {
  return Number(timeOfDay(at).slice(0, 2));
}

/** UTC-midnight Date for a YYYY-MM-DD, or null if it isn't a real date. */
function toUTC(iso: CivilDate): Date | null {
  const m = ISO_RE.exec(String(iso).trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  // Rejects 2026-02-30 and friends, which Date.UTC would silently roll over.
  if (
    d.getUTCFullYear() !== +m[1] ||
    d.getUTCMonth() !== +m[2] - 1 ||
    d.getUTCDate() !== +m[3]
  )
    return null;
  return d;
}

/** True if `iso` is a real calendar date in YYYY-MM-DD form. */
export function isRealDate(iso: string): boolean {
  return toUTC(iso) !== null;
}

/** `iso` shifted by `n` days. Returns "" for an invalid input. */
export function addDays(iso: CivilDate, n: number): CivilDate {
  const d = toUTC(iso);
  if (!d) return "";
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Day name for a YYYY-MM-DD ("Monday"), or "" if invalid. */
export function weekdayOf(iso: CivilDate): string {
  const d = toUTC(iso);
  return d ? WEEKDAYS[d.getUTCDay()] : "";
}

/** Human form of a YYYY-MM-DD: "Monday, 17 August 2026". */
export function longDate(iso: CivilDate): string {
  const d = toUTC(iso);
  if (!d) return iso;
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${
    MONTHS[d.getUTCMonth()]
  } ${d.getUTCFullYear()}`;
}

/** Whole days from today (Colombo) to `iso`. Negative = in the past. */
export function daysFromToday(iso: CivilDate, at: Date = new Date()): number {
  const target = toUTC(iso);
  const start = toUTC(today(at));
  if (!target || !start) return NaN;
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

/** A real date that is today or later in Colombo. */
export function isTodayOrLater(iso: string, at: Date = new Date()): boolean {
  const n = daysFromToday(iso, at);
  return Number.isFinite(n) && n >= 0;
}

/** Sunday — the one day the service centre is closed (site.openDays). */
export function isSunday(iso: CivilDate): boolean {
  return weekdayOf(iso) === "Sunday";
}

/**
 * A short calendar the model can read instead of doing date arithmetic.
 * Every plausible "tomorrow / this Saturday / next Monday" a customer can
 * say resolves to a row here, so relative dates stop being guesswork.
 */
export function calendar(at: Date = new Date(), days = 15) {
  const start = today(at);
  const startDow = toUTC(start)!.getUTCDay();
  const rows: { iso: CivilDate; weekday: string; note: string }[] = [];

  for (let i = 0; i < days; i++) {
    const iso = addDays(start, i);
    const weekday = weekdayOf(iso);
    const dow = (startDow + i) % 7;

    const names: string[] = [];
    if (i === 0) names.push("today");
    else if (i === 1) names.push("tomorrow");
    else if (i === 2) names.push("day after tomorrow");

    /* "this <day>" is the coming one within the next 7 days; "next <day>"
       is the one after that. This is how customers here use the words, and
       stating it removes the ambiguity the model would otherwise resolve
       at random. */
    if (i > 0 && i <= 7) names.push(`this ${weekday}`);
    else if (i > 7) names.push(`next ${weekday}`);
    if (dow === 6 || dow === 0) names.push(i <= 7 ? "this weekend" : "next weekend");

    if (dow === 0) names.push("CLOSED — Sunday, do not book");

    rows.push({ iso, weekday, note: names.join(", ") });
  }
  return rows;
}

/**
 * The next date falling on a named weekday ("Thursday"), today included.
 * Returns "" if the name isn't a weekday.
 */
export function nextWeekday(name: string, at: Date = new Date()): CivilDate {
  const want = WEEKDAYS.findIndex(
    (d) => d.toLowerCase() === String(name ?? "").trim().toLowerCase()
  );
  if (want < 0) return "";
  const start = today(at);
  for (let i = 0; i < 7; i++) {
    const iso = addDays(start, i);
    if (toUTC(iso)!.getUTCDay() === want) return iso;
  }
  return "";
}

/**
 * "this Monday = 2026-08-17" for every weekday name, so resolving a day
 * the customer named is a lookup rather than arithmetic. Scanning a table
 * is one step too many for a small model: given the full calendar it still
 * booked a Tuesday and called it Thursday.
 */
export function namedDays(at: Date = new Date()) {
  return WEEKDAYS.map((name) => {
    const iso = nextWeekday(name, at);
    return { name, iso, days: daysFromToday(iso, at) };
  });
}

/** The next day the team actually works (skips Sunday). */
export function nextWorkingDay(at: Date = new Date()): CivilDate {
  let iso = addDays(today(at), 1);
  if (isSunday(iso)) iso = addDays(iso, 1);
  return iso;
}

/** Everything the prompt needs about "now", in one object. */
export function nowInSriLanka(at: Date = new Date()) {
  const iso = today(at);
  return {
    iso,
    weekday: weekdayOf(iso),
    long: longDate(iso),
    time: timeOfDay(at),
    hour: hourOfDay(at),
    year: iso.slice(0, 4),
    calendar: calendar(at),
    namedDays: namedDays(at),
    nextWorkingDay: nextWorkingDay(at),
  };
}
