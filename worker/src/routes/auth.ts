import { Hono } from "hono";
import type { AppEnv } from "../env";
import { BOT_OWNER_ID } from "../env";
import { avatarUrl, iconUrl } from "../lib/discord";
import { destroySession, saveSession, type SessionGuild } from "../lib/session";

const auth = new Hono<AppEnv>();

/**
 * The redirect URI must be byte-identical to the one registered on the
 * Discord application, so the configured value wins. Deriving it from the
 * request host is only a development convenience.
 */
function redirectUri(c: { env: AppEnv["Bindings"]; req: { url: string } }): string {
  if (c.env.DISCORD_REDIRECT_URI) return c.env.DISCORD_REDIRECT_URI;
  return new URL("/api/auth/callback", c.req.url).toString();
}

// GET /api/auth/login — bounce to Discord
auth.get("/auth/login", (c) => {
  const params = new URLSearchParams({
    client_id: c.env.DISCORD_CLIENT_ID,
    redirect_uri: redirectUri(c),
    response_type: "code",
    scope: "identify guilds",
  });
  return c.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// GET /api/auth/callback — exchange the code and build the session
auth.get("/auth/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.json({ error: "Missing code" }, 400);

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: c.env.DISCORD_CLIENT_ID,
        client_secret: c.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(c),
      }),
    });

    const tokenData = (await tokenRes.json()) as Record<string, unknown>;
    if (!tokenRes.ok) {
      return c.json({ error: "Token exchange failed", detail: tokenData }, 400);
    }

    const accessToken = tokenData["access_token"] as string;

    const [user, allGuilds] = await Promise.all([
      fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json() as Promise<Record<string, unknown>>),
      fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json() as Promise<Array<Record<string, unknown>>>),
    ]);

    // Owner or ADMINISTRATOR (0x8) only. MANAGE_GUILD (0x20) is deliberately
    // not enough to configure the bot.
    const manageable = (Array.isArray(allGuilds) ? allGuilds : []).filter((g) => {
      if (g["owner"] === true) return true;
      const perms = Number.parseInt(String(g["permissions"] ?? "0"), 10);
      return (perms & 0x8) === 0x8;
    });

    // Which of those the bot is actually in. Best effort: a Discord blip here
    // should log the user in with an empty server list, not fail the login.
    const botGuildIds = new Set<string>();
    try {
      const botGuilds = (await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}` },
      }).then((r) => r.json())) as Array<Record<string, unknown>>;
      for (const g of botGuilds) botGuildIds.add(String(g["id"]));
    } catch {
      /* best effort */
    }

    const guilds: SessionGuild[] = manageable
      .filter((g) => botGuildIds.has(String(g["id"])))
      .map((g) => ({
        id: String(g["id"]),
        name: String(g["name"]),
        icon: iconUrl(String(g["id"]), g["icon"] as string | null),
      }));

    const session = c.get("session");
    session.data.user = {
      id: String(user["id"]),
      username: String(user["username"]),
      discriminator: String(user["discriminator"] ?? "0"),
      avatar: avatarUrl(String(user["id"]), user["avatar"] as string | null),
      accessToken,
    };
    session.data.guilds = guilds;
    await saveSession(session, c.env.SESSIONS, c.env.SESSION_SECRET);

    return c.redirect("/");
  } catch (err) {
    console.error("Discord OAuth callback error", err);
    return c.json({ error: "OAuth failed" }, 500);
  }
});

// GET /api/auth/me
auth.get("/auth/me", (c) => {
  const { data } = c.get("session");
  if (!data.user) return c.json({ user: null, guilds: [] }, 401);
  return c.json({
    user: data.user,
    guilds: data.guilds ?? [],
    isOwner: data.user.id === BOT_OWNER_ID,
  });
});

// POST /api/auth/logout
auth.post("/auth/logout", async (c) => {
  await destroySession(c.get("session"), c.env.SESSIONS);
  return c.json({ ok: true });
});

export default auth;
