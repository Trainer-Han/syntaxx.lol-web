/**
 * Sessions, replacing express-session.
 *
 * express-session's default MemoryStore cannot survive on an edge runtime:
 * there is no single long-lived process to hold it. A cookie-only session is
 * no good either — the Discord guild list routinely exceeds the 4KB cookie
 * limit — so the cookie carries a signed random id and KV holds the payload.
 *
 * The signature is HMAC-SHA256 over the id, keyed with SESSION_SECRET. It is
 * not there to hide the id (KV lookup already gates that) but to keep the
 * Worker from doing a KV read for every forged cookie thrown at it.
 */

const COOKIE = "sxs";
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days, matching the old maxAge

export interface SessionUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  accessToken: string;
}

export interface SessionGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface SessionData {
  user?: SessionUser;
  guilds?: SessionGuild[];
}

/**
 * A session as seen by a request handler. Mutating `data` is not enough —
 * call `save()`, which is what actually writes KV and sets the cookie.
 */
export interface Session {
  id: string;
  data: SessionData;
  /** Set when the response needs a Set-Cookie header. */
  cookie: string | null;
}

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(id: string, secret: string): Promise<string> {
  return toHex(await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(id)));
}

/**
 * Constant-time string compare. `===` returns at the first differing byte,
 * which leaks the length of the correct prefix to anyone timing responses.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

function buildCookie(value: string, maxAge: number): string {
  // SameSite=Lax rather than Strict: the Discord OAuth callback is a
  // cross-site top-level GET, and Strict would drop the cookie on it.
  return [
    `${COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

/** Loads the session named by the request's cookie, or starts an empty one. */
export async function loadSession(
  request: Request,
  kv: KVNamespace,
  secret: string,
): Promise<Session> {
  const raw = readCookie(request.headers.get("Cookie") ?? undefined, COOKIE);

  if (raw) {
    const dot = raw.lastIndexOf(".");
    if (dot > 0) {
      const id = raw.slice(0, dot);
      const mac = raw.slice(dot + 1);
      if (timingSafeEqual(mac, await sign(id, secret))) {
        const stored = await kv.get<SessionData>(`sess:${id}`, "json");
        if (stored) return { id, data: stored, cookie: null };
      }
    }
  }

  return { id: crypto.randomUUID(), data: {}, cookie: null };
}

/** Persists the session and arranges for the cookie to be (re)issued. */
export async function saveSession(
  session: Session,
  kv: KVNamespace,
  secret: string,
): Promise<void> {
  await kv.put(`sess:${session.id}`, JSON.stringify(session.data), {
    expirationTtl: TTL_SECONDS,
  });
  session.cookie = buildCookie(`${session.id}.${await sign(session.id, secret)}`, TTL_SECONDS);
}

/** Drops the session and expires the cookie. */
export async function destroySession(session: Session, kv: KVNamespace): Promise<void> {
  await kv.delete(`sess:${session.id}`);
  session.data = {};
  session.cookie = buildCookie("", 0);
}
