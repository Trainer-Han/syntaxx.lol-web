import { Hono } from "hono";
import type { AppEnv } from "../env";
import { currentUser, isOwner } from "../lib/guards";

const lore = new Hono<AppEnv>();

/** How long a book's cached server icon is trusted before re-checking. */
const ICON_REFRESH_MS = 60 * 60 * 1000;

interface BookRow {
  server_id: string;
  server_name: string;
  server_icon: string | null;
  invite_link: string | null;
  created_at: string;
  icon_checked_at: string | null;
}

async function fetchGuildIcon(token: string, serverId: string): Promise<string | null> {
  if (!token) return null;
  try {
    const resp = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { icon?: string | null };
    return data.icon
      ? `https://cdn.discordapp.com/icons/${serverId}/${data.icon}.png?size=128`
      : null;
  } catch {
    return null;
  }
}

/**
 * Re-checks a book's server icon if it has not been looked at for an hour.
 *
 * The Express version fired this off with a bare `void refreshIconIfStale(...)`
 * after sending the response, relying on the process still being alive. On
 * Workers that work is cancelled the moment the handler returns, so it has to
 * go through waitUntil — the caller passes it in.
 */
async function refreshIconIfStale(
  db: D1Database,
  token: string,
  serverId: string,
  iconCheckedAt: string | null,
): Promise<void> {
  const checked = iconCheckedAt ? new Date(iconCheckedAt).getTime() : 0;
  if (Date.now() - checked < ICON_REFRESH_MS) return;

  try {
    const icon = await fetchGuildIcon(token, serverId);
    // COALESCE keeps the existing icon if Discord gave us nothing, rather than
    // blanking a good value because of one failed lookup.
    await db
      .prepare(
        `UPDATE lore_books
            SET server_icon = COALESCE(?, server_icon),
                icon_checked_at = CURRENT_TIMESTAMP
          WHERE server_id = ?`,
      )
      .bind(icon, serverId)
      .run();
  } catch (err) {
    console.error("Failed to refresh lore book icon", { serverId, err });
  }
}

