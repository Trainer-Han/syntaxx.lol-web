#!/usr/bin/env node
/**
 * Static pre-flight checks, run before anything can reach live-website.
 *
 * These are the failures that a typecheck and a build will not catch: a
 * reference to an asset that is not in the repo, a secret pasted into a
 * tracked file, a migration numbered twice. Each one has a cheap check and an
 * expensive discovery-in-production.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const fail = (msg) => problems.push(msg);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// ── 1. Root-absolute asset references must exist in web/public ──────────────
//
// `import logoUrl from "/syntaxx-logo.png"` fails the build, but a bare
// href="/foo.png" in markup fails silently as a 404 in production. The
// original export referenced four favicons that were never in it.
{
  const publicDir = join(root, "web", "public");
  const sources = [
    join(root, "web", "index.html"),
    ...walk(join(root, "web", "src")).filter((f) => /\.(tsx?|css|html)$/.test(f)),
  ];

  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    const refs = text.matchAll(/["'`](\/[A-Za-z0-9_\-./]+\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?))["'`]/g);
    for (const [, ref] of refs) {
      if (!existsSync(join(publicDir, ref))) {
        fail(`${relative(root, file)} references ${ref}, which is not in web/public`);
      }
    }
  }
}

// ── 2. No secrets in tracked files ──────────────────────────────────────────
//
// The Worker's secrets live in `wrangler secret put`. Anything that looks like
// a live credential in the tree is either a mistake or an example that reads
// like one.
{
  const patterns = [
    [/mongodb\+srv:\/\/[^\s"'<>]*:[^\s"'<>@]+@/i, "a MongoDB connection string with credentials"],
    [/\b[MNO][A-Za-z0-9_-]{23}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b/, "a Discord bot token"],
  ];
  const skip = /node_modules|[/\\]dist[/\\]|[/\\]\.wrangler[/\\]|[/\\]\.git[/\\]|\.dev\.vars$|package-lock\.json/;

  for (const file of walk(root).filter((f) => !skip.test(f))) {
    if (!/\.(ts|tsx|js|mjs|json|jsonc|md|sql|ya?ml|html|example)$/.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const [pattern, what] of patterns) {
      // The example file deliberately shows the SHAPE of a URI; a placeholder
      // user:pass is not a leak.
      if (file.endsWith(".example") && /user:pass@/.test(text)) continue;
      if (pattern.test(text)) fail(`${relative(root, file)} looks like it contains ${what}`);
    }
  }
}

// ── 3. Wrangler config placeholders must be replaced before deploying ───────
{
  const config = readFileSync(join(root, "wrangler.jsonc"), "utf8");
  for (const placeholder of ["REPLACE_WITH_KV_NAMESPACE_ID", "REPLACE_WITH_D1_DATABASE_ID"]) {
    if (config.includes(placeholder)) {
      fail(`wrangler.jsonc still contains ${placeholder} — see the README's one-time setup`);
    }
  }
  if (/"DISCORD_CLIENT_ID":\s*""/.test(config)) {
    fail("wrangler.jsonc has an empty DISCORD_CLIENT_ID — OAuth and the invite link will not work");
  }
}

// ── 4. Home's headline figures must match the real command catalogue ────────
//
// Home advertises a command count and a category count. The catalogue itself
// lives in Commands.tsx and cannot be imported into Home without pulling a
// 27 kB list into the landing page's bundle, so the figures are written out by
// hand — which means they can quietly stop being true the moment a command is
// added. A visitor cannot tell; the numbers just become a small lie.
{
  const commands = readFileSync(join(root, "web", "src", "pages", "Commands.tsx"), "utf8");
  const home = readFileSync(join(root, "web", "src", "pages", "Home.tsx"), "utf8");

  // Category objects in the array are the ones declaring an `id:` and a
  // `label:` on the same line; command entries declare `name:` and `desc:`.
  const categories = [...commands.matchAll(/^\s*id:\s*"[^"]+",\s*label:/gm)].length;
  const commandCount = [...commands.matchAll(/^\s*\{\s*name:\s*"/gm)].length;

  const stated = (label) => {
    const m = home.match(new RegExp(`value:\\s*"([^"]+)",\\s*label:\\s*"${label}"`));
    return m ? m[1] : null;
  };

  const statedCategories = stated("Categories");
  if (statedCategories !== null && Number(statedCategories) !== categories) {
    fail(
      `Home.tsx advertises ${statedCategories} categories, but Commands.tsx defines ${categories}`,
    );
  }

  // "100+" style claims only need to remain a true lower bound.
  const statedCommands = stated("Commands");
  if (statedCommands !== null) {
    const floor = Number(statedCommands.replace("+", ""));
    if (Number.isFinite(floor) && commandCount < floor) {
      fail(
        `Home.tsx advertises "${statedCommands}" commands, but Commands.tsx defines only ${commandCount}`,
      );
    }
  }
}

// ── 5. Migrations must be uniquely and contiguously numbered ────────────────
//
// D1 applies migrations in filename order and records what it has run. Two
// files sharing a number apply in an order that depends on the filesystem.
{
  const dir = join(root, "migrations");
  const seen = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
    const num = file.slice(0, 4);
    if (!/^\d{4}$/.test(num)) fail(`migrations/${file} does not start with a 4-digit number`);
    if (seen.has(num)) fail(`migrations/${file} reuses number ${num} (also ${seen.get(num)})`);
    seen.set(num, file);
  }
}

if (problems.length > 0) {
  console.error("verify failed:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("");
  process.exit(1);
}

console.log("verify: all checks passed");
