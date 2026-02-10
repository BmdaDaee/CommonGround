import { NextResponse } from "next/server";
import { keystoneRewriteServer } from "../../../../src/server/keystone";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? "");
    const mode = body?.mode;
    const ctx = body?.ctx;

    const out = await keystoneRewriteServer({ text, mode, ctx });
    return NextResponse.json({ ok: true, output: out });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
