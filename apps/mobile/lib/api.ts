import axios from 'axios';
import { apiBaseURL, isSupabaseLocked } from './runtime';

export const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  if (isSupabaseLocked) return config;

  const { firebaseAuth } = await import('./firebase');
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export async function ensureSession() {
  const res = await api.post('/v1/auth/session');
  return res.data as { uid: string; user: any };
}
