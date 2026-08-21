import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      // Keep the externally maintained Flask news dashboard same-origin with
      // Toolbox. Its own `/api/lookup` request therefore becomes
      // `/news-agent/api/lookup` and is transparently forwarded to Flask.
      "/news-agent": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-agent/, ""),
      },
      // Streamlit uses a WebSocket for interactivity. Start it with
      // --server.baseUrlPath=english-learning so its assets stay under this
      // proxy path as well.
      "/english-learning": {
        target: "http://127.0.0.1:8501",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
