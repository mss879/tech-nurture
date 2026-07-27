/* "That table or column doesn't exist yet."

   Two different layers report this, with different codes, and getting it
   wrong is dangerous: the permission lookup falls back to the pre-014
   behaviour on a missing table, so a code we don't recognise would lock
   the owner out of their own dashboard instead.

     42P01 / 42703  — Postgres itself (undefined_table / undefined_column)
     PGRST205       — PostgREST: table not found in the schema cache
     PGRST204       — PostgREST: column not found in the schema cache

   PostgREST is what supabase-js actually talks to, so its codes are the
   ones seen in practice; the Postgres ones show up through RPC. */
const MISSING_SCHEMA_CODES = new Set([
  "42P01",
  "42703",
  "PGRST205",
  "PGRST204",
]);

export function isMissingSchema(error: { code?: string } | null | undefined) {
  return !!error?.code && MISSING_SCHEMA_CODES.has(error.code);
}
