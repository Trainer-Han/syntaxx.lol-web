# syntaxx.lol

The website for the Syntaxx Discord bot — marketing pages and the full command
catalogue, built as a static site and served from GitHub Pages.

```
  browser ── syntaxx.lol ──▶ GitHub Pages ──▶ the built SPA, and nothing else
```

That is the whole architecture. There is no server, no database and no session
on this deployment.

## What this deployment is not

The site used to be one Cloudflare Worker serving both the SPA and an `/api`,
backed by MongoDB, D1 and KV. It was moved to GitHub Pages to reach the domain
without moving nameservers off Porkbun. A static host cannot run any of that,
so these went with it:

| Gone | Why it cannot work here |
| --- | --- |
| Discord login | The OAuth token exchange needs `DISCORD_CLIENT_SECRET`, which a static site has nowhere to keep |
| The server dashboard | Every setting was a write to the bot's MongoDB |
| IP verification | Same, plus `IP_HASH_SALT` |
| Reviews, lore, supporters | Read from D1 at request time |
| Live bot stats | Read from MongoDB at request time |

What is left is a real marketing site: hero, features, the complete command
catalogue with search, terms, privacy, and a 404.

**`worker/`, `wrangler.jsonc` and `migrations/` are still in the repo** and
still typecheck and bundle in CI. They are not deployed. They are kept so the
API can be revived — on Cloudflare or anywhere else — without rewriting it. See
CLAUDE.md before assuming anything in there is live.

## How this ships

**`main` is where work happens. `live-website` is what the public sees.**

```
  main ──────●───●───●──────●         ← push freely, experiment, break things
                          ╲
                           PR + CI     ← required: no direct pushes
                            ╲
  live-website ──●───────────●        ← deploy workflow → syntaxx.lol
```

Rules on `live-website`:

- **Direct pushes are blocked**, by branch protection and by
  `scripts/hooks/pre-push`. Everything arrives via a PR.
- **Merging is the owner's decision.** Opening a PR is fine; merging it is not
  something tooling or an assistant should do on its own.
- **The `verify` check must pass** before the PR can merge.

```sh
git switch main
# ...work, commit...
git push origin main                       # safe: does not touch the live site

gh pr create --base live-website --head main \
  --title "Ship: what changed" --body "..."
# wait for `verify` to go green, then merge — deploy runs automatically
```

## One-time setup

No account, no CLI, no credentials. The build is public and the deploy runs on
GitHub's own runners.

**1. Turn on Pages.** Repo → Settings → Pages → Build and deployment →
Source: **GitHub Actions**. Not "Deploy from a branch" — `pages.yml` uploads an
artifact, and the branch option ignores it.

**2. Point the domain at GitHub.** `syntaxx.lol` stays on Porkbun's
nameservers; only these records change. At Porkbun → DNS:

| Type | Host | Answer |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `trainer-han.github.io` |

All four A records are needed — they are GitHub's four Pages edge addresses,
not alternatives. Leave the existing `MX` and SPF `TXT` records alone; mail
forwarding is unaffected because the nameservers are not moving.

**3. Set the custom domain.** Repo → Settings → Pages → Custom domain →
`syntaxx.lol` → Save, then tick **Enforce HTTPS** once the certificate is
issued (a few minutes; the box is greyed out until DNS resolves).

`web/public/CNAME` carries the same domain into every build. Both matter: the
setting binds the domain, and the file keeps it bound when the artifact is
replaced.

**4. Deploy.** Merge `main` into `live-website`. That is the only trigger.

## Local development

One process. There is no API to run alongside it any more:

```sh
npm install
npm run dev        # Vite on :5173
```

To exercise exactly what Pages serves, including the per-route `index.html`
files and the 404 fallback, build and use the check script's server:

```sh
npm run build
npm run browser-check
```

Note that opening `web/index.html` in a browser directly will always show a
**blank page**. It is a Vite entry template: the script tag points at
`/src/main.tsx`, raw TypeScript and JSX that no browser can execute. Use the
dev server or a build.

### Routing on a static host

Pages serves files, not routes. A request for `/commands` has to find something
on disk, so `vite.config.ts` copies the built `index.html` to `commands/`,
`terms/` and `privacy/` after every build, plus `404.html` for everything else.

**Adding a route means editing two files** — the `<Route>` list in
`web/src/App.tsx` and the `ROUTES` array in `vite.config.ts`. Miss the second
and the page works in `npm run dev` and 404s in production;
`scripts/browser-check.js` asserts the HTTP status of every route to catch
exactly that.

### Browser checks

`verify.js` reads files. `browser-check.js` loads pages, across a mobile and a
desktop viewport, and fails on a blank render, an uncaught exception, a failed
request or horizontal overflow:

```sh
npm run build
npm install --no-save puppeteer-core
npm run browser-check
```

It drives an already-installed Chrome via `puppeteer-core`, so there is no
browser download. Set `CHROME_PATH` if it is not found automatically.

## Layout

