import { NextResponse } from "next/server";
import { setRouteStatus } from "@/lib/data";
import type { RouteStatus } from "@/lib/data/types";

export async function POST(req: Request) {
  let body: { id: string; status: RouteStatus; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }
  try {
    await setRouteStatus(body.id, body.status, body.reason);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update route status" },
      { status: 500 }
    );
  }
}
