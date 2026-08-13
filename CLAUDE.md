# Working rules for this repo

## Never move the live branch

`live-website` is what **syntaxx.lol** serves. `.github/workflows/pages.yml`
builds and publishes from it.

**Do not push to `live-website`. Do not merge pull requests into it.**

Opening a PR is fine and expected. Merging is the owner's decision, every
time, without exception — no "it's only a small change", no "CI is green so
it's safe", no "the previous one was approved so this one is too". Approval
of one deploy is never approval of the next.

This is enforced locally by `scripts/hooks/pre-push`, enabled with:

```sh
git config core.hooksPath scripts/hooks
```

Server-side branch protection cannot cover this on its own: tooling operating
through the owner's credentials is indistinguishable from the owner, so the
rule has to hold here.

### The only correct way to ship

```sh
git push origin main                       # always safe
gh pr create --base live-website --head main --title "..." --body "..."
# then stop, and tell the owner the PR is ready
```

## The site is static, and has no backend

syntaxx.lol is a **static build on GitHub Pages**. There is no server, no
database, and no session. Anything that needs one cannot be added to this site
without first choosing a host to run it on.

That rules out, on this deployment: Discord login, the per-server dashboard, IP
verification, reviews, lore, supporters, and live bot statistics. Those pages
were deleted in the move — don't reintroduce a `fetch("/api/...")` and expect it
to resolve. It will 404 into the SPA shell.

**`worker/`, `wrangler.jsonc` and `migrations/` are still in the tree but are
not deployed.** They are the Cloudflare Workers implementation the site ran on
before, kept so the API can come back without being rewritten. Treat them as
reference, not as live code: editing them changes nothing that visitors see.

If the dashboard is wanted back, that is a hosting decision for the owner, not
something to solve by bolting a client-side call onto the static site. Discord
OAuth in particular cannot work here — the token exchange needs
`DISCORD_CLIENT_SECRET`, and a static site has nowhere to keep it.

## If the Worker is ever revived

These rules were true of it and would be true again:

- `MONGODB_URI` points at the **same Atlas cluster the bot uses**. The dashboard
  writes the collections the bot reads (`automodsettings`, `customcommands`,
  `memberlogs`, `leveltoggles`, `levelchannels`, `verificationconfigs`,
  `verifiedips`, `carcommandsettings`, `catcommandsettings`). A change to how
  this repo writes them is a change to bot behaviour — check `Schemas/` in the
  bot repo before altering a shape, and never "clean up" a field name on one
  side only.
- D1 (`DB`) is the opposite: site-only content, nothing else reads it.
- Secrets are set with `wrangler secret put`, never written into
  `wrangler.jsonc` — that file is public in the repo.
- Don't add a CORS middleware. The SPA and the API were the same Worker on the
  same origin; a permissive CORS header would only expose the session cookie
  to other sites.
- MongoDB clients must be created **inside** a request handler, never at module
  scope. See the comment at the top of `worker/src/lib/db.ts`.

## Other standing rules

- `main` is the working branch — push there freely.
- Run `node scripts/verify.js` and `npm run typecheck` before opening a PR.
- Never commit `.dev.vars`, `.env`, or `.idea/`.
- Adding a client-side route means adding it in **two** places: the `<Route>`
  list in `web/src/App.tsx` and the `ROUTES` list in `vite.config.ts`. Pages
  serves files, so a route with no emitted `index.html` answers 404.
  `scripts/browser-check.js` fails when the two drift.
- `web/public/CNAME` is what binds the build to syntaxx.lol. Deleting it
  unbinds the custom domain on the next deploy.
