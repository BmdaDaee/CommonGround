import axios from "axios";
import { firebaseAuth } from "./firebase";

const baseURL = process.env.EXPO_PUBLIC_CG_API_BASE_URL || "http://localhost:3001";
const SESSION_BOOTSTRAP_TIMEOUT_MS = 10000;

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await user.getIdToken(true);
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
