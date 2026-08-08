import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../env";
import { withDb } from "../lib/db";
import { botFetch, botFetchSoft, iconUrl } from "../lib/discord";
import { canManageGuild, currentUser, isOwner, secretEquals } from "../lib/guards";

const guild = new Hono<AppEnv>();

const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const ADMINISTRATOR = 1n << 3n;

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  permissions: string;
}
interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  permission_overwrites?: Array<{ id: string; type: number; allow: string; deny: string }>;
}

/**
 * Whether the bot can both see and talk in a channel.
 *
 * Discord does not expose this; it has to be recomputed from the permission
 * stack in order: @everyone base, the bot's roles, ADMINISTRATOR short-circuit,
 * the @everyone channel overwrite, role overwrites, then the member overwrite.
 * The @everyone role's id is the guild id.
 */
function computeChannelAccess(
  channel: DiscordChannel,
  everyoneId: string,
  roles: DiscordRole[],
  botRoleIds: string[],
  botUserId: string,
): boolean {
  const overwrites = channel.permission_overwrites ?? [];

  let perms = BigInt(roles.find((r) => r.id === everyoneId)?.permissions ?? 0);
  for (const role of roles) {
    if (botRoleIds.includes(role.id)) perms |= BigInt(role.permissions);
  }

  if (perms & ADMINISTRATOR) return true;

  const everyoneOverwrite = overwrites.find((ow) => ow.id === everyoneId && ow.type === 0);
  if (everyoneOverwrite) {
    perms &= ~BigInt(everyoneOverwrite.deny);
    perms |= BigInt(everyoneOverwrite.allow);
  }

  let roleAllow = 0n;
  let roleDeny = 0n;
  for (const ow of overwrites) {
    if (ow.type === 0 && botRoleIds.includes(ow.id)) {
      roleDeny |= BigInt(ow.deny);
      roleAllow |= BigInt(ow.allow);
    }
  }
  perms &= ~roleDeny;
  perms |= roleAllow;

  const memberOverwrite = overwrites.find((ow) => ow.id === botUserId && ow.type === 1);
  if (memberOverwrite) {
    perms &= ~BigInt(memberOverwrite.deny);
    perms |= BigInt(memberOverwrite.allow);
  }

  return Boolean(perms & VIEW_CHANNEL) && Boolean(perms & SEND_MESSAGES);
}

