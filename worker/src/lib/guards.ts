import type { Context } from "hono";
import type { AppEnv } from "../env";
import { BOT_OWNER_ID } from "../env";
import type { SessionUser } from "./session";

/** The logged-in user, or undefined. */
export function currentUser(c: Context<AppEnv>): SessionUser | undefined {
  return c.get("session").data.user;
}

export function isOwner(c: Context<AppEnv>): boolean {
  return currentUser(c)?.id === BOT_OWNER_ID;
}

/**
 * Whether the user may configure this guild.
 *
 * The check is against the guild list captured at login — the set already
 * filtered to owner-or-ADMINISTRATOR guilds the bot is in — rather than
 * re-asking Discord on every request. A user who loses admin mid-session
 * keeps access until the session expires, which matches the old behaviour.
 */
export function canManageGuild(c: Context<AppEnv>, guildId: string): boolean {
  if (isOwner(c)) return true; // the developer can reach any guild, as before
  const { guilds } = c.get("session").data;
  return Boolean(guilds?.some((g) => g.id === guildId));
}

/**
 * Constant-time compare for the bot's shared-secret header. `===` would leak
 * the length of the matching prefix through response timing.
 */
export function secretEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
