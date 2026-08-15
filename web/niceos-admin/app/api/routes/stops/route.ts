import { NextResponse } from "next/server";
import { replaceRouteStops } from "@/lib/data";
import type { RouteStop } from "@/lib/data/types";

export async function PUT(req: Request) {
  let body: { id: string; stops: RouteStop[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.id || !Array.isArray(body?.stops)) {
    return NextResponse.json({ error: "Missing id or stops" }, { status: 400 });
  }
  try {
    await replaceRouteStops(body.id, body.stops);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save route stops" },
      { status: 500 }
    );
  }
}
