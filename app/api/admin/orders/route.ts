import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, actorId } from "@/lib/admin/permissions";
import { isMissingSchema } from "@/lib/admin/db";
import { clipCustomer, isAdminOrderSource } from "@/lib/orders";

const STATUSES = ["new", "contacted", "confirmed", "delivered", "cancelled"];

export async function GET() {
  const gate = await requireNav("orders");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("orders list failed:", error);
    return Response.json(
      { error: "Could not load orders. Have you run 001_orders.sql?" },
      { status: 500 }
    );
  }
  return Response.json({ orders: data });
}

/* ---------- creating an order by hand ------------------------------

   Orders taken on a phone call, at the counter, or over WhatsApp. The
   deliberate difference from the public checkout is PRICE: that route
   re-prices every line from the catalogue so a basket can't dictate its
   own total, because it is talking to a stranger. This one is behind the
   Orders permission and exists precisely so the client can agree a figure
   on a call — a discount, an old price, a line that isn't in the
   catalogue at all — so a price sent here is honoured. Picking a
   catalogue model still fills the line in from the real record, and the
   slug is kept so the order still counts towards that product.        */

// Matches the public route: enough for any real order, far short of a
// runaway payload.
const MAX_LINES = 50;

// numeric(12,2) tops out at 9,999,999,999.99. These keep a typo'd price
// from reaching Postgres as an overflow, and the total is checked below.
const MAX_UNIT_PRICE = 10_000_000;
const MAX_QTY = 999;
const MAX_TOTAL = 9_999_999_999;

type IncomingLine = {
  slug?: unknown; // present = a catalogue line
  model?: unknown;
  name?: unknown; // required when there's no slug
  optionLabel?: unknown;
  unitPrice?: unknown;
  plusVat?: unknown;
  qty?: unknown;
};

type LineRow = {
  product_slug: string | null;
  product_name: string;
  model: string;
  filtration: string | null;
  unit_price: number;
  plus_vat: boolean;
  qty: number;
};

