import { Hono } from "hono";
import type { AppEnv } from "../env";
import { withDb } from "../lib/db";

const bot = new Hono<AppEnv>();

type Range = "1d" | "7d" | "30d" | "1y" | "all";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The bot refreshes botStats on a timer; older than this and it is not up. */
const LIVE_WINDOW_MS = 15 * 60 * 1000;

// ── Mock growth data ────────────────────────────────────────────────────────
// Used when guildCounts has nothing for the requested range. Deterministic on
// purpose: the same day always yields the same number, so the chart does not
// re-roll itself on every refresh.

function seededRand(seed: number): number {
  let s = seed ^ 0xdeadbeef;
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  return ((s ^ (s >>> 16)) >>> 0) / 0xffffffff;
}

function dailySeed(d: Date): number {
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function countUpTo(target: Date, base: Date, baseVal: number, dailyMax: number): number {
  const days = Math.round((target.getTime() - base.getTime()) / 86400_000);
  let val = baseVal;
  for (let i = 0; i < days; i++) {
    val += Math.floor(seededRand(dailySeed(new Date(base.getTime() + i * 86400_000))) * dailyMax);
  }
  return val;
}

const MOCK_EPOCH = new Date("2023-06-28T00:00:00Z");
const MOCK_BASE = 8;

function buildMock(range: Range): { label: string; servers: number }[] {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const points: { label: string; servers: number }[] = [];

  if (range === "1d") {
    const base = countUpTo(today, MOCK_EPOCH, MOCK_BASE, 3);
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 3600_000);
      const extra = Math.floor(seededRand(dailySeed(today) * 100 + h.getUTCHours()) * 0.5);
      points.push({ label: `${h.getUTCHours()}:00`, servers: base + extra });
    }
  } else if (range === "7d" || range === "30d") {
    const span = range === "7d" ? 7 : 30;
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400_000);
      points.push({
        label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
        servers: countUpTo(d, MOCK_EPOCH, MOCK_BASE, 3),
      });
    }
  } else if (range === "1y") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
      points.push({
        label: `${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`,
        servers: countUpTo(d, MOCK_EPOCH, MOCK_BASE, 3),
      });
    }
  } else {
    const d = new Date(MOCK_EPOCH);
    while (d <= today) {
      points.push({
        label: `${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`,
        servers: countUpTo(d, MOCK_EPOCH, MOCK_BASE, 3),
      });
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
  }
  return points;
}

// ── GET /api/bot/stats ──────────────────────────────────────────────────────
bot.get("/bot/stats", async (c) => {
  const snapshot = await withDb(c.env.MONGODB_URI, async (db) => {
    const live = await db
      .collection("botStats")
      .findOne<{ guilds?: number; users?: number; updatedAt?: number }>({ _id: "live" as never });

    if (live && typeof live.guilds === "number") {
      return { servers: live.guilds, users: live.users ?? null, updatedAt: live.updatedAt ?? null };
    }

    // botStats is upserted by the bot on a timer; guildCounts is the append-only
    // log behind it. If the snapshot is missing, the newest log entry will do.
    const latest = await db
      .collection("guildCounts")
      .findOne<{ guilds?: number; users?: number; timestamp?: number }>(
        {},
        { sort: { timestamp: -1 } },
      );

    return latest
      ? {
          servers: latest.guilds ?? null,
          users: latest.users ?? null,
          updatedAt: latest.timestamp ?? null,
        }
      : { servers: null, users: null, updatedAt: null };
  });

  // The Express version derived "uptime" from when the web process started,
  // which said nothing about the bot. A Worker has no such process at all, so
  // liveness now comes from how recently the bot wrote its snapshot.
  const updatedAt = snapshot?.updatedAt ?? null;
  const online = updatedAt !== null && Date.now() - updatedAt < LIVE_WINDOW_MS;

  return c.json({
    servers: snapshot?.servers ?? null,
    users: snapshot?.users ?? null,
    commands: 124,
    lastSeen: updatedAt,
    online,
    connected: snapshot !== null,
  });
});

// ── GET /api/bot/growth ─────────────────────────────────────────────────────
bot.get("/bot/growth", async (c) => {
  const range = (c.req.query("range") ?? "30d") as Range;

  const shape: Record<
    Range,
    { sinceMs: number; hour: boolean; monthly: boolean; limit: number }
  > = {
    "1d": { sinceMs: 24 * 3600_000, hour: true, monthly: false, limit: 24 },
    "7d": { sinceMs: 7 * 86400_000, hour: false, monthly: false, limit: 7 },
    "30d": { sinceMs: 30 * 86400_000, hour: false, monthly: false, limit: 30 },
    "1y": { sinceMs: 365 * 86400_000, hour: false, monthly: true, limit: 12 },
    all: { sinceMs: 0, hour: false, monthly: true, limit: 60 },
  };
  const spec = shape[range] ?? shape["30d"];

  const data = await withDb(c.env.MONGODB_URI, async (db) => {
    const groupBy: Record<string, unknown> = {
      year: { $year: { $toDate: "$timestamp" } },
      month: { $month: { $toDate: "$timestamp" } },
    };
    const sort: Record<string, 1> = { "_id.year": 1, "_id.month": 1 };

    if (!spec.monthly) {
      groupBy["day"] = { $dayOfMonth: { $toDate: "$timestamp" } };
      sort["_id.day"] = 1;
      if (spec.hour) {
        groupBy["hour"] = { $hour: { $toDate: "$timestamp" } };
        sort["_id.hour"] = 1;
      }
    }

    // The bot writes `timestamp: Date.now()` — a NUMBER. The original server
    // matched it against `new Date(...).toISOString()`, a string, and BSON
    // sorts every number below every string, so the range filter matched
    // nothing and every chart silently fell back to mock data. Comparing
    // number to number is the fix.
    const match =
      spec.sinceMs > 0 ? [{ $match: { timestamp: { $gte: Date.now() - spec.sinceMs } } }] : [];

    const raw = await db
      .collection("guildCounts")
      .aggregate<{ _id: Record<string, number>; servers: number }>([
        ...match,
        { $group: { _id: groupBy, servers: { $max: "$guilds" } } },
        { $sort: sort },
        { $limit: spec.limit },
      ])
      .toArray();

    if (raw.length === 0) return null;

    return raw.map((g) => ({
      label: spec.hour
        ? `${g._id["hour"]}:00`
        : spec.monthly
          ? `${MONTHS[(g._id["month"] ?? 1) - 1]} '${String(g._id["year"]).slice(2)}`
          : `${g._id["day"]}/${g._id["month"]}`,
      servers: g.servers,
    }));
  });

  return c.json(data ?? buildMock(range));
});

export default bot;
