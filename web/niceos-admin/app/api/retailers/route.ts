import { NextResponse } from "next/server";
import { createRetailer } from "@/lib/data";
import type { OutletType, RetailerStatus, Tier, WardZone } from "@/lib/data/types";

export async function POST(req: Request) {
  let body: {
    name: string;
    owner: string;
    phone: string;
    type: OutletType;
    tier: Tier;
    status: RetailerStatus;
    ward: string;
    constituency: string;
    zone: WardZone;
    address: string;
    lat: number;
    lng: number;
    repId: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.name || !body?.owner || !body?.phone || !body?.ward || !body?.zone || !body?.repId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const retailer = await createRetailer(body);
    return NextResponse.json({ ok: true, id: retailer.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create retailer" },
      { status: 500 }
    );
  }
}
