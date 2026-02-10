export type RewriteMode =
  | "clarify"
  | "summarize"
  | "soften"
  | "deescalate"
  | "emotion_to_words"
  | "boundary_set";

export async function keystoneRewrite(text: string, mode: RewriteMode) {
  const res = await fetch("http://localhost:3001/api/keystone/rewrite", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, mode }),
  });

  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error ?? "Keystone error");
  return data.output as string;
}
