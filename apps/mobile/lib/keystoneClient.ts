import { Platform } from "react-native";

export type RewriteMode = "deescalate" | "soften" | "emotion_to_words" | "boundary_set";

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function resolveKeystoneBaseUrl() {
  const envBaseUrl =
    normalizeBaseUrl(process.env.EXPO_PUBLIC_CG_API_BASE_URL as string | undefined) ||
    normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined);
  if (envBaseUrl) return envBaseUrl;

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001";
  }
  return "http://localhost:3001";
}

const API_BASE_URL = resolveKeystoneBaseUrl();

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
