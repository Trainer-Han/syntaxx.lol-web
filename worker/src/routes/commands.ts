import { Hono } from "hono";
import type { AppEnv } from "../env";
import { isOwner } from "../lib/guards";

const commands = new Hono<AppEnv>();

interface CustomCommandRow {
  id: string;
  category_id: string;
  category_label: string;
  category_color: string;
  name: string;
  description: string;
  usage: string | null;
  command_type: "slash" | "prefix";
  is_admin: number;
  created_at: string;
}

// GET /api/commands/custom — public listing on the Commands page
commands.get("/commands/custom", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, category_id, category_label, category_color, name, description,
              usage_text AS usage, command_type, is_admin, created_at
         FROM custom_commands
        ORDER BY created_at ASC`,
    ).all<CustomCommandRow>();

    // is_admin is an INTEGER in SQLite; the page expects a boolean.
    return c.json({
      commands: (results ?? []).map((row) => ({ ...row, is_admin: row.is_admin === 1 })),
    });
  } catch (err) {
    console.error("GET /api/commands/custom error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// POST /api/commands/custom — owner only
commands.post("/commands/custom", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  const name = str("name");
  const description = str("description");
  const categoryId = str("categoryId");
  const categoryLabel = str("categoryLabel");
  const categoryColor = str("categoryColor");
  const usage = str("usage");
  const commandType = body["commandType"];

  if (!name || !description || !categoryId || !categoryLabel || !categoryColor) {
    return c.json(
      { error: "name, description, categoryId, categoryLabel, and categoryColor are required" },
      400,
    );
  }
  if (commandType !== "slash" && commandType !== "prefix") {
    return c.json({ error: "commandType must be 'slash' or 'prefix'" }, 400);
  }

  try {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO custom_commands
         (id, category_id, category_label, category_color, name, description,
          usage_text, command_type, is_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        categoryId,
        categoryLabel,
        categoryColor,
        name,
        description,
        usage || null,
        commandType,
        body["isAdmin"] ? 1 : 0,
      )
      .run();
    return c.json({ id }, 201);
  } catch (err) {
    console.error("POST /api/commands/custom error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// DELETE /api/commands/custom/:id — owner only
commands.delete("/commands/custom/:id", async (c) => {
  if (!isOwner(c)) return c.json({ error: "Forbidden" }, 403);
  try {
    await c.env.DB.prepare("DELETE FROM custom_commands WHERE id = ?")
      .bind(c.req.param("id"))
      .run();
    return c.body(null, 204);
  } catch (err) {
    console.error("DELETE /api/commands/custom/:id error", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

export default commands;
