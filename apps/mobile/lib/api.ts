import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { firebaseAuth } from "./firebase";

const SESSION_BOOTSTRAP_TIMEOUT_MS = 10000;

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function extractHostFromValue(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return null;
    return host;
  } catch {
    // Continue with non-URL parsing.
  }

  const withoutScheme = trimmed.replace(/^[a-z]+:\/\//i, "");
  const firstSegment = withoutScheme.split("/")[0] || "";
  const host = firstSegment.split(":")[0] || "";
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

function resolveExpoDevHost() {
  const c = Constants as any;
  const candidates: Array<string | null | undefined> = [
    c?.expoConfig?.hostUri,
    c?.expoGoConfig?.debuggerHost,
    c?.manifest?.debuggerHost,
    c?.manifest2?.extra?.expoGo?.debuggerHost,
    c?.manifest2?.extra?.expoClient?.hostUri,
    c?.linkingUri,
  ];

  for (const candidate of candidates) {
    const host = extractHostFromValue(candidate);
    if (host) return host;
  }
  return null;
}

function rewriteLoopbackBaseUrlForNative(baseUrl: string) {
  if (Platform.OS === "web") return null;

  try {
    const parsed = new URL(baseUrl);
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return null;
    }

    const expoDevHost = resolveExpoDevHost();
    if (expoDevHost) {
      parsed.hostname = expoDevHost;
      return parsed.toString().replace(/\/+$/, "");
    }

    if (Platform.OS === "android") {
      parsed.hostname = "10.0.2.2";
      return parsed.toString().replace(/\/+$/, "");
    }

    return null;
  } catch {
    return null;
  }
}

function resolveApiBaseUrl() {
  const envBaseUrl =
    normalizeBaseUrl(process.env.EXPO_PUBLIC_CG_API_BASE_URL) ||
    normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envBaseUrl) {
    const rewrittenLoopbackUrl = rewriteLoopbackBaseUrlForNative(envBaseUrl);
    return rewrittenLoopbackUrl || envBaseUrl;
  }

  const expoDevHost = resolveExpoDevHost();
  if (expoDevHost) {
    return `http://${expoDevHost}:3001`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001";
  }
  return "http://localhost:3001";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    } as any;
  }
  return config;
});

export async function ensureSession() {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), SESSION_BOOTSTRAP_TIMEOUT_MS);

  try {
    const res = await api.post("/v1/auth/session", undefined, {
      signal: controller.signal,
    });
    return res.data as { uid: string; user: any };
  } catch (err: unknown) {
    if (axios.isCancel(err)) {
      throw new Error("Session bootstrap timed out. Check API connectivity and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }
}
