import { Hono } from "hono";
import type { AppEnv } from "../env";
import { BOT_OWNER_ID } from "../env";
import { withDb } from "../lib/db";
import { botFetch, botFetchSoft, iconUrl, avatarUrl } from "../lib/discord";
import { canManageGuild, currentUser } from "../lib/guards";

const verify = new Hono<AppEnv>();

/**
 * On Workers the client address comes from CF-Connecting-IP, which Cloudflare
 * sets and a client cannot forge. The Express version read the first entry of
 * X-Forwarded-For, which any caller can write whatever it likes into — so the
 * alt check it fed was trivially bypassed by sending your own header.
 */
function clientIp(req: Request): string {
  return req.headers.get("CF-Connecting-IP") ?? "unknown";
}

async function hashIp(salt: string, ip: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ip));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── GET /api/verify/:token ──────────────────────────────────────────────────
verify.get("/verify/:token", async (c) => {
  const token = c.req.param("token");

  const result = await withDb(c.env.MONGODB_URI, async (db) => {
    const session = await db
      .collection("verificationsessions")
      .findOne<{ guildId: string; userId: string; expires: Date }>({ token });

    if (!session) {
      return {
        valid: false as const,
        reason: "Invalid or expired link. Please click Verify again in Discord.",
      };
    }
    if (new Date(session.expires) < new Date()) {
      await db.collection("verificationsessions").deleteOne({ token });
      return {
        valid: false as const,
        reason: "This link has expired. Please click Verify again in Discord.",
      };
    }

    const { guildId, userId } = session;
    const [guild, user] = await Promise.all([
      botFetchSoft<{ name: string; icon: string | null }>(
        c.env.DISCORD_BOT_TOKEN,
        `/guilds/${guildId}?with_counts=false`,
      ),
      botFetchSoft<{ username: string; avatar: string | null }>(
        c.env.DISCORD_BOT_TOKEN,
        `/users/${userId}`,
      ),
    ]);

    return {
      valid: true as const,
      guildId,
      guildName: guild?.name ?? "Unknown Server",
      guildIcon: iconUrl(guildId, guild?.icon),
      username: user?.username ?? "Unknown",
      avatar: avatarUrl(userId, user?.avatar),
    };
  });

  if (!result) return c.json({ valid: false, reason: "Database unavailable" }, 503);
  return c.json(result);
});

