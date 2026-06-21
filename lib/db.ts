import "server-only";
import path from "node:path";
import { createClient, type Client, type InArgs, type Row } from "@libsql/client";
import { latestDayForOrg, seedOrg } from "./seed";

// ─────────────────────────────────────────────────────────────────────────────
// Data layer — libSQL (Turso-compatible), async.
//
// Local/dev default: a file-backed libSQL DB seeded with the sample "demo" org.
// Hosted: set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) and the SAME code talks to
// Turso instead. Every row carries an `org_id`; the public demo lives in the
// 'demo' org and every authenticated tenant gets its own — see lib/tenant.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_ORG = "demo";

declare global {
  // eslint-disable-next-line no-var
  var __gridmind_db: Client | undefined;
  // eslint-disable-next-line no-var
  var __gridmind_ready: Promise<void> | undefined;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS usage (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id       TEXT NOT NULL DEFAULT 'demo',
    day          TEXT NOT NULL,
    provider_id  TEXT NOT NULL,
    region_id    TEXT NOT NULL,
    gpu_id       TEXT NOT NULL,
    model_id     TEXT NOT NULL,
    team         TEXT NOT NULL,
    project_id   TEXT NOT NULL,
    gpu_hours    REAL NOT NULL,
    cost         REAL NOT NULL,
    energy_kwh   REAL NOT NULL,
    co2_kg       REAL NOT NULL,
    utilization  REAL NOT NULL,
    anomaly      INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_usage_org_day ON usage(org_id, day);
  CREATE INDEX IF NOT EXISTS idx_usage_org_provider ON usage(org_id, provider_id);
  CREATE INDEX IF NOT EXISTS idx_usage_org_team ON usage(org_id, team);
  CREATE TABLE IF NOT EXISTS meta (
    org_id TEXT NOT NULL,
    k      TEXT NOT NULL,
    v      TEXT,
    PRIMARY KEY (org_id, k)
  );
  CREATE TABLE IF NOT EXISTS waitlist (
    email      TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    source     TEXT
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    org_id                 TEXT PRIMARY KEY,
    plan                   TEXT NOT NULL DEFAULT 'free',
    status                 TEXT NOT NULL DEFAULT 'inactive',
    stripe_customer_id     TEXT,
    stripe_subscription_id TEXT,
    current_period_end     TEXT,
    updated_at             TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_sub_customer ON subscriptions(stripe_customer_id);
`;

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN, intMode: "number" });
  }
  // No hosted DB configured. In production (serverless, read-only filesystem)
  // fall back to an ephemeral in-memory DB that seeds on each cold start — so
  // the public demo deploys cleanly without Turso. Locally we persist to a file
  // (a fresh name, distinct from the legacy better-sqlite3 gridmind.db).
  if (process.env.NODE_ENV === "production") {
    return createClient({ url: ":memory:", intMode: "number" });
  }
  const file = `file:${path.join(process.cwd(), "data", "app.db")}`;
  return createClient({ url: file, intMode: "number" });
}

export function client(): Client {
  if (!global.__gridmind_db) global.__gridmind_db = makeClient();
  return global.__gridmind_db;
}

async function init(): Promise<void> {
  const c = client();
  await c.executeMultiple(SCHEMA);
  // Seed the demo org on first boot / when stale — unless real provider data has
  // been ingested for it (meta.source='live'), which we never overwrite.
  const src = await c.execute({ sql: "SELECT v FROM meta WHERE org_id = ? AND k = 'source'", args: [DEMO_ORG] });
  if ((src.rows[0]?.v as string | undefined) !== "live") {
    const today = new Date().toISOString().slice(0, 10);
    if ((await latestDayForOrg(c, DEMO_ORG)) !== today) await seedOrg(c, DEMO_ORG);
  }
}

/** Idempotent, run-once schema + demo-seed. Awaited by every query helper. */
export function ready(): Promise<void> {
  if (!global.__gridmind_ready) global.__gridmind_ready = init();
  return global.__gridmind_ready;
}

// ── Query helpers ────────────────────────────────────────────────────────────

export async function q<T = Row>(sql: string, args: InArgs = []): Promise<T[]> {
  await ready();
  const rs = await client().execute({ sql, args });
  // libSQL Rows carry a non-plain prototype (named + indexed access). Rebuild
  // them as plain objects keyed by column name so results are safe to pass from
  // Server Components to Client Components (React rejects non-plain objects).
  const cols = rs.columns;
  return rs.rows.map((row) => {
    const o: Record<string, unknown> = {};
    for (let i = 0; i < cols.length; i++) o[cols[i]] = (row as unknown as unknown[])[i];
    return o as T;
  });
}

export async function q1<T = Row>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await q<T>(sql, args))[0];
}

export async function exec(sql: string, args: InArgs = []): Promise<void> {
  await ready();
  await client().execute({ sql, args });
}

export async function getMeta(orgId: string, k: string): Promise<string | null> {
  const row = await q1<{ v: string }>("SELECT v FROM meta WHERE org_id = ? AND k = ?", [orgId, k]);
  return row?.v ?? null;
}

export async function setMeta(orgId: string, k: string, v: string): Promise<void> {
  await exec(
    "INSERT INTO meta (org_id, k, v) VALUES (?, ?, ?) ON CONFLICT(org_id, k) DO UPDATE SET v = excluded.v",
    [orgId, k, v]
  );
}
