import axios from 'axios';
import { firebaseAuth } from './firebase';

const baseURL = process.env.EXPO_PUBLIC_CG_API_BASE_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
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
