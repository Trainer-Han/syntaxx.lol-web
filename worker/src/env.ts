/**
 * Bindings and configuration the Worker receives.
 *
 * Everything in `vars` (wrangler.jsonc) is public and ships in the config
 * file. Everything else is a Worker secret set with `wrangler secret put`.
 */
export interface Env {
  /** Static assets — the built SPA. Used to serve index.html as a fallback. */
  ASSETS: Fetcher;

  /** Session payloads. The cookie only carries a signed id. */
  SESSIONS: KVNamespace;

  /** Site-only content: supporters, reviews, lore, custom command listings. */
  DB: D1Database;

  // ── vars ──────────────────────────────────────────────────────────────────
  DISCORD_CLIENT_ID: string;
  DISCORD_REDIRECT_URI: string;

  // ── secrets ───────────────────────────────────────────────────────────────
  /** The bot's own Atlas cluster. The dashboard writes what the bot reads. */
  MONGODB_URI: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  /** Must match the bot's IP_HASH_SALT or alt detection stops agreeing. */
  IP_HASH_SALT: string;
}

/** Hono's generic slot, so `c.env` and `c.get("session")` are typed. */
export type AppEnv = {
  Bindings: Env;
  Variables: {
    session: import("./lib/session").Session;
  };
};

/** Discord user id of the bot owner — unlocks the owner-only editing UI. */
export const BOT_OWNER_ID = "407257374315905024";
