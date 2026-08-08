/**
 * Thin helpers over the Discord REST API.
 *
 * The site talks to Discord directly with the bot token rather than through
 * the bot process — there is no HTTP channel to the bot, and the two share
 * state through MongoDB instead.
 */
const API = "https://discord.com/api";
const API_V10 = "https://discord.com/api/v10";

export class DiscordError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DiscordError";
  }
}

/** Authenticated as the bot. */
export async function botFetch<T = unknown>(
  token: string,
  path: string,
  init: RequestInit = {},
  { v10 = false }: { v10?: boolean } = {},
): Promise<T> {
  const res = await fetch(`${v10 ? API_V10 : API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    throw new DiscordError(res.status, `Discord ${res.status} on ${path}`);
  }
  return (await res.json()) as T;
}

/** Same, but returns null on any non-2xx instead of throwing. */
export async function botFetchSoft<T = unknown>(
  token: string,
  path: string,
  init?: RequestInit,
  opts?: { v10?: boolean },
): Promise<T | null> {
  try {
    return await botFetch<T>(token, path, init, opts);
  } catch {
    return null;
  }
}

/** Authenticated as the logged-in user, with their OAuth access token. */
export async function userFetch<T = unknown>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new DiscordError(res.status, `Discord ${res.status} on ${path}`);
  return (await res.json()) as T;
}

export function iconUrl(guildId: string, icon: string | null | undefined): string | null {
  return icon ? `https://cdn.discordapp.com/icons/${guildId}/${icon}.png` : null;
}

export function avatarUrl(userId: string, avatar: string | null | undefined): string | null {
  return avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : null;
}
