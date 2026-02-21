import { getAccessToken } from "./adminAuth";
import { apiBaseUrl } from "../config/runtime";

export function normalizeApiErrorMessage(message) {
  const raw = String(message || "").trim();
  if (!raw) return "request_failed";

  if (raw.includes("missing_bearer_token")) return "missing_bearer_token";
  if (raw.includes("invalid_token")) return "invalid_token";
  if (raw.includes("pairId is required") || raw.includes("missing_pair_id")) return "pairId is required";

  return raw;
}

async function readJsonOrText(res) {
  const text = await res.text().catch(() => "");
  if (!text) return { data: null, text: "" };
  try {
    return { data: JSON.parse(text), text };
  } catch {
    return { data: null, text };
  }
}

export async function apiFetch(path, options = {}) {
  const token = await getAccessToken();

  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await readJsonOrText(res);

  if (!res.ok) {
    const rawError = payload?.data?.error || payload?.text || `HTTP ${res.status}`;
    throw new Error(normalizeApiErrorMessage(rawError));
  }

  return payload?.data ?? payload;
}

export async function pulseGet(pairId) {
  if (!pairId) return { pulse: null };
  return apiFetch(`/v1/pulse?pairId=${encodeURIComponent(pairId)}`, {
    method: "GET",
  });
}

export async function pairsMe() {
  return apiFetch("/v1/pairs/me", { method: "GET" });
}

export async function pulseSet(pairId, mood) {
  if (!pairId) throw new Error("pairId is required");
  return apiFetch(`/v1/pulse`, {
    method: "POST",
    body: JSON.stringify({ pairId, mood }),
  });
}