// ── GET /api/lore — every book ──────────────────────────────────────────────
lore.get("/lore", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT server_id, server_name, server_icon, invite_link, created_at, icon_checked_at
         FROM lore_books
        ORDER BY created_at ASC`,
    ).all<BookRow>();

    const books = results ?? [];

    c.executionCtx.waitUntil(
      Promise.all(
        books.map((b) =>
          refreshIconIfStale(c.env.DB, c.env.DISCORD_BOT_TOKEN, b.server_id, b.icon_checked_at),
        ),
      ).then(() => undefined),
    );

    return c.json({ books });
  } catch (err) {
    console.error("GET /api/lore error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── POST /api/lore — owner only ─────────────────────────────────────────────
lore.post("/lore", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const serverId = typeof body["serverId"] === "string" ? body["serverId"] : "";
  const serverName = typeof body["serverName"] === "string" ? body["serverName"] : "";
  if (!serverId || !serverName) {
    return c.json({ error: "serverId and serverName required" }, 400);
  }

  const inviteLink = (body["inviteLink"] as string | undefined) ?? null;
  const manualIcon = typeof body["serverIcon"] === "string" ? body["serverIcon"] : "";
  const serverIcon = manualIcon || (await fetchGuildIcon(c.env.DISCORD_BOT_TOKEN, serverId));

  try {
    const existing = await c.env.DB.prepare("SELECT server_id FROM lore_books WHERE server_id = ?")
      .bind(serverId)
      .first<{ server_id: string }>();
    // Postgres signalled the duplicate with SQLSTATE 23505; SQLite's error
    // codes are different enough that checking up front is clearer than
    // pattern-matching the driver's message.
    if (existing) return c.json({ error: "A book for that server already exists" }, 409);

    await c.env.DB.prepare(
      "INSERT INTO lore_books (server_id, server_name, server_icon, invite_link) VALUES (?, ?, ?, ?)",
    )
      .bind(serverId, serverName, serverIcon, inviteLink)
      .run();

    return c.json({ serverId, serverName, serverIcon, inviteLink }, 201);
  } catch (err) {
    console.error("POST /api/lore error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── GET /api/lore/:serverId — one book with its chapters ────────────────────
lore.get("/lore/:serverId", async (c) => {
  const serverId = c.req.param("serverId");
  const userId = currentUser(c)?.id ?? null;

  try {
    const book = await c.env.DB.prepare(
      `SELECT server_id, server_name, server_icon, invite_link, created_at, icon_checked_at
         FROM lore_books WHERE server_id = ?`,
    )
      .bind(serverId)
      .first<BookRow>();

    if (!book) return c.json({ error: "Book not found" }, 404);

    c.executionCtx.waitUntil(
      refreshIconIfStale(c.env.DB, c.env.DISCORD_BOT_TOKEN, serverId, book.icon_checked_at),
    );

    // BOOL_OR is Postgres. SQLite has no boolean aggregate, but MAX over a
    // 0/1 comparison is the same thing: 1 if any row matched.
    const { results } = await c.env.DB.prepare(
      `SELECT c.id, c.discord_id, c.display_name, c.content, c.chapter_order, c.created_at,
              COUNT(l.user_id) AS like_count,
              MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS user_liked
         FROM lore_chapters c
         LEFT JOIN lore_chapter_likes l ON l.chapter_id = c.id
        WHERE c.server_id = ?
        GROUP BY c.id
        ORDER BY c.chapter_order ASC, c.created_at ASC`,
    )
      .bind(userId, serverId)
      .all<{ user_liked: number }>();

    return c.json({
      book,
      chapters: (results ?? []).map((ch) => ({ ...ch, user_liked: ch.user_liked === 1 })),
    });
  } catch (err) {
    console.error("GET /api/lore/:serverId error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── POST /api/lore/chapter/:id/like — toggle, auth required ─────────────────
lore.post("/lore/chapter/:id/like", async (c) => {
  const user = currentUser(c);
  if (!user) return c.json({ error: "Login required" }, 401);

  const chapterId = c.req.param("id");

  try {
    const existing = await c.env.DB.prepare(
      "SELECT 1 AS one FROM lore_chapter_likes WHERE chapter_id = ? AND user_id = ?",
    )
      .bind(chapterId, user.id)
      .first<{ one: number }>();

    const liked = !existing;
    await c.env.DB.prepare(
      liked
        ? "INSERT INTO lore_chapter_likes (chapter_id, user_id) VALUES (?, ?)"
        : "DELETE FROM lore_chapter_likes WHERE chapter_id = ? AND user_id = ?",
    )
      .bind(chapterId, user.id)
      .run();

    const count = await c.env.DB.prepare(
      "SELECT COUNT(*) AS like_count FROM lore_chapter_likes WHERE chapter_id = ?",
    )
      .bind(chapterId)
      .first<{ like_count: number }>();

    return c.json({ liked, like_count: count?.like_count ?? 0 });
  } catch (err) {
    console.error("POST lore like error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── POST /api/lore/:serverId/chapter — owner only ───────────────────────────
lore.post("/lore/:serverId/chapter", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);

  const serverId = c.req.param("serverId");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const displayName = typeof body["displayName"] === "string" ? body["displayName"] : "";
  const content = typeof body["content"] === "string" ? body["content"] : "";

  if (!displayName || !content) {
    return c.json({ error: "displayName and content required" }, 400);
  }

  try {
    const book = await c.env.DB.prepare("SELECT server_id FROM lore_books WHERE server_id = ?")
      .bind(serverId)
      .first<{ server_id: string }>();
    if (!book) return c.json({ error: "Book not found" }, 404);

    const id = crypto.randomUUID();
    const discordId = (body["discordId"] as string | undefined) ?? null;
    const chapterOrder = typeof body["chapterOrder"] === "number" ? body["chapterOrder"] : 99;

    await c.env.DB.prepare(
      `INSERT INTO lore_chapters (id, server_id, discord_id, display_name, content, chapter_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, serverId, discordId, displayName, content, chapterOrder)
      .run();

    return c.json({ id, serverId, discordId, displayName, content, chapterOrder }, 201);
  } catch (err) {
    console.error("POST /api/lore/:serverId/chapter error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── PATCH /api/lore/:serverId/chapter/:id — owner only ──────────────────────
lore.patch("/lore/:serverId/chapter/:id", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body["discordId"] !== undefined) {
    updates.push("discord_id = ?");
    values.push(body["discordId"]);
  }
  if (body["displayName"]) {
    updates.push("display_name = ?");
    values.push(body["displayName"]);
  }
  if (body["content"]) {
    updates.push("content = ?");
    values.push(body["content"]);
  }
  if (body["chapterOrder"] !== undefined) {
    updates.push("chapter_order = ?");
    values.push(body["chapterOrder"]);
  }

  if (updates.length === 0) return c.json({ error: "Nothing to update" }, 400);
  values.push(c.req.param("id"));

  try {
    await c.env.DB.prepare(`UPDATE lore_chapters SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
    return c.json({ ok: true });
  } catch (err) {
    console.error("PATCH lore chapter error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── DELETE /api/lore/:serverId/chapter/:id — owner only ─────────────────────
lore.delete("/lore/:serverId/chapter/:id", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);
  try {
    await c.env.DB.prepare("DELETE FROM lore_chapters WHERE id = ?")
      .bind(c.req.param("id"))
      .run();
    return c.json({ ok: true });
  } catch (err) {
    console.error("DELETE lore chapter error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

export default lore;
