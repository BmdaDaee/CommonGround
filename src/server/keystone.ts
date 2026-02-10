import { rewrite, type RewriteContext, type RewriteMode } from "@anarchyxmayhem/keystone-core";

export interface KeystoneRewriteInput {
  text: string;
  mode: RewriteMode;
  ctx?: RewriteContext;
}

export async function keystoneRewriteServer({ text, mode, ctx }: KeystoneRewriteInput) {
  const enableOnline = process.env.KEYSTONE_ENABLE_ONLINE === "true";

  // Default: offline-only (safe)
  if (!enableOnline) {
    return rewrite(text, mode, ctx);
  }

  // Online is explicitly enabled: require OpenAI env
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    throw new Error("KEYSTONE_ENABLE_ONLINE=true but OPENAI_API_KEY is missing");
  }

  return rewrite(text, mode, ctx, {
    enableOnline: true,
    openai: { apiKey, model },
  });
}
