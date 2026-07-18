/* Normalize a phone number to a stable key: digits only, last 9.
   Mirrors the SQL public.normalize_phone() in 006_clients.sql so the
   app and the database agree on how contacts are matched/deduped.
   Sri Lankan numbers (07XXXXXXXX, +947XXXXXXXX, 00947…) all collapse
   to the same 9-digit tail. */
export function phoneKey(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits.slice(-9);
}