// ── POST /api/verify/:token ─────────────────────────────────────────────────
verify.post("/verify/:token", async (c) => {
  const token = c.req.param("token");
  const ip = clientIp(c.req.raw);

  const outcome = await withDb(c.env.MONGODB_URI, async (db) => {
    const session = await db
      .collection("verificationsessions")
      .findOne<{ guildId: string; userId: string; expires: Date }>({ token });

    if (!session) {
      return {
        status: 400 as const,
        body: { ok: false, error: "Invalid or expired link. Click Verify in Discord again." },
      };
    }
    if (new Date(session.expires) < new Date()) {
      await db.collection("verificationsessions").deleteOne({ token });
      return {
        status: 400 as const,
        body: { ok: false, error: "This link has expired. Click Verify in Discord again." },
      };
    }

    const { guildId, userId } = session;

    const config = await db
      .collection("verificationconfigs")
      .findOne<{ roleId?: string; blockAlts?: boolean }>({ guildId, enabled: true });

    if (!config?.roleId) {
      return {
        status: 400 as const,
        body: { ok: false, error: "Verification is not properly configured for this server." },
      };
    }

    const ipHash = await hashIp(c.env.IP_HASH_SALT, ip);
    const roleId = config.roleId;

    // Alt check. The owner is exempt so the flow stays testable.
    if (config.blockAlts && userId !== BOT_OWNER_ID) {
      const existing = await db
        .collection("verifiedips")
        .findOne<{ userId: string }>({ guildId, ipHash });

      if (existing && existing.userId !== userId) {
        await db.collection("altlogs").insertOne({
          guildId,
          blockedUserId: userId,
          existingUserId: existing.userId,
          ipHash,
          attemptedAt: new Date(),
        });
        return {
          status: 409 as const,
          body: {
            ok: false,
            error:
              "⚠️ This IP address has already been used to verify a different account in this server. If you believe this is a mistake, contact a server admin.",
          },
        };
      }
    }

    try {
      await botFetch(
        c.env.DISCORD_BOT_TOKEN,
        `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        { method: "PUT", headers: { "X-Audit-Log-Reason": "Syntaxx IP Verification" } },
      );
    } catch (err) {
      console.error("Failed to assign verification role", { guildId, userId, err });
      return {
        status: 500 as const,
        body: {
          ok: false,
          error: "Failed to assign your role. The bot may be missing permissions.",
        },
      };
    }

    // Upsert rather than insert, so the same user re-verifying from the same
    // IP is not treated as their own alt.
    await db
      .collection("verifiedips")
      .updateOne(
        { guildId, ipHash },
        { $set: { guildId, ipHash, userId, verifiedAt: new Date() } },
        { upsert: true },
      );
    await db.collection("verificationsessions").deleteOne({ token });

    const roles = await botFetchSoft<Array<{ id: string; name: string }>>(
      c.env.DISCORD_BOT_TOKEN,
      `/guilds/${guildId}/roles`,
    );
    const roleName = roles?.find((r) => r.id === roleId)?.name ?? "Verified";

    return { status: 200 as const, body: { ok: true, roleName } };
  });

  if (!outcome) return c.json({ ok: false, error: "Database unavailable" }, 503);
  return c.json(outcome.body, outcome.status);
});

// ── Guild-scoped verification settings ──────────────────────────────────────
//
// The Express version guarded these with a requireAuth that only checked
// "is anyone logged in". Any Discord user with an account could therefore
// PATCH any guild's verification config, or make the bot post an embed into
// a server they had nothing to do with. canManageGuild checks the guild is
// actually one of theirs.

verify.get("/guild/:id/verification", async (c) => {
  const guildId = c.req.param("id");
  if (!currentUser(c)) return c.json({ error: "Not authenticated" }, 401);
  if (!canManageGuild(c, guildId)) return c.json({ error: "Forbidden" }, 403);

  const result = await withDb(c.env.MONGODB_URI, async (db) => {
    const [config, verifiedCount] = await Promise.all([
      db
        .collection("verificationconfigs")
        .findOne<{ enabled?: boolean; blockAlts?: boolean; roleId?: string; channelId?: string }>({
          guildId,
        }),
      db.collection("verifiedips").countDocuments({ guildId }),
    ]);

    return {
      enabled: config?.enabled ?? false,
      blockAlts: config?.blockAlts ?? true,
      roleId: config?.roleId ?? null,
      channelId: config?.channelId ?? null,
      verifiedCount,
    };
  });

  if (!result) return c.json({ error: "Database unavailable" }, 503);
  return c.json(result);
});

verify.patch("/guild/:id/verification", async (c) => {
  const guildId = c.req.param("id");
  if (!currentUser(c)) return c.json({ error: "Not authenticated" }, 401);
  if (!canManageGuild(c, guildId)) return c.json({ error: "Forbidden" }, 403);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  const result = await withDb(c.env.MONGODB_URI, async (db) => {
    const patch: Record<string, unknown> = { guildId };
    if (typeof body["enabled"] === "boolean") patch["enabled"] = body["enabled"];
    if (typeof body["blockAlts"] === "boolean") patch["blockAlts"] = body["blockAlts"];
    if (body["roleId"] !== undefined) patch["roleId"] = body["roleId"] || null;
    if (body["channelId"] !== undefined) patch["channelId"] = body["channelId"] || null;

    await db
      .collection("verificationconfigs")
      .updateOne({ guildId }, { $set: patch }, { upsert: true });
    return { ok: true };
  });

  if (!result) return c.json({ error: "Database unavailable" }, 503);
  return c.json(result);
});

verify.post("/guild/:id/verification/send", async (c) => {
  const guildId = c.req.param("id");
  if (!currentUser(c)) return c.json({ error: "Not authenticated" }, 401);
  if (!canManageGuild(c, guildId)) return c.json({ error: "Forbidden" }, 403);

  const config = await withDb(c.env.MONGODB_URI, (db) =>
    db.collection("verificationconfigs").findOne<{ channelId?: string }>({ guildId }),
  );

  if (config === null) return c.json({ error: "Database unavailable" }, 503);
  if (!config?.channelId) return c.json({ error: "No verification channel configured." }, 400);

  const guild = await botFetchSoft<{ name: string }>(c.env.DISCORD_BOT_TOKEN, `/guilds/${guildId}`);

  try {
    await botFetch(c.env.DISCORD_BOT_TOKEN, `/channels/${config.channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        embeds: [
          {
            title: `Welcome to ${guild?.name ?? "this server"}!`,
            description:
              "✅ Click **Verify** below to prove you're human and gain access to the server.\n\nYou'll be redirected to our website to complete a quick verification step.",
            color: 0x2f3136,
            footer: { text: "Syntaxx Verification · Powered by syntaxx.lol" },
          },
        ],
        components: [
          {
            type: 1,
            components: [
              // custom_id must stay "verifyMember" — the bot's
              // Events/Interactions/handleVerifyButton.js matches on it.
              { type: 2, style: 1, label: "Verify", custom_id: "verifyMember", emoji: { name: "✅" } },
            ],
          },
        ],
      }),
    });
    return c.json({ ok: true });
  } catch (err) {
    console.error("Failed to send verification message", err);
    return c.json({ error: "Failed to send message. Check bot permissions in the channel." }, 500);
  }
});

export default verify;
