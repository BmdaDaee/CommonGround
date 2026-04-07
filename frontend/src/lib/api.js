import axios from 'axios';
import { supabase } from './supabase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API functions
export const api = {
  // Auth
  ensureSession: () => apiClient.post('/auth/session'),
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data) => apiClient.put('/profile', data),
  
  // Pairs
  createPair: () => apiClient.post('/pairs'),
  joinPair: (code) => apiClient.post('/pairs/join', { code }),
  getMyPair: () => apiClient.get('/pairs/me'),
  leavePair: () => apiClient.post('/pairs/leave'),
  
  // Chat (pair)
  sendMessage: (pairId, text, messageId) => apiClient.post(`/chat/${pairId}/send`, { text, message_id: messageId }),
  listMessages: (pairId, limit = 50) => apiClient.get(`/chat/${pairId}/list`, { params: { limit } }),
  
  // AI Chat
  aiChat: (message, mode, vibe) => apiClient.post('/chat', { message, mode, vibe }),
  aiTask: (task, context, vibe) => apiClient.post('/ai', { task, context, vibe }),
  
  // Session
  getSession: (sessionId) => apiClient.get(`/session/${sessionId}`),
};
