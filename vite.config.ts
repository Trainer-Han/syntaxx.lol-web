import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(here, "web"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(here, "web", "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    // wrangler.jsonc serves this directory as the Worker's static assets.
    outDir: path.resolve(here, "dist", "client"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // `npm run dev` serves the SPA with HMR; `npm run dev:api` runs the Worker
    // on 8787. The proxy makes /api same-origin in development, exactly as it
    // is in production, so the session cookie behaves the same way.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: false,
      },
    },
  },
});