function str(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/* The price on the line, or null when the caller didn't send one at all
   (only then does a catalogue line fall back to the catalogue's own
   price). An empty or unreadable box is 0, deliberately: that is what the
   form's running total shows the client while they type, and the figure
   they see must be the figure that gets saved.

   Rounded to the 2 decimals the column stores, so 33.333 can't come back
   as a total that doesn't add up. */
function money(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(Math.min(n, MAX_UNIT_PRICE) * 100) / 100;
}

/* Every (slug, model) in the basket in one query rather than one lookup
   per line, and without the is_published filter the public catalogue
   reads apply — the form offers drafts, so it must be able to save them. */
async function loadPickedVariants(
  supabase: NonNullable<ReturnType<typeof getServerSupabase>>,
  slugs: string[]
) {
  const found = new Map<
    string,
    { name: string; optionLabel: string; price: number; plusVat: boolean }
  >();
  if (slugs.length === 0) return found;

  const { data, error } = await supabase
    .from("products")
    .select(
      `slug, name, product_variants ( model, option_label, price, plus_vat )`
    )
    .in("slug", slugs);

  // Leave the map empty and let the per-line check below report it as a
  // product that can't be found, which is what it is from here.
  if (error || !data) {
    if (error) console.error("order catalogue lookup failed:", error);
    return found;
  }

  type Row = {
    slug: string;
    name: string;
    product_variants:
      | {
          model: string | null;
          option_label: string | null;
          price: number | string | null;
          plus_vat: boolean | null;
        }[]
      | null;
  };

  for (const p of data as unknown as Row[]) {
    for (const v of p.product_variants ?? []) {
      found.set(`${p.slug}\n${String(v.model ?? "")}`, {
        name: p.name,
        optionLabel: v.option_label ?? "",
        price: Number(v.price ?? 0),
        plusVat: v.plus_vat === true,
      });
    }
  }
  return found;
}

async function buildLines(
  supabase: NonNullable<ReturnType<typeof getServerSupabase>>,
  input: unknown
): Promise<{ rows: LineRow[] } | { error: string }> {
  if (!Array.isArray(input) || input.length === 0) {
    return { error: "Add at least one item to the order." };
  }
  if (input.length > MAX_LINES) {
    return { error: "That's too many separate items for one order." };
  }

  const items = input as IncomingLine[];
  const slugs = [
    ...new Set(items.map((i) => str(i.slug, 200)).filter(Boolean)),
  ];
  const picked = await loadPickedVariants(supabase, slugs);

  const rows: LineRow[] = [];
  for (const item of items) {
    const slug = str(item.slug, 200);
    const model = str(item.model, 120);
    const qty = Math.max(
      1,
      Math.min(MAX_QTY, Math.floor(Number(item.qty) || 1))
    );
    const override = money(item.unitPrice);

    if (slug) {
      const variant = picked.get(`${slug}\n${model}`);
      if (!variant) {
        return {
          error: `That product is no longer in the catalogue: ${slug}${
            model ? ` (${model})` : ""
          }. Remove the line or type it in by hand.`,
        };
      }
      rows.push({
        product_slug: slug,
        product_name: variant.name,
        model,
        filtration: variant.optionLabel || null,
        unit_price: override ?? variant.price,
        // Only an explicit boolean overrides the catalogue's own answer.
        plus_vat:
          typeof item.plusVat === "boolean" ? item.plusVat : variant.plusVat,
        qty,
      });
      continue;
    }

    // A hand-typed line. It has no catalogue record to fall back on, so
    // a description is the one thing that can't be left out.
    const name = str(item.name, 200);
    if (!name) {
      return { error: "Every hand-typed line needs a description." };
    }
    rows.push({
      product_slug: null,
      product_name: name,
      model,
      filtration: str(item.optionLabel, 120) || null,
      unit_price: override ?? 0,
      plus_vat: item.plusVat === true,
      qty,
    });
  }

  return { rows };
}

export async function POST(request: Request) {
  const gate = await requireNav("orders");
  if ("error" in gate) return gate.error;
  const me = gate.admin;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Only a name and a number are required — see 027_custom_orders.sql.
  const customer = clipCustomer(body.customer);
  if (!customer.name || !customer.phone) {
    return Response.json(
      { error: "A customer name and contact number are required." },
      { status: 400 }
    );
  }

  const source = isAdminOrderSource(body.source) ? body.source : "phone";
  // An order the client has just agreed on a call isn't "new" — nobody
  // has to go and look at it. They can still pick any status.
  const status = STATUSES.includes(body.status) ? body.status : "confirmed";

  const lines = await buildLines(supabase, body.items);
  if ("error" in lines) {
    return Response.json({ error: lines.error }, { status: 400 });
  }

  const total = lines.rows.reduce((n, l) => n + l.unit_price * l.qty, 0);
  if (total > MAX_TOTAL) {
    return Response.json(
      { error: "That order total is too large — check the prices." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      province: customer.province,
      notes: customer.notes,
      total: Math.round(total * 100) / 100,
      has_vat_items: lines.rows.some((l) => l.plus_vat),
      status,
      source,
      created_by: actorId(me),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    // 23502 = not-null violation, i.e. this is a pre-027 database still
    // insisting on an email and an address.
    if (isMissingSchema(orderError) || orderError?.code === "23502") {
      return Response.json(
        {
          error:
            "Custom orders need 027_custom_orders.sql — run it in the Supabase SQL editor, then try again.",
        },
        { status: 500 }
      );
    }
    console.error("custom order insert failed:", orderError);
    return Response.json(
      { error: "Could not save the order." },
      { status: 500 }
    );
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(lines.rows.map((l) => ({ ...l, order_id: order.id })));

  if (itemsError) {
    // Don't leave an order with no lines sitting in the list.
    await supabase.from("orders").delete().eq("id", order.id);
    console.error("custom order items insert failed:", itemsError);
    return Response.json(
      {
        error: isMissingSchema(itemsError) || itemsError.code === "23502"
          ? "Hand-typed lines need 027_custom_orders.sql — run it in the Supabase SQL editor, then try again."
          : "Could not save the order's items, so nothing was saved.",
      },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, id: order.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const gate = await requireNav("orders");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const body = await request.json().catch(() => null);
  if (!body?.id || !STATUSES.includes(body?.status)) {
    return Response.json(
      { error: "id and a valid status are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: body.status })
    .eq("id", body.id);

  if (error) {
    console.error("order update failed:", error);
    return Response.json({ error: "Could not update order." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireNav("orders");
  if ("error" in gate) return gate.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) {
    console.error("order delete failed:", error);
    return Response.json({ error: "Could not delete order." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
