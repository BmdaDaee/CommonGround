import axios from 'axios';
import { supabase } from './supabase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
});

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const api = {
  // Auth & Profile
  ensureSession: () => apiClient.post('/auth/session'),
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data) => apiClient.put('/profile', data),
  
  // Favorites & Media
  getFavorites: () => apiClient.get('/favorites'),
  updateFavorites: (category, items) => apiClient.put('/favorites', { category, items }),
  addToPlaylist: (title, artist, cover) => apiClient.post('/playlist', { title, artist, cover }),
  removeFromPlaylist: (songId) => apiClient.delete(`/playlist/${songId}`),
  addWatching: (mediaType, title, currentEpisode, status) => apiClient.post('/watching', { media_type: mediaType, title, current_episode: currentEpisode, status }),
  saveQuickAnswer: (key, value) => apiClient.post('/quick-answer', { key, value }),
  
  // Horoscope & Astrology
  getHoroscope: () => apiClient.get('/horoscope'),
  getZodiacSigns: () => apiClient.get('/zodiac-signs'),
  generateAstrology: (birthDate, birthTime, birthLocation) => apiClient.post('/astrology/generate', { birth_date: birthDate, birth_time: birthTime, birth_location: birthLocation }),
  
  // Daily Question & Sparks
  getDailyQuestion: () => apiClient.get('/daily-question'),
  answerDailyQuestion: (answer) => apiClient.post('/daily-question/answer', { answer }),
  getSparks: () => apiClient.get('/sparks'),
  
  // Trust Building
  getTrustExercises: () => apiClient.get('/trust-exercises'),
  getTrustAdvice: (exerciseId, context, vibe) => apiClient.post(`/trust-advice?exercise_id=${exerciseId}&context=${encodeURIComponent(context || '')}&vibe=${vibe || 'realtalk'}`),
  
  // Growth Modules
  getModules: () => apiClient.get('/modules'),
  getModuleProgress: () => apiClient.get('/modules/progress'),
  startModule: (moduleId) => apiClient.post(`/modules/${moduleId}/start`),
  generateExercise: (moduleId, day) => apiClient.post('/modules/exercise', { module_id: moduleId, day }),
  completeDay: (moduleId, day) => apiClient.post(`/modules/${moduleId}/complete-day/${day}`),
  
  // Calendar
  getCalendarEvents: (month) => apiClient.get('/calendar/events', { params: { month } }),
  createCalendarEvent: (title, date, time, description, eventType) => apiClient.post('/calendar/events', { title, date, time, description, event_type: eventType }),
  deleteCalendarEvent: (eventId) => apiClient.delete(`/calendar/events/${eventId}`),
  
  // Lists
  getListItems: (listType) => apiClient.get(`/lists/${listType}`),
  addListItem: (listType, text) => apiClient.post('/lists', { list_type: listType, text }),
  toggleListItem: (itemId) => apiClient.put(`/lists/${itemId}/toggle`),
  deleteListItem: (itemId) => apiClient.delete(`/lists/${itemId}`),
  aiSuggestList: (listType, context) => apiClient.post(`/lists/ai-suggest/${listType}`, null, { params: { context } }),
  
  // Journal/Confessional
  getJournalEntries: (limit) => apiClient.get('/journal', { params: { limit } }),
  createJournalEntry: (text) => apiClient.post('/journal', { text }),
  analyzeJournalEntry: (entryId) => apiClient.post(`/journal/${entryId}/analyze`),
  
  // Portraits
  getPortraits: () => apiClient.get('/portraits'),
  generatePortrait: (prompt, style) => apiClient.post('/portraits/generate', { prompt, style }),
  
  // AI Chat & Tasks
  aiChat: (message, mode, vibe) => apiClient.post('/chat', { message, mode, vibe }),
  aiTask: (task, context, vibe) => apiClient.post('/ai', { task, context, vibe }),
  aiIgnite: (context, vibe) => apiClient.post('/ai/ignite', null, { params: { context, vibe } }),

  // Pairing
  createPair: () => apiClient.post('/pairs/create'),
  joinPair: (code) => apiClient.post('/pairs/join', { code }),
  getMyPair: () => apiClient.get('/pairs/me'),
  leavePair: () => apiClient.post('/pairs/leave'),

  // DeeplyUs
  getDeeplyPrompts: (category) => apiClient.get('/deeply/prompts', { params: { category } }),
  getDeeplyExercises: () => apiClient.get('/deeply/exercises'),
  unlockDeeply: () => apiClient.post('/deeply/unlock'),
  createDeeplyItem: (itemType, text, sharedWithPartner) => apiClient.post('/deeply/items', { item_type: itemType, text, shared_with_partner: sharedWithPartner }),
  getDeeplyItems: (itemType) => apiClient.get('/deeply/items', { params: { item_type: itemType } }),
  deeplyIgnite: (context, vibe) => apiClient.post('/deeply/ignite', null, { params: { context, vibe } }),
  deeplyExplore: (topic, context) => apiClient.post('/deeply/explore', null, { params: { topic, context } }),

  // Chat messages (P2P)
  getChatMessages: (limit) => apiClient.get('/chat/messages', { params: { limit } }),
  sendChatMessage: (text, mediaData, mediaType) => apiClient.post('/chat/send', { text, media_data: mediaData, media_type: mediaType }),

  // Love Language Quiz
  getLoveLanguageQuiz: () => apiClient.get('/love-language/quiz'),
  submitLoveLanguage: (answers) => apiClient.post('/love-language/submit', { answers }),
  getLoveLanguageResults: () => apiClient.get('/love-language/results'),

  // Enhanced Astrology
  astrologyDeepDive: (birthDate, birthTime, birthLocation, partnerBirthDate, partnerBirthTime) => apiClient.post('/astrology/deep-dive', { birth_date: birthDate, birth_time: birthTime, birth_location: birthLocation, partner_birth_date: partnerBirthDate, partner_birth_time: partnerBirthTime }),

  // Partner Sync
  getPartnerAnswer: () => apiClient.get('/daily-question/partner'),

  // Push Notifications
  pushSubscribe: (endpoint, keys) => apiClient.post('/push/subscribe', { endpoint, keys }),
  pushUnsubscribe: () => apiClient.delete('/push/subscribe'),
  getPushStatus: () => apiClient.get('/push/status'),

  // Notifications (In-App)
  getNotifications: () => apiClient.get('/notifications'),
};
