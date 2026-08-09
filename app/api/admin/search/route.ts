import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";
import { canAccessNav } from "@/lib/admin/nav";
import { visibleUserIds } from "@/lib/admin/departments";
import {
  LINK_KINDS,
  LINK_SPECS,
  isLinkKind,
  safeQuery,
  type LinkKind,
} from "@/lib/admin/todoLinks";

/* GET ?q=<text>&kinds=enquiry,lead,order,booking

   Typeahead behind the "link a record" picker on a to-do. Deliberately
   permission-scoped twice over:

     · a kind is only searched if the caller can open that menu item, so
       somebody with To-dos but not Orders can't fish through the order
       book through this side door;
     · leads are narrowed to the people the caller may see, the same rule
       the CRM board uses.

   Nothing here is a new grant — it only surfaces records the caller could
   already reach by opening the page. */

const PER_KIND = 8;

export async function GET(request: Request) {
  const gate = await requireNav("todos");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const params = new URL(request.url).searchParams;
  const q = safeQuery(params.get("q") ?? "");

  const asked = (params.get("kinds") ?? "").split(",").filter(isLinkKind);
  const kinds: LinkKind[] = (asked.length > 0 ? asked : [...LINK_KINDS]).filter(
    (kind) => canAccessNav(me, LINK_SPECS[kind].nav)
  );

  if (kinds.length === 0) return Response.json({ results: [] });

  const visible = await visibleUserIds(me);

  const searches = kinds.map(async (kind) => {
    const spec = LINK_SPECS[kind];

    const query = supabase
      .from(spec.table)
      .select(["id", ...spec.select].join(", "))
      .order("created_at", { ascending: false })
      .limit(PER_KIND);

    if (q) {
      query.or(spec.search.map((col) => `${col}.ilike.%${q}%`).join(","));
    }
    if (spec.ownerColumn && visible) {
      query.in(spec.ownerColumn, visible);
    }

    const { data, error } = await query;
    if (error) {
      // A table from a migration that hasn't been run is simply a kind
      // with no results, not a broken picker.
      if (!isMissingSchema(error)) {
        console.error(`search failed for ${kind}:`, error);
      }
      return [];
    }

    return (data ?? []).map((row) => {
      const r = row as unknown as Record<string, unknown>;
      return {
        kind,
        id: String(r.id),
        label: spec.label(r),
        sub: spec.sub(r),
        href: spec.href,
      };
    });
  });

  const results = (await Promise.all(searches)).flat();
  return Response.json({ results });
}
