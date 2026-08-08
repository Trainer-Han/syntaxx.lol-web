import { Hono } from "hono";
import type { AppEnv } from "./env";
import { loadSession } from "./lib/session";

import auth from "./routes/auth";
import bot from "./routes/bot";
import commands from "./routes/commands";
import discord from "./routes/discord";
import guild from "./routes/guild";
import lore from "./routes/lore";
import reviews from "./routes/reviews";
import supporters from "./routes/supporters";
import verify from "./routes/verify";

const app = new Hono<AppEnv>();

/**
 * Session middleware, standing in for express-session.
 *
 * Loads before the handler and, if the handler called saveSession or
 * destroySession, attaches the Set-Cookie afterwards. Handlers never touch
 * headers themselves.
 */
app.use("/api/*", async (c, next) => {
  c.set("session", await loadSession(c.req.raw, c.env.SESSIONS, c.env.SESSION_SECRET));
  await next();
  const { cookie } = c.get("session");
  if (cookie) c.header("Set-Cookie", cookie, { append: true });
});

/**
 * No CORS middleware, deliberately.
 *
 * The old server ran `cors({ origin: true, credentials: true })` because the
 * Vite dev server and the API were on different ports. Here the SPA and the
 * API are the same Worker on the same origin, so every /api call is
 * same-origin and CORS never applies. Adding a permissive CORS header back
 * would only make the session cookie reachable from other sites.
 */

app.get("/api/healthz", (c) => c.json({ status: "ok" }));

const api = new Hono<AppEnv>();
api.route("/", auth);
api.route("/", bot);
api.route("/", commands);
api.route("/", discord);
api.route("/", guild);
api.route("/", lore);
api.route("/", reviews);
api.route("/", supporters);
api.route("/", verify);
app.route("/api", api);

// An unmatched /api path is a bug in the caller, not a page — answer JSON
// rather than letting it fall through to the SPA shell.
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

/**
 * Anything else is a page. run_worker_first only routes /api/* here, so in
 * practice this is reached only when an asset genuinely does not exist;
 * not_found_handling then serves index.html for client-side routing.
 */
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