async function fetchChannelsWithPerms(
  token: string,
  botUserId: string,
  guildId: string,
): Promise<Array<{ id: string; name: string; botCanAccess: boolean }>> {
  const [channels, roles, member] = await Promise.all([
    botFetch<DiscordChannel[]>(token, `/guilds/${guildId}/channels`),
    botFetch<DiscordRole[]>(token, `/guilds/${guildId}/roles`),
    botFetch<{ roles: string[] }>(token, `/guilds/${guildId}/members/${botUserId}`),
  ]);

  const botRoleIds = Array.isArray(member.roles) ? member.roles : [];

  return channels
    .filter((ch) => ch.type === 0 || ch.type === 5) // text and announcement
    .map((ch) => ({
      id: ch.id,
      name: String(ch.name),
      botCanAccess: computeChannelAccess(ch, guildId, roles, botRoleIds, botUserId),
    }))
    .sort((a, b) => {
      if (a.botCanAccess !== b.botCanAccess) return a.botCanAccess ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Guard for every guild-scoped route. Returns a Response to send back, or null
 * to continue. The Express version applied requireAuth and hasGuildAccess as
 * two separate steps repeated in each handler; collapsing them removes the
 * chance of adding a route and remembering only one.
 */
function denyGuildAccess(c: Context<AppEnv>, guildId: string): Response | null {
  if (!currentUser(c)) return c.json({ error: "Not authenticated" }, 401);
  if (!canManageGuild(c, guildId)) return c.json({ error: "Not authorized for this guild" }, 403);
  return null;
}

/** Everything is free — every guild has Pro. Kept as a seam, not a check. */
function guildHasPro(): boolean {
  return true;
}

async function sendDm(token: string, userId: string, content: string): Promise<void> {
  try {
    const dm = await botFetch<{ id: string }>(token, "/users/@me/channels", {
      method: "POST",
      body: JSON.stringify({ recipient_id: userId }),
    });
    await botFetch(token, `/channels/${dm.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.error("Failed to send DM", err);
  }
}

function utc(when?: string): string {
  return new Date(when ?? Date.now()).toUTCString().replace(" GMT", " UTC");
}

function friendlyLabel(key: string): string {
  const map: Record<string, string> = {
    modLogChannel: "Mod Log Channel",
    modlog: "Mod Log Channel",
    memberLogChannel: "Member Log",
    memberlog: "Member Log",
    messageLogChannel: "Message Log",
    messagelog: "Message Log",
    autoMod: "Auto-Mod",
    automod: "Auto-Mod",
  };
  return map[key] ?? "Settings";
}

interface Meta {
  serverName?: string;
  label?: string;
  valueLabel?: string;
  changedAt?: string;
}

// ── Guild info ──────────────────────────────────────────────────────────────

guild.get("/guild/:id", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const token = c.env.DISCORD_BOT_TOKEN;
  const [member, info] = await Promise.all([
    botFetchSoft<{ nick: string | null }>(token, `/guilds/${id}/members/${c.env.DISCORD_CLIENT_ID}`),
    botFetchSoft<{ name: string; icon: string | null }>(token, `/guilds/${id}`),
  ]);

  if (!info) return c.json({ error: "Failed to fetch guild" }, 500);

  return c.json({
    id,
    name: info.name,
    icon: iconUrl(id, info.icon),
    nickname: member?.nick ?? null,
  });
});

guild.get("/guild/:id/channels", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  try {
    return c.json(await fetchChannelsWithPerms(c.env.DISCORD_BOT_TOKEN, c.env.DISCORD_CLIENT_ID, id));
  } catch (err) {
    console.error("Failed to fetch channels", err);
    return c.json({ error: "Failed to fetch channels" }, 500);
  }
});

guild.get("/guild/:id/roles", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  try {
    const roles = await botFetch<DiscordRole[]>(c.env.DISCORD_BOT_TOKEN, `/guilds/${id}/roles`);
    return c.json(
      roles
        .filter((r) => r.name !== "@everyone")
        .map((r) => ({ id: r.id, name: r.name, color: r.color }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  } catch (err) {
    console.error("Failed to fetch roles", err);
    return c.json({ error: "Failed to fetch roles" }, 500);
  }
});

// ── Cross-server log targets ────────────────────────────────────────────────
//
// SECURITY CHANGE FROM THE ORIGINAL. Both of these were behind requireAuth
// only, with no per-guild check: any logged-in Discord user could list every
// server the bot is in, and enumerate the channels of any of them. Worse, the
// dashboard uses these to choose where logs are delivered, so that also meant
// anyone could aim another server's channel list.
//
// They are now restricted to the guilds the caller actually administers. If
// you genuinely want cross-posting into servers you do not manage, this is
// the guard to relax — deliberately, not by accident.

guild.get("/bot/guilds", (c) => {
  if (!currentUser(c)) return c.json({ error: "Not authenticated" }, 401);
  const guilds = c.get("session").data.guilds ?? [];
  return c.json([...guilds].sort((a, b) => a.name.localeCompare(b.name)));
});

guild.get("/bot/guild/:guildId/channels", async (c) => {
  const guildId = c.req.param("guildId");
  const denied = denyGuildAccess(c, guildId);
  if (denied) return denied;

  try {
    return c.json(
      await fetchChannelsWithPerms(c.env.DISCORD_BOT_TOKEN, c.env.DISCORD_CLIENT_ID, guildId),
    );
  } catch (err) {
    console.error("Failed to fetch external guild channels", err);
    return c.json({ error: "Failed to fetch channels" }, 500);
  }
});

// ── Dashboard settings ──────────────────────────────────────────────────────

guild.get("/guild/:id/settings", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const doc = await withDb(c.env.MONGODB_URI, (db) =>
    db.collection("guildSettings").findOne({ guildId: id }),
  );
  return c.json(doc ?? {});
});

guild.patch("/guild/:id/settings", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const meta = body["_meta"] as Meta | undefined;
  const user = currentUser(c);
  const token = c.env.DISCORD_BOT_TOKEN;

  const allowed = ["modLogChannel", "memberLogChannel", "messageLogChannel", "autoMod"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];

  const saved = await withDb(c.env.MONGODB_URI, async (db) => {
    await db
      .collection("guildSettings")
      .updateOne(
        { guildId: id },
        { $set: { guildId: id, ...update, updatedAt: new Date() } },
        { upsert: true },
      );

    // Bridge into the bot's own Mongoose collections, or the bot's listeners
    // never see the change. modlogs/messagelogs key on { guildId, channelId }.
    for (const [collection, field] of [
      ["modlogs", "modLogChannel"],
      ["messagelogs", "messageLogChannel"],
    ] as const) {
      if (!(field in update)) continue;
      const channelId = update[field] as string | undefined;
      if (channelId) {
        await db
          .collection(collection)
          .updateOne(
            { guildId: id },
            { $set: { guildId: id, channelId, updatedAt: new Date() } },
            { upsert: true },
          );
      } else {
        await db.collection(collection).deleteOne({ guildId: id });
      }
    }

    // MemberLog's schema differs: capital `Guild`, and `logChannel`.
    if ("memberLogChannel" in update) {
      const logChannel = update["memberLogChannel"] as string | undefined;
      if (logChannel) {
        await db
          .collection("memberlogs")
          .updateOne(
            { Guild: id },
            { $set: { Guild: id, logChannel, updatedAt: new Date() } },
            { upsert: true },
          );
      } else {
        await db.collection("memberlogs").deleteOne({ Guild: id });
      }
    }

    return true;
  });

  if (!saved) {
    if (user) {
      c.executionCtx.waitUntil(
        sendDm(
          token,
          user.id,
          `❌ **Failed to save settings**\n🏠 **Server:** ${meta?.serverName ?? id}\nPlease try again from the dashboard.`,
        ),
      );
    }
    return c.json({ error: "Failed to save settings" }, 500);
  }

  if (user) {
    const settingName = friendlyLabel(meta?.label ?? Object.keys(update)[0] ?? "");
    // The Express version awaited the DM after res.json(), which only worked
    // because the process outlived the response. A Worker is torn down at
    // return, so the send has to be handed to waitUntil.
    c.executionCtx.waitUntil(
      sendDm(
        token,
        user.id,
        `✅ **${settingName} updated**\n🏠 **Server:** ${meta?.serverName ?? `Server ${id}`}\n📌 **New value:** ${meta?.valueLabel ?? "updated"}\n🕐 **Changed at:** ${utc(meta?.changedAt)}`,
      ),
    );
  }

  return c.json({ ok: true });
});

// ── Automod ─────────────────────────────────────────────────────────────────

guild.get("/guild/:id/automod", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const doc = await withDb(c.env.MONGODB_URI, (db) =>
    db.collection("automodsettings").findOne({ guildId: id }),
  );
  if (doc === null) return c.json({ error: "Database unavailable" }, 503);

  return c.json(
    doc ?? {
      enabled: false,
      dmEnabled: false,
      customWords: [],
      exceptChannels: [],
      exceptRoles: [],
      exceptUsers: [],
    },
  );
});

guild.patch("/guild/:id/automod", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = [
    "enabled",
    "dmEnabled",
    "customWords",
    "exceptChannels",
    "exceptRoles",
    "exceptUsers",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];

  const ok = await withDb(c.env.MONGODB_URI, async (db) => {
    await db
      .collection("automodsettings")
      .updateOne(
        { guildId: id },
        { $set: { guildId: id, ...update, updatedAt: new Date() } },
        { upsert: true },
      );
    return true;
  });

  return ok ? c.json({ ok: true }) : c.json({ error: "Failed to save automod" }, 500);
});

// ── Fun command toggles ─────────────────────────────────────────────────────

guild.get("/guild/:id/fun", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const result = await withDb(c.env.MONGODB_URI, async (db) => {
    const [car, cat] = await Promise.all([
      db.collection("carcommandsettings").findOne<{ enabled?: boolean }>({ guildId: id }),
      db.collection("catcommandsettings").findOne<{ enabled?: boolean }>({ guildId: id }),
    ]);
    return { car: { enabled: car?.enabled ?? true }, cat: { enabled: cat?.enabled ?? true } };
  });

  return result ? c.json(result) : c.json({ error: "Database unavailable" }, 503);
});

for (const kind of ["car", "cat"] as const) {
  guild.patch(`/guild/:id/fun/${kind}`, async (c) => {
    const id = c.req.param("id");
    const denied = denyGuildAccess(c, id);
    if (denied) return denied;

    const { enabled } = (await c.req.json().catch(() => ({}))) as { enabled?: boolean };
    const ok = await withDb(c.env.MONGODB_URI, async (db) => {
      await db
        .collection(`${kind}commandsettings`)
        .updateOne({ guildId: id }, { $set: { guildId: id, enabled: Boolean(enabled) } }, { upsert: true });
      return true;
    });

    return ok ? c.json({ ok: true }) : c.json({ error: "Failed" }, 500);
  });
}

// ── Pro ─────────────────────────────────────────────────────────────────────

guild.get("/guild/:id/pro", (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;
  return c.json({ active: isOwner(c) || guildHasPro() });
});

// ── Per-guild custom commands (distinct from the site-wide listing) ─────────

guild.get("/guild/:id/custom-commands", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;
  if (!isOwner(c) && !guildHasPro()) return c.json({ error: "Pro subscription required" }, 402);

  const doc = await withDb(c.env.MONGODB_URI, (db) =>
    db.collection("customcommands").findOne<{ commands?: unknown[] }>({ guildId: id }),
  );
  if (doc === null) return c.json({ error: "Database unavailable" }, 503);
  return c.json({ commands: doc?.commands ?? [] });
});

guild.patch("/guild/:id/custom-commands", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;
  if (!isOwner(c) && !guildHasPro()) return c.json({ error: "Pro subscription required" }, 402);

  const { commands } = (await c.req.json().catch(() => ({}))) as { commands?: unknown };
  if (!Array.isArray(commands)) return c.json({ error: "commands must be an array" }, 400);

  const ok = await withDb(c.env.MONGODB_URI, async (db) => {
    await db
      .collection("customcommands")
      .updateOne({ guildId: id }, { $set: { guildId: id, commands } }, { upsert: true });
    return true;
  });

  return ok ? c.json({ ok: true }) : c.json({ error: "Failed" }, 500);
});

// ── Member log setup ────────────────────────────────────────────────────────

guild.get("/guild/:id/memberlog-setup", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const doc = await withDb(c.env.MONGODB_URI, (db) =>
    db
      .collection("memberlogs")
      .findOne<{ logChannel?: string; memberRole?: string; botRole?: string }>({ Guild: id }),
  );
  if (doc === null) return c.json({ error: "Database unavailable" }, 503);

  return c.json({
    logChannel: doc?.logChannel ?? null,
    memberRole: doc?.memberRole ?? null,
    botRole: doc?.botRole ?? null,
  });
});

guild.patch("/guild/:id/memberlog-setup", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const body = (await c.req.json().catch(() => ({}))) as {
    logChannel?: string | null;
    memberRole?: string | null;
    botRole?: string | null;
  };

  const ok = await withDb(c.env.MONGODB_URI, async (db) => {
    await db.collection("memberlogs").updateOne(
      { Guild: id },
      {
        $set: {
          Guild: id,
          logChannel: body.logChannel ?? null,
          memberRole: body.memberRole ?? null,
          botRole: body.botRole ?? null,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return true;
  });

  return ok ? c.json({ ok: true }) : c.json({ error: "Failed" }, 500);
});

// ── Levels ──────────────────────────────────────────────────────────────────

guild.get("/guild/:id/level-channel", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const doc = await withDb(c.env.MONGODB_URI, (db) =>
    db.collection("levelchannels").findOne<{ channelId?: string }>({ guildId: id }),
  );
  if (doc === null) return c.json({ error: "Database unavailable" }, 503);
  return c.json({ channelId: doc?.channelId ?? null });
});

guild.patch("/guild/:id/level-channel", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const { channelId } = (await c.req.json().catch(() => ({}))) as { channelId?: string | null };

  const ok = await withDb(c.env.MONGODB_URI, async (db) => {
    if (channelId) {
      await db
        .collection("levelchannels")
        .updateOne(
          { guildId: id },
          { $set: { guildId: id, channelId, updatedAt: new Date() } },
          { upsert: true },
        );
    } else {
      await db.collection("levelchannels").deleteOne({ guildId: id });
    }
    return true;
  });

  return ok ? c.json({ ok: true }) : c.json({ error: "Failed" }, 500);
});

guild.get("/guild/:id/levels", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const doc = await withDb(c.env.MONGODB_URI, (db) =>
    db.collection("leveltoggles").findOne<{ enabled?: boolean }>({ guildId: id }),
  );
  if (doc === null) return c.json({ error: "Database unavailable" }, 503);
  return c.json({ enabled: doc?.enabled ?? true });
});

guild.patch("/guild/:id/levels", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const { enabled } = (await c.req.json().catch(() => ({}))) as { enabled?: boolean };

  const ok = await withDb(c.env.MONGODB_URI, async (db) => {
    await db
      .collection("leveltoggles")
      .updateOne(
        { guildId: id },
        { $set: { guildId: id, enabled: Boolean(enabled), updatedAt: new Date() } },
        { upsert: true },
      );
    return true;
  });

  return ok ? c.json({ ok: true }) : c.json({ error: "Failed" }, 500);
});

// ── Bot nickname ────────────────────────────────────────────────────────────

guild.patch("/guild/:id/nickname", async (c) => {
  const id = c.req.param("id");
  const denied = denyGuildAccess(c, id);
  if (denied) return denied;

  const body = (await c.req.json().catch(() => ({}))) as { nickname?: string; _meta?: Meta };
  const nickname = body.nickname;
  if (typeof nickname !== "string" || nickname.length > 32) {
    return c.json({ error: "Invalid nickname" }, 400);
  }

  const user = currentUser(c);
  const token = c.env.DISCORD_BOT_TOKEN;

  try {
    await botFetch(token, `/guilds/${id}/members/@me`, {
      method: "PATCH",
      body: JSON.stringify({ nick: nickname || null }),
    });
  } catch (err) {
    if (user) {
      c.executionCtx.waitUntil(
        sendDm(
          token,
          user.id,
          `❌ **Failed to update bot nickname**\n🏠 **Server:** ${body._meta?.serverName ?? id}\nPlease try again from the dashboard.`,
        ),
      );
    }
    console.error("Failed to update nickname", err);
    return c.json({ error: "Failed to update nickname" }, 500);
  }

  if (user) {
    c.executionCtx.waitUntil(
      sendDm(
        token,
        user.id,
        `✅ **Bot Nickname updated**\n🏠 **Server:** ${body._meta?.serverName ?? `Server ${id}`}\n📌 **New value:** ${nickname || "Syntaxx (default)"}\n🕐 **Changed at:** ${utc(body._meta?.changedAt)}`,
      ),
    );
  }

  return c.json({ ok: true, nickname: nickname || null });
});

// ── Bot-only internal endpoint ──────────────────────────────────────────────

guild.get("/internal/guild/:id/settings", async (c) => {
  const authorization = c.req.header("authorization") ?? "";
  if (!secretEquals(authorization, `Bot ${c.env.DISCORD_BOT_TOKEN}`)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const doc = await withDb(c.env.MONGODB_URI, (db) =>
    db.collection("guildSettings").findOne({ guildId: c.req.param("id") }),
  );
  return c.json(doc ?? {});
});

export default guild;
