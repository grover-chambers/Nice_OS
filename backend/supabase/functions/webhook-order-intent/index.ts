import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();
  const { orderIntents } = body;

  if (!orderIntents || !Array.isArray(orderIntents)) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { error } = await supabase.from("order_intents").insert(
    orderIntents.map((o: any) => ({
      retailer_id: o.retailer_id,
      sku: o.sku,
      sku_name: o.sku_name,
      quantity: o.quantity,
      forwarded: true,
      forwarded_at: new Date().toISOString(),
    }))
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});