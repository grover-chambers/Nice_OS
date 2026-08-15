import { NextResponse } from "next/server";
import { markAlertRead } from "@/lib/data";

export async function POST(req: Request) {
  let body: { id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    await markAlertRead(body.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to mark alert read" },
      { status: 500 }
    );
  }
}
