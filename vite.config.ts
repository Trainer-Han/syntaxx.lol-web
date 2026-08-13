import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "dist", "client");

/**
 * Client-side routes that must exist as real files. Keep in sync with the
 * <Route> list in web/src/App.tsx.
 */
const ROUTES = ["commands", "terms", "privacy"];

/**
 * GitHub Pages has no SPA fallback: it serves the file at the requested path,
 * or its own 404. wouter routes /commands on the client, so a cold load or a
 * refresh of anything but / would miss.
 *
 * The usual fix is to ship index.html again as 404.html and let Pages serve it
 * for everything. That renders correctly but answers 404 for real pages, which
 * crawlers and link previews take at face value. So each known route also gets
 * its own directory index — /commands/index.html answers 200 — and 404.html is
 * left to do its actual job for paths that really are missing.
 */
function staticRoutes(): Plugin {
  return {
    name: "static-routes",
    apply: "build",
    closeBundle() {
      const shell = path.join(outDir, "index.html");
      copyFileSync(shell, path.join(outDir, "404.html"));
      for (const route of ROUTES) {
        mkdirSync(path.join(outDir, route), { recursive: true });
        copyFileSync(shell, path.join(outDir, route, "index.html"));
      }
    },
  };
}

export default defineConfig({
  root: path.resolve(here, "web"),
  plugins: [react(), tailwindcss(), staticRoutes()],
  resolve: {
    alias: {
      "@": path.resolve(here, "web", "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Deployed as-is to GitHub Pages by .github/workflows/pages.yml.
    outDir,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
