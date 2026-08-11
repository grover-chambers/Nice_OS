import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface OrderLine {
  sku: string;
  name?: string;
  quantity: number;
  price?: number;
}

interface OrderIntentPayload {
  retailer_id: string;
  rep_id?: string;
  items: OrderLine[];
  notes?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { retailer_id, rep_id, items, notes } = body as OrderIntentPayload;
  if (!retailer_id || !Array.isArray(items) || items.length === 0) {
    return new Response("Invalid payload: retailer_id + items[] required", { status: 400 });
  }

  const total = items.reduce((sum, i) => sum + (i.quantity * (i.price ?? 0)), 0);

  const { data: order, error: headerError } = await supabase
    .from("order_intents")
    .insert({
      retailer_id,
      rep_id: rep_id ?? null,
      total,
      forward_status: "pending",
      notes,
    })
    .select("id")
    .single();

  if (headerError) {
    return new Response(JSON.stringify({ error: headerError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lines = items.map((i) => ({
    order_intent_id: order!.id,
    sku: i.sku,
    name: i.name ?? null,
    quantity: i.quantity,
    price: i.price ?? 0,
  }));

  const { error: itemsError } = await supabase.from("order_intent_items").insert(lines);
  if (itemsError) {
    return new Response(JSON.stringify({ error: itemsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, order_intent_id: order!.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
