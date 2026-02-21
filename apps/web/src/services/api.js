import { getAccessToken } from "./adminAuth";
import { apiBaseUrl } from "../config/runtime";

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
    throw new Error(payload?.data?.error || payload?.text || `HTTP ${res.status}`);
  }

  return payload?.data ?? payload;
}

export async function pulseGet(pairId) {
  if (!pairId) return { pulse: null };
  return apiFetch(`/v1/pulse?pairId=${encodeURIComponent(pairId)}`, {
    method: "GET",
  });
}

export async function pulseSet(pairId, mood) {
  if (!pairId) throw new Error("missing_pair_id");
  return apiFetch(`/v1/pulse`, {
    method: "POST",
    body: JSON.stringify({ pairId, mood }),
  });
}
