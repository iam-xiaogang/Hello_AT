import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Shared proxy rules: applied to BOTH the dev server and the preview server,
// so a production build served via `npm run preview` can reach the backend
// the same way the dev server does. Without this, `/api` requests from the
// built app hit the static server and never reach FastAPI.
const proxy = {
  "/api": "http://localhost:8000",
  // Same-origin proxy for the externally maintained Flask news dashboard.
  // Keeping it under Toolbox's own origin avoids the browser blocking an
  // http:// iframe inside an https page (mixed content).
  "/news": {
    target: "http://154.36.185.251:5001",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/news/, ""),
  },
  // Same-origin proxy for the Streamlit English-learning app. Streamlit uses
  // a WebSocket for interactivity, hence ws: true. The remote service serves
  // under its /english-learning base path, which is preserved by this rule.
  "/english-learning": {
    target: "http://154.36.185.251:8501",
    changeOrigin: true,
    ws: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
});
