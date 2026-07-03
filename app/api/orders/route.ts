import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { getProduct, getVariant } from "@/lib/products";

type IncomingItem = { slug: string; model: string; qty: number };

export async function POST(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  let body: {
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      province?: string;
      notes?: string;
    };
    items?: IncomingItem[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const c = body.customer;
  if (!c?.name || !c?.email || !c?.phone || !c?.address) {
    return Response.json(
      { error: "Name, email, contact number and address are required." },
      { status: 400 }
    );
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Your basket is empty." }, { status: 400 });
  }

  // Re-price every line on the server from the real catalogue.
  const lines = [];
  for (const item of body.items) {
    const product = getProduct(item.slug);
    const variant = getVariant(item.slug, item.model);
    const qty = Math.max(1, Math.min(50, Math.floor(Number(item.qty) || 1)));
    if (!product || !variant) {
      return Response.json(
        { error: `Unknown product/model: ${item.slug} ${item.model}` },
        { status: 400 }
      );
    }
    lines.push({
      product_slug: product.slug,
      product_name: product.name,
      model: variant.model,
      filtration: variant.filtration,
      unit_price: variant.price,
      plus_vat: variant.plusVat,
      qty,
    });
  }

  const total = lines.reduce((n, l) => n + l.unit_price * l.qty, 0);
  const hasVat = lines.some((l) => l.plus_vat);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city ?? null,
      province: c.province ?? null,
      notes: c.notes || null,
      total,
      has_vat_items: hasVat,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("orders insert failed:", orderError);
    return Response.json(
      { error: "Could not save your order. Please try again." },
      { status: 500 }
    );
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));

  if (itemsError) {
    console.error("order_items insert failed:", itemsError);
    return Response.json(
      { error: "Could not save your order items. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, orderId: order.id }, { status: 201 });
}
