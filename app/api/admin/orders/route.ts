import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav } from "@/lib/admin/permissions";

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
