import type { Request, Response } from "express";
import { keystoneRewriteServer } from "../keystone";

export async function keystoneRewriteHandler(req: Request, res: Response) {
  try {
    const { text, mode, ctx } = req.body ?? {};
    const out = await keystoneRewriteServer({ text: String(text ?? ""), mode, ctx });
    res.json({ ok: true, output: out });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err?.message ?? "Unknown error" });
  }
}
