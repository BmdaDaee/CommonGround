export const apiBaseURL =
  (process.env.EXPO_PUBLIC_CG_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL ||
    "http://localhost:3001").trim();
