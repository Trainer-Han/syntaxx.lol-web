# syntaxx.lol

The website and dashboard for the Syntaxx Discord bot — marketing pages, the
per-server configuration dashboard, IP verification, lore, and reviews.

One Cloudflare Worker serves both the React SPA and the `/api` routes, so every
request is same-origin and the session cookie is first-party.

```
  browser ── syntaxx.lol ──▶ Worker ─┬─▶ static assets   the built SPA
                                     ├─▶ /api/*          Hono routes
                                     │
                                     ├─▶ MongoDB Atlas   shared with the bot
                                     ├─▶ D1              site-only content
                                     ├─▶ KV              sessions
                                     └─▶ Discord REST    as the bot
```

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

## The two databases

This is the single most important thing to understand before changing anything.

| Store | Binding | Holds | Shared? |
| --- | --- | --- | --- |
| **MongoDB Atlas** | `MONGODB_URI` | Guild settings, automod, levels, member logs, verification, bot stats | **Yes — the bot's own database** |
| **D1** (SQLite) | `DB` | Supporters, reviews, lore books/chapters, custom-command listings | No — site only |
| **KV** | `SESSIONS` | Login sessions | No |

The dashboard's whole purpose is writing settings the bot reads back, so
`MONGODB_URI` must be the bot's `DatabaseURL` from its `config.json`. The
collection names line up 1:1 with the bot's Mongoose models in `Schemas/`:
`AutomodSettings` → `automodsettings`, `MemberLog` → `memberlogs`, and so on.
Point this at a different database and the dashboard becomes decorative.

D1 is separate on purpose. Supporters and reviews are read on every public page
load; serving them from D1 avoids paying a MongoDB TCP + TLS + SCRAM handshake
to render the home page.

### MongoDB on Workers

It works, with rules that are not optional:

- `nodejs_compat` plus a compatibility date ≥ 2024-09-23. That is what supplies
  `node:net` and `node:tls`'s `TLSSocket`/`connect`, which the driver needs.
  Do **not** also list `nodejs_compat_v2` — the date already implies it.
- The driver is pinned to **6.x**. That is the line reported working on
  workerd; 7.x has not been verified there.
- **Connect inside the request handler**, never at module scope, and keep
  `maxPoolSize: 1`. An isolate is not a long-lived process; a socket opened for
  one request is not valid for the next. `worker/src/lib/db.ts` handles this —
  use `withDb`.
- **Atlas Network Access must be `0.0.0.0/0`.** Workers' outbound TCP comes
  from a prefix that is not in Cloudflare's published IP ranges, so there is no
  meaningful allowlist to write. SCRAM + TLS is what protects the cluster.

Every request that touches Mongo pays a fresh handshake. That is the cost of
the serverless choice, not a bug.

## One-time setup

You need a Cloudflare account and the Discord application's credentials.

```sh
npm install
npx wrangler login
```

**1. Create the storage, and paste the ids into `wrangler.jsonc`:**

```sh
npx wrangler kv namespace create SESSIONS     # → id for kv_namespaces
npx wrangler d1 create syntaxx-site           # → database_id for d1_databases
```

**2. Set `DISCORD_CLIENT_ID`** in `wrangler.jsonc` `vars` (the Discord
application id — not a secret; it also builds the bot invite link).

`node scripts/verify.js` fails until all three are filled in. That is
deliberate: a half-configured deploy should not be possible.

**3. Set the secrets** (these never go in `wrangler.jsonc`, which is public):

```sh
npx wrangler secret put MONGODB_URI            # the bot's DatabaseURL
npx wrangler secret put DISCORD_BOT_TOKEN
npx wrangler secret put DISCORD_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET         # any long random string
npx wrangler secret put IP_HASH_SALT           # set once, then never change
```

`IP_HASH_SALT` must stay stable. Changing it makes every previously verified IP
stop matching, silently resetting alt detection for every server.

**4. Create the schema:**

```sh
npx wrangler d1 migrations apply syntaxx-site --remote
```

**5. Discord application** → OAuth2 → add the redirect URL exactly:

```
https://syntaxx.lol/api/auth/callback
```

It must match `DISCORD_REDIRECT_URI` in `wrangler.jsonc` byte for byte.

**6. Deploy, and attach the domain:**

```sh
npm run deploy
```

Then Workers & Pages → `syntaxx-lol` → Settings → Domains & Routes → add
`syntaxx.lol` and `www.syntaxx.lol` as custom domains. If the zone is already
on Cloudflare, the DNS records are created for you.

**7. For the deploy workflow**, add two GitHub repo secrets:
`CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers template) and
`CLOUDFLARE_ACCOUNT_ID`.

## Local development

Two processes, because the SPA wants hot reload and the API wants workerd:

```sh
npm run dev        # Vite on :5173, proxying /api to :8787
npm run dev:api    # the Worker on :8787
```

Put local secrets in `.dev.vars` (gitignored — copy `.dev.vars.example`), and
create the local database once:

```sh
npx wrangler d1 migrations apply syntaxx-site --local
```

`wrangler dev` holds its own copy of D1, so restart it after applying
migrations.

To exercise it exactly as it ships — one origin, no proxy:

```sh
npm run build && npx wrangler dev
```

## Layout

| Path | What it is |
| --- | --- |
| `web/` | The React SPA — pages, the four UI components it actually uses |
| `worker/src/index.ts` | Entry point: session middleware, `/api` mounting, asset fallback |
| `worker/src/routes/` | One file per route group, ported from the old Express server |
| `worker/src/lib/db.ts` | MongoDB, with the Workers rules enforced |
| `worker/src/lib/session.ts` | KV-backed sessions, replacing `express-session` |
| `worker/src/lib/guards.ts` | `isOwner`, `canManageGuild`, constant-time compare |
| `migrations/` | D1 schema and the lore seed |
| `scripts/verify.js` | Static pre-flight checks |

## What changed from the Replit export

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
- **Favicons are a single `.ico`.** The export referenced `favicon-32x32.png`,
  `favicon-16x16.png`, `apple-touch-icon.png` and `android-chrome-512x512.png`,
  none of which were in it. The bot repo's real logo and `.ico` are used
  instead; a proper multi-size set can be generated from `syntaxx-logo.png`.
- **`syntaxx-logo.png` is 568 KB** at 724×724 — worth compressing.
- **The JS bundle is 630 KB** (187 KB gzipped) in one chunk. Route-level code
  splitting would help; nothing is broken without it.
- **Node 20 caps the toolchain.** wrangler 4.120+ needs Node 22, so wrangler is
  pinned to 4.86 and `compatibility_date` to `2026-05-01`. Both can be raised
  together after a Node upgrade; nothing depends on a newer date.
