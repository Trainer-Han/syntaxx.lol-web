import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../env";

const discord = new Hono<AppEnv>();

const CACHE_SECONDS = 60 * 60; // 1 hour, as the original in-memory cache used
const SNOWFLAKE = /^\d{17,20}$/;

/**
 * The Express version memoised these lookups in a module-level Map. That does
 * not survive on Workers — isolates come and go, so the Map would be empty far
 * more often than not. The edge cache is the equivalent that actually works,
 * and it is shared across isolates rather than per-process.
 *
 * Both endpoints return public profile data, so caching at the edge is safe.
 */
async function cached(
  c: Context<AppEnv>,
  build: () => Promise<Response>,
): Promise<Response> {
  const cache = caches.default;
  const key = new Request(new URL(c.req.raw.url).toString(), { method: "GET" });

  const hit = await cache.match(key);
  if (hit) return hit;

  const fresh = await build();
  if (fresh.ok) {
    const toCache = new Response(fresh.clone().body, fresh);
    toCache.headers.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
    c.executionCtx.waitUntil(cache.put(key, toCache.clone()));
    return toCache;
  }
  return fresh;
}

// GET /api/discord/user/:id
discord.get("/discord/user/:id", async (c) => {
  const id = c.req.param("id");
  if (!SNOWFLAKE.test(id)) return c.json({ error: "Invalid Discord user ID" }, 400);
  if (!c.env.DISCORD_BOT_TOKEN) return c.json({ error: "Bot token not configured" }, 503);

  return cached(c, async () => {
    const resp = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}` },
    });
    if (!resp.ok) {
      return Response.json({ error: "Discord API error" }, { status: resp.status });
    }

    const data = (await resp.json()) as {
      username: string;
      avatar: string | null;
      global_name?: string;
    };

    return Response.json({
      id,
      username: data.global_name ?? data.username,
      avatarUrl: data.avatar
        ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.png?size=128`
        : // Default avatar index, per Discord's own scheme for migrated accounts.
          `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) % 6n)}.png`,
    });
  });
});

// GET /api/discord/guild/:id
discord.get("/discord/guild/:id", async (c) => {
  const id = c.req.param("id");
  if (!SNOWFLAKE.test(id)) return c.json({ error: "Invalid guild ID" }, 400);
  if (!c.env.DISCORD_BOT_TOKEN) return c.json({ error: "Bot token not configured" }, 503);

  return cached(c, async () => {
    const resp = await fetch(`https://discord.com/api/v10/guilds/${id}`, {
      headers: { Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}` },
    });
    if (!resp.ok) {
      return Response.json({ error: "Discord API error" }, { status: resp.status });
    }

    const data = (await resp.json()) as { name: string; icon: string | null };
    return Response.json({
      id,
      name: data.name,
      iconUrl: data.icon
        ? `https://cdn.discordapp.com/icons/${id}/${data.icon}.png?size=128`
        : null,
    });
  });
});

export default discord;
