import { Hono } from "hono";
import type { AppEnv } from "../env";
import { isOwner } from "../lib/guards";

const supporters = new Hono<AppEnv>();

interface SupporterRow {
  id: string;
  name: string;
  amount: number;
  currency: string;
  coffees: number;
}

// GET /api/supporters — public, shown on the home page
supporters.get("/supporters", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, name, amount, currency, coffees
         FROM supporters
        ORDER BY amount DESC
        LIMIT 5`,
    ).all<SupporterRow>();
    return c.json({ supporters: results ?? [] });
  } catch (err) {
    console.error("Failed to fetch supporters", err);
    // The home page renders around an empty list; a 500 with a body it can
    // still read is better than breaking the section.
    return c.json({ supporters: [] }, 500);
  }
});

// POST /api/supporters — owner only
supporters.post("/supporters", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body["name"] === "string" ? body["name"].trim() : "";
  if (!name) return c.json({ error: "Name required" }, 400);

  const amount = Number.parseFloat(String(body["amount"]));
  if (Number.isNaN(amount) || amount < 0) return c.json({ error: "Invalid amount" }, 400);

  const currency = String(body["currency"] ?? "EUR");
  const coffees = Number(body["coffees"] ?? 1);

  try {
    const id = crypto.randomUUID();
    const supporter = await c.env.DB.prepare(
      `INSERT INTO supporters (id, name, amount, currency, coffees)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, name, amount, currency, coffees`,
    )
      .bind(id, name, amount, currency, coffees)
      .first<SupporterRow>();
    return c.json({ supporter });
  } catch (err) {
    console.error("Failed to add supporter", err);
    return c.json({ error: "Failed to add" }, 500);
  }
});

// PATCH /api/supporters/:id — owner only
supporters.patch("/supporters/:id", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const values: unknown[] = [];

  if (typeof body["name"] === "string" && body["name"].trim()) {
    sets.push("name = ?");
    values.push(body["name"].trim());
  }
  if (body["amount"] !== undefined) {
    const amount = Number.parseFloat(String(body["amount"]));
    if (!Number.isNaN(amount)) {
      sets.push("amount = ?");
      values.push(amount);
    }
  }
  if (body["currency"] !== undefined) {
    sets.push("currency = ?");
    values.push(String(body["currency"]));
  }
  if (body["coffees"] !== undefined) {
    sets.push("coffees = ?");
    values.push(Number(body["coffees"]));
  }

  if (sets.length === 0) return c.json({ error: "Nothing to update" }, 400);
  values.push(c.req.param("id"));

  try {
    const supporter = await c.env.DB.prepare(
      `UPDATE supporters SET ${sets.join(", ")} WHERE id = ?
       RETURNING id, name, amount, currency, coffees`,
    )
      .bind(...values)
      .first<SupporterRow>();
    if (!supporter) return c.json({ error: "Not found" }, 404);
    return c.json({ supporter });
  } catch (err) {
    console.error("Failed to update supporter", err);
    return c.json({ error: "Failed to update" }, 500);
  }
});

// DELETE /api/supporters/:id — owner only
supporters.delete("/supporters/:id", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);
  try {
    await c.env.DB.prepare("DELETE FROM supporters WHERE id = ?").bind(c.req.param("id")).run();
    return c.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete supporter", err);
    return c.json({ error: "Failed to delete" }, 500);
  }
});

export default supporters;
