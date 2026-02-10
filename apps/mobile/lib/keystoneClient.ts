export type RewriteMode = "deescalate" | "soften" | "emotion_to_words" | "boundary_set";

const DEFAULT_BASE_URL = "http://localhost:3001";

// For physical devices, set EXPO_PUBLIC_API_BASE_URL to your LAN IP, e.g.
// EXPO_PUBLIC_API_BASE_URL=http://192.168.1.156:3001
const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;

export async function keystoneRewrite(
  text: string,
  mode: RewriteMode
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/keystone/rewrite`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, mode }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? "Keystone rewrite failed");
  }

  return String(data.output ?? "");
}
