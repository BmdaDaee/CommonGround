import { rewrite, type RewriteContext, type RewriteMode } from "@anarchyxmayhem/keystone-core";

export async function keystoneRewrite(
  input: string,
  mode: RewriteMode,
  ctx?: RewriteContext
): Promise<string> {
  return rewrite(input, mode, ctx);
}
