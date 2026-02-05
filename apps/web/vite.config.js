import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Non-stream chat
      "/chat": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },

      // Streaming chat (SSE over POST)
      "/chat-stream": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },

      // Prototype-style tools
      "/ai": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },

      // Debug endpoints
      "/session": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/debug": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },

      // Optional: health
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },

      // Optional: voice endpoints if you use them
      "/voice-packs": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/speak": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});