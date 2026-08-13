#!/usr/bin/env node
/**
 * Runtime checks in a real browser.
 *
 * `verify.js` reads files; this one loads pages. It exists because a build can
 * succeed, a typecheck can pass, every route can answer HTTP 200 — and the app
 * can still render nothing. Only a browser catches that.
 *
 * It serves `dist/client` the way GitHub Pages does, including serving
 * 404.html for unknown paths, so client-side routes are exercised properly.
 *
 * Requires puppeteer-core and an already-installed Chrome, so there is no
 * ~150MB browser download:
 *
 *     npm install --no-save puppeteer-core
 *     CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
 *       node scripts/browser-check.js
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist", "client");

// Every route the static build serves, plus one that must land on the 404 page
// and still render — that path is what proves the 404.html fallback works.
//
// `notFound` marks the one route expected to answer 404: Chrome logs a console
// error for a 404 document, which is correct there and a real failure anywhere
// else. A real route answering 404 means vite.config.ts's ROUTES list has
// drifted from App.tsx's routes.
const ROUTES = [
  { path: "/", notFound: false },
  { path: "/commands", notFound: false },
  { path: "/terms", notFound: false },
  { path: "/privacy", notFound: false },
  { path: "/no-such-page", notFound: true },
];

// Both are checked: the ad strips render only on wide screens, and the narrow
// case is where the AdSense zero-width TagError used to fire.
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1600, height: 900 },
];

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2", ".gif": "image/gif",
};

// Requests the page is expected to fail: ad and analytics hosts are blocked in
// plenty of environments. `recaptcha` is here because the AdSense script loads
// a reCAPTCHA frame and then aborts it itself; it is Google's noise, not ours.
const EXPECTED_FAILURES =
  /googlesyndication|doubleclick|google-analytics|adtrafficquality|google\.com\/recaptcha/;

async function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);

    let file = join(dist, path);
    let status = 200;
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      // Exactly what Pages does with an unmatched path: serve 404.html, with
      // the 404 status intact. If the build did not emit it, this check fails
      // here rather than in production.
      file = join(dist, "404.html");
      status = 404;
    }

    try {
      const body = await readFile(file);
      res.writeHead(status, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

const chromePath =
  process.env.CHROME_PATH ??
  ["C:/Program Files/Google/Chrome/Application/chrome.exe",
   "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find(Boolean);

let puppeteer;
try {
  puppeteer = (await import("puppeteer-core")).default;
} catch {
  console.error("puppeteer-core is not installed. Run: npm install --no-save puppeteer-core");
  process.exit(1);
}

const { server, origin } = await serve();
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const problems = [];

for (const viewport of VIEWPORTS) {
  for (const { path: route, notFound } of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width: viewport.width, height: viewport.height });

    const where = `${route} @ ${viewport.name}`;
    page.on("pageerror", (e) => problems.push(`${where}: uncaught ${e.name}: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() !== "error" || EXPECTED_FAILURES.test(m.text())) return;
      if (notFound && /status of 404/.test(m.text())) return;
      problems.push(`${where}: console error: ${m.text().slice(0, 160)}`);
    });
    page.on("requestfailed", (r) => {
      if (!EXPECTED_FAILURES.test(r.url())) {
        problems.push(`${where}: request failed ${r.failure()?.errorText} ${r.url().slice(0, 120)}`);
      }
    });

    let response;
    try {
      response = await page.goto(origin + route, { waitUntil: "networkidle2", timeout: 45000 });
    } catch (e) {
      problems.push(`${where}: navigation failed: ${String(e).slice(0, 140)}`);
      await page.close();
      continue;
    }

    // A real route answering 404 renders fine but tells crawlers the page does
    // not exist, so it is a failure here, not a cosmetic detail.
    const status = response?.status();
    const wanted = notFound ? 404 : 200;
    if (status !== wanted) {
      problems.push(`${where}: expected HTTP ${wanted}, got ${status} — is the route in vite.config.ts's ROUTES?`);
    }

    const info = await page.evaluate(() => {
      const root = document.getElementById("root");
      return {
        children: root ? root.childElementCount : 0,
        text: ((document.body && document.body.innerText) || "").trim().length,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    // The blank-page check, which is the whole point of this script.
    if (info.children === 0 || info.text < 20) {
      problems.push(`${where}: rendered nothing (#root children=${info.children}, ${info.text} chars of text)`);
    }
    if (info.overflow) problems.push(`${where}: page scrolls horizontally`);

    await page.close();
  }
}

await browser.close();
server.close();

if (problems.length > 0) {
  console.error("browser-check failed:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("");
  process.exit(1);
}

console.log(`browser-check: ${ROUTES.length * VIEWPORTS.length} page loads, all clean`);