| Path | What it is |
| --- | --- |
| `web/` | The React SPA — pages, the four UI components it actually uses |
| `web/src/config.ts` | The public Discord application id and the invite URL |
| `web/public/CNAME` | Binds the build to syntaxx.lol |
| `vite.config.ts` | Build config, and the per-route `index.html` emitter |
| `scripts/verify.js` | Static pre-flight checks |
| `scripts/browser-check.js` | Runtime checks in real Chrome — blank pages, route status |
| `scripts/make-icons.mjs` | Regenerates the favicon set from the logo |
| `.github/workflows/pages.yml` | Build and publish, on push to `live-website` |

Kept, but **not deployed** — the Cloudflare implementation, in case the API
comes back:

| Path | What it was |
| --- | --- |
| `worker/src/index.ts` | Entry point: session middleware, `/api` mounting, asset fallback |
| `worker/src/routes/` | One file per route group, ported from the old Express server |
| `worker/src/lib/db.ts` | MongoDB, with the Workers rules enforced |
| `worker/src/lib/session.ts` | KV-backed sessions, replacing `express-session` |
| `worker/src/lib/guards.ts` | `isOwner`, `canManageGuild`, constant-time compare |
| `migrations/` | D1 schema and the lore seed |
| `wrangler.jsonc` | Worker config — bindings, routes, compatibility flags |

## History: the Replit export, and the Worker port

Both of these predate the move to GitHub Pages and describe `worker/`, which is
no longer deployed. Kept because the bugs and the reasoning are still real if
the API is ever revived.

The export was a pnpm monorepo built from a Replit "route optimizer" template.
Ported to a plain npm project on Workers:

- **Express 5 → Hono.** `express-session`'s MemoryStore cannot work on a
  stateless edge runtime. Sessions are now a signed cookie carrying an id, with
  the payload in KV — the Discord guild list is far too big for a 4KB cookie.
- **Postgres → D1.** Four routes used Replit's built-in Postgres. The SQL moved
  to SQLite: `$1` → `?`, `TIMESTAMPTZ`/`NOW()` → `TEXT`/`CURRENT_TIMESTAMP`,
  `NUMERIC` → `REAL`, `BOOLEAN` → `INTEGER`, `BOOL_OR(x)` → `MAX(CASE …)`,
  `COUNT(*)::int` → `COUNT(*)`.
- **Seeding moved into a migration.** `lore.ts` seeded on process start and then
  patched placeholder rows in place on every boot. A Worker has no start-up
  hook, so the content is `migrations/0002_seed_lore.sql`, applied once. All
  seven chapters carried over byte-for-byte; the placeholder-patching pass is
  gone because the real text is inserted directly.
- **Dead template code removed** — route optimizer, PDF parser and generator,
  Overpass geocoder, empty Stripe stubs, the unused Drizzle/OpenAPI packages,
  and 60 of the 64 shadcn UI components (the pages import four).
- **In-memory caches → the edge cache.** `discord.ts` memoised lookups in a
  module-level `Map`, which on Workers would be empty far more often than not.
- **Post-response work → `waitUntil`.** The old code sent the response and then
  awaited DM sends and icon refreshes. A Worker is torn down at return.

### Three bugs fixed on the way

- **`/api/bot/growth` never showed real data.** The bot writes
  `timestamp: Date.now()` — a number — and the query filtered
  `timestamp >= new Date(...).toISOString()`, a string. BSON sorts every number
  below every string, so the filter matched nothing and every chart silently
  fell back to generated mock data. Now compares number to number.
- **Guild settings had no authorization.** `verify.ts`'s routes checked only
  that *someone* was logged in, so any Discord user could PATCH any server's
  verification config or make the bot post an embed into a server they had
  nothing to do with. Now behind `canManageGuild`.
- **`/api/bot/guilds` and `/api/bot/guild/:id/channels` leaked.** Any logged-in
  user could enumerate every server the bot is in and list its channels. Now
  restricted to guilds the caller administers. If you *want* cross-posting into
  servers you don't manage, that guard in `worker/src/routes/guild.ts` is the
  one to relax — deliberately.

## Known gaps

- **AdSense slot ids are placeholders.** `web/src/App.tsx` has
  `LEFT_AD_SLOT`/`RIGHT_AD_SLOT` set to `"0000000000"`. The ad strips render
  nothing useful until real slot ids from the AdSense dashboard replace them.
- **No dashboard, and no path to one here.** The largest gap by far. See
  "What this deployment is not" — it needs a host that runs code.
- **No `og:image` at the right aspect ratio.** Link previews use the square
  logo; a 1200×630 card would look better in Discord and on Twitter.

## Icons

`web/public`'s favicon set and the compressed logo are generated, and
committed. Regenerate after changing the artwork:

```sh
npm install --no-save sharp
node scripts/make-icons.mjs
```

sharp is deliberately not a project dependency — it is a native module, and
installing it on every CI run and every clone is a poor trade for something
used about once a year.
