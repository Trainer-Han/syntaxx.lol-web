# Working rules for this repo

## Never move the live branch

`live-website` is what **syntaxx.lol** serves. The deploy workflow builds from it.

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

## This site shares the bot's database

`MONGODB_URI` points at the **same Atlas cluster the bot uses**. The dashboard
writes the collections the bot reads (`automodsettings`, `customcommands`,
`memberlogs`, `leveltoggles`, `levelchannels`, `verificationconfigs`,
`verifiedips`, `carcommandsettings`, `catcommandsettings`). A change to how
this repo writes them is a change to bot behaviour — check `Schemas/` in the
bot repo before altering a shape, and never "clean up" a field name on one
side only.

D1 (`DB`) is the opposite: site-only content, nothing else reads it.

## Other standing rules

- `main` is the working branch — push there freely.
- Run `node scripts/verify.js` and `npm run typecheck` before opening a PR.
- Never commit `.dev.vars`, `.env`, or `.idea/`.
- Secrets are set with `wrangler secret put`, never written into
  `wrangler.jsonc` — that file is public in the repo.
- Don't add a CORS middleware. The SPA and the API are the same Worker on the
  same origin; a permissive CORS header would only expose the session cookie
  to other sites.
- MongoDB clients must be created **inside** a request handler, never at module
  scope. See the comment at the top of `worker/src/lib/db.ts`.
