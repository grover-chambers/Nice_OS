import { NextResponse } from "next/server";
import { createDraftRoute } from "@/lib/data";

export async function POST(req: Request) {
  let body: { repId: string; date: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.repId || !body?.date) {
    return NextResponse.json({ error: "Missing repId or date" }, { status: 400 });
  }
  try {
    const id = await createDraftRoute(body.repId, body.date);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create draft route" },
      { status: 500 }
    );
  }
}
