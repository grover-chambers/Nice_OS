import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsApp } from "./messaging.ts";

export type ForwardStatus = "pending" | "sent" | "failed";

// Forwards a captured order intent to the sales department's order handling
// desk via WhatsApp. Only touches orders still in 'pending' (already-forwarded
// orders are never re-sent). Returns the resulting forward_status.
//
// Settings come from app_settings:
//   order_forwarding.enabled   (bool)
//   whatsapp.order_desk_number (E.164 WhatsApp number)
//   orders.cutoff_time         (e.g. "16:00")
//   orders.delivery_sla_hours  (e.g. 24)
export async function forwardPendingOrder(
  db: SupabaseClient,
  orderId: string
): Promise<ForwardStatus> {
  const { data: order, error: orderError } = await db
    .from("order_intents")
    .select("id, retailer_id, rep_id, total, forward_status")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) {
    console.error(`order forward: order ${orderId} lookup failed`);
    return "failed";
  }
  if (order.forward_status !== "pending") {
    return order.forward_status as ForwardStatus;
  }

  const { data: settings } = await db
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "order_forwarding.enabled",
      "whatsapp.order_desk_number",
      "whatsapp.access_token",
      "whatsapp.phone_number_id",
      "orders.cutoff_time",
      "orders.delivery_sla_hours",
    ]);
  const map = new Map((settings ?? []).map((s) => [s.key, s.value]));
  const desk = map.get("whatsapp.order_desk_number");
  const sla = Number(map.get("orders.delivery_sla_hours") ?? 24);
  const cutoff = map.get("orders.cutoff_time");
  const orderDeskNumber = typeof desk === "string" && desk ? desk : null;
  const cutoffTime = typeof cutoff === "string" && cutoff ? cutoff : "16:00";
  const deliverySlaHours = Number.isFinite(sla) && sla > 0 ? sla : 24;
  const whatsappToken = map.get("whatsapp.access_token");
  const whatsappPhoneId = map.get("whatsapp.phone_number_id");

  if (map.get("order_forwarding.enabled") !== true || !orderDeskNumber) {
    return "pending";
  }

  const [retailerRes, repRes, linesRes] = await Promise.all([
    db
      .from("retailers")
      .select("name, phone, ward, constituency, zone, address")
      .eq("id", order.retailer_id)
      .maybeSingle(),
    order.rep_id
      ? db.from("reps").select("name, phone").eq("id", order.rep_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    db
      .from("order_intent_items")
      .select("sku, quantity")
      .eq("order_intent_id", orderId),
  ]);

  const retailer = retailerRes.data;
  if (!retailer) {
    console.error(`order forward: retailer ${order.retailer_id} not found`);
    await db
      .from("order_intents")
      .update({ forward_status: "failed" })
      .eq("id", orderId);
    return "failed";
  }

  const rep = repRes.data as { name: string | null; phone: string | null } | null;
  const items = (linesRes.data ?? [])
    .map((l) => `${l.sku} x${l.quantity}`)
    .join(", ");
  const repLabel = `${rep?.name ?? "unknown"}${rep?.phone ? ` (${rep.phone})` : ""}`;
  const town =
    retailer.ward ?? retailer.constituency ?? retailer.zone ?? retailer.address ?? "";
  const message =
    `NEW ORDER — ${retailer.name}, ${town}. Items: ${items}. ` +
    `Total: KES ${Number(order.total).toFixed(2)}. Rep: ${repLabel}. ` +
    `${cutoffTime} cutoff for next-day delivery (${deliverySlaHours}h).`;

  const delivered = await sendWhatsApp(orderDeskNumber, message, {
    accessToken: typeof whatsappToken === "string" && whatsappToken ? whatsappToken : undefined,
    phoneNumberId: typeof whatsappPhoneId === "string" && whatsappPhoneId ? whatsappPhoneId : undefined,
  });
  const status: ForwardStatus = delivered ? "sent" : "failed";
  if (!delivered) {
    console.error(`order forward: WhatsApp rejected order ${orderId}`);
  }

  const update: Record<string, unknown> = { forward_status: status };
  if (delivered) update.forwarded_at = new Date().toISOString();
  await db.from("order_intents").update(update).eq("id", orderId);
  return status;
}