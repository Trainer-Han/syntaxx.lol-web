/**
 * MongoDB on Cloudflare Workers.
 *
 * This works because nodejs_compat now supplies node:net and node:tls's
 * TLSSocket/connect, which the driver's wire protocol needs. Two rules follow
 * from the runtime, and breaking either is the usual cause of a mystery hang:
 *
 *  1. A client may not be created in global scope and reused across requests.
 *     Workers isolates are not a long-lived process; a socket opened for one
 *     request is not valid for the next. Connect inside the handler.
 *
 *  2. Pooling has nothing to pool, so maxPoolSize is 1. Every request pays a
 *     handshake. That is the cost of the serverless choice, not a bug.
 *
 * Atlas note: Workers' outbound TCP comes from a prefix that is not in
 * Cloudflare's published IP ranges, so there is no useful IP allowlist to
 * write. Atlas Network Access has to be 0.0.0.0/0, and SCRAM + TLS is what
 * actually protects the cluster.
 */
import { MongoClient, type Db } from "mongodb";

/**
 * Opens a client for the lifetime of one request. The caller owns it and must
 * close it — use `withDb`, which does that for you.
 */
async function connect(uri: string): Promise<{ client: MongoClient; db: Db }> {
  const client = new MongoClient(uri, {
    maxPoolSize: 1,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
    // The driver's default retry logic assumes a process that outlives the
    // request; here a retry just burns the request's time budget.
    retryWrites: true,
  });
  await client.connect();

  // The database name is the connection string's path, as in the bot's own
  // DatabaseURL (".../syntaxx?retryWrites=true"). Falling back to "syntaxx"
  // keeps a path-less URI working rather than silently using "test".
  const dbName = new URL(uri.replace("mongodb+srv://", "https://").replace("mongodb://", "https://"))
    .pathname.replace("/", "");

  return { client, db: client.db(dbName || "syntaxx") };
}

/**
 * Runs `fn` against the database, always closing the connection afterwards.
 *
 * Returns null instead of throwing when MONGODB_URI is unset or the cluster
 * is unreachable, mirroring the original server: the public pages degrade to
 * mock/empty data rather than 500ing when Mongo is down.
 */
export async function withDb<T>(
  uri: string | undefined,
  fn: (db: Db) => Promise<T>,
): Promise<T | null> {
  if (!uri) return null;

  let client: MongoClient | null = null;
  try {
    const conn = await connect(uri);
    client = conn.client;
    return await fn(conn.db);
  } catch (err) {
    console.error("MongoDB error", err);
    return null;
  } finally {
    // Not awaited on the request path: closing is best-effort cleanup and the
    // isolate is going away regardless.
    void client?.close().catch(() => {});
  }
}

/**
 * Like `withDb`, but propagates failure. Use for writes, where silently
 * returning null would tell the dashboard a save succeeded when it did not.
 */
export async function withDbStrict<T>(uri: string, fn: (db: Db) => Promise<T>): Promise<T> {
  let client: MongoClient | null = null;
  try {
    const conn = await connect(uri);
    client = conn.client;
    return await fn(conn.db);
  } finally {
    void client?.close().catch(() => {});
  }
}
