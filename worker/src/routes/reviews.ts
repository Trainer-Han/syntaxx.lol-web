import { Hono } from "hono";
import type { AppEnv } from "../env";
import { currentUser, isOwner } from "../lib/guards";

const reviews = new Hono<AppEnv>();

interface ReviewRow {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  liked_by_me: number;
}

/**
 * `::int` and `EXISTS(...)` are Postgres spellings. SQLite returns a plain
 * integer from COUNT and 0/1 from EXISTS, so the cast goes away and the
 * boolean is converted after the fact, in `shape`.
 */
const REVIEW_SELECT = `
  SELECT r.id, r.discord_id, r.discord_username, r.discord_avatar, r.rating, r.content,
         r.created_at, r.updated_at,
         (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) AS like_count,
         EXISTS(SELECT 1 FROM review_likes WHERE review_id = r.id AND user_id = ?) AS liked_by_me
    FROM reviews r
`;

function shape(rows: ReviewRow[] | undefined) {
  return (rows ?? []).map((r) => ({ ...r, liked_by_me: r.liked_by_me === 1 }));
}

// ── GET /api/reviews — public ───────────────────────────────────────────────
reviews.get("/reviews", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`${REVIEW_SELECT} ORDER BY r.created_at DESC`)
      .bind(currentUser(c)?.id ?? null)
      .all<ReviewRow>();
    return c.json({ reviews: shape(results) });
  } catch (err) {
    console.error("GET /api/reviews error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── GET /api/reviews/top — public, shown on the home page ───────────────────
reviews.get("/reviews/top", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `${REVIEW_SELECT}
        WHERE r.rating >= 4
        ORDER BY like_count DESC, r.created_at DESC
        LIMIT 6`,
    )
      .bind(currentUser(c)?.id ?? null)
      .all<ReviewRow>();
    return c.json({ reviews: shape(results) });
  } catch (err) {
    console.error("GET /api/reviews/top error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── POST /api/reviews — one per user, auth required ─────────────────────────
reviews.post("/reviews", async (c) => {
  const user = currentUser(c);
  if (!user) return c.json({ error: "Not authenticated" }, 401);

  const body = (await c.req.json().catch(() => ({}))) as { rating?: number; content?: string };
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return c.json({ error: "rating must be an integer between 1 and 5" }, 400);
  }

  const content = body.content?.trim() ?? "";
  if (!content) return c.json({ error: "content is required" }, 400);
  if (content.length > 1000) {
    return c.json({ error: "content must be 1000 characters or fewer" }, 400);
  }

  try {
    const existing = await c.env.DB.prepare("SELECT id FROM reviews WHERE discord_id = ?")
      .bind(user.id)
      .first<{ id: string }>();
    if (existing) return c.json({ error: "You have already left a review" }, 409);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO reviews (id, discord_id, discord_username, discord_avatar, rating, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, user.id, user.username, user.avatar, rating, content)
      .run();
    return c.json({ id }, 201);
  } catch (err) {
    console.error("POST /api/reviews error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── PUT /api/reviews/:id — owner only ───────────────────────────────────────
reviews.put("/reviews/:id", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);

  const body = (await c.req.json().catch(() => ({}))) as { rating?: number; content?: string };
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return c.json({ error: "rating must be an integer between 1 and 5" }, 400);
    }
    updates.push("rating = ?");
    values.push(rating);
  }
  if (body.content !== undefined) {
    const content = body.content.trim();
    if (!content) return c.json({ error: "content cannot be empty" }, 400);
    updates.push("content = ?");
    values.push(content);
  }
  if (updates.length === 0) return c.json({ error: "Nothing to update" }, 400);

  // NOW() is Postgres; SQLite's equivalent is CURRENT_TIMESTAMP.
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(c.req.param("id"));

  try {
    const row = await c.env.DB.prepare(
      `UPDATE reviews SET ${updates.join(", ")} WHERE id = ? RETURNING id`,
    )
      .bind(...values)
      .first<{ id: string }>();
    if (!row) return c.json({ error: "Review not found" }, 404);
    return c.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/reviews/:id error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── DELETE /api/reviews/:id — owner only ────────────────────────────────────
reviews.delete("/reviews/:id", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);
  try {
    await c.env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(c.req.param("id")).run();
    return c.body(null, 204);
  } catch (err) {
    console.error("DELETE /api/reviews/:id error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ── POST /api/reviews/:id/like — toggle, auth required ──────────────────────
reviews.post("/reviews/:id/like", async (c) => {
  const user = currentUser(c);
  if (!user) return c.json({ error: "Not authenticated" }, 401);

  const reviewId = c.req.param("id");

  try {
    const exists = await c.env.DB.prepare("SELECT id FROM reviews WHERE id = ?")
      .bind(reviewId)
      .first<{ id: string }>();
    if (!exists) return c.json({ error: "Review not found" }, 404);

    const existingLike = await c.env.DB.prepare(
      "SELECT 1 AS one FROM review_likes WHERE review_id = ? AND user_id = ?",
    )
      .bind(reviewId, user.id)
      .first<{ one: number }>();

    const liked = !existingLike;
    await c.env.DB.prepare(
      liked
        ? "INSERT INTO review_likes (review_id, user_id) VALUES (?, ?)"
        : "DELETE FROM review_likes WHERE review_id = ? AND user_id = ?",
    )
      .bind(reviewId, user.id)
      .run();

    const count = await c.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM review_likes WHERE review_id = ?",
    )
      .bind(reviewId)
      .first<{ count: number }>();

    return c.json({ liked, likeCount: count?.count ?? 0 });
  } catch (err) {
    console.error("POST /api/reviews/:id/like error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

export default reviews;
