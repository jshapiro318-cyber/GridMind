import "server-only";
import { DEMO_ORG, client, getMeta, ready, setMeta } from "./db";
import { getCurrentOrgId } from "./tenant";
import { captureError } from "./observability";
import { seedOrg } from "./seed";
import { anyConnected, fetchRealUsage, providerStatuses, type ProviderStatus, type UsageRow } from "./providers";

const STALE_MS = 6 * 60 * 60 * 1000; // re-pull real data at most every 6h

export interface DataSource {
  source: "live" | "sample";
  connected: string[];           // provider ids whose data is loaded
  syncedAt: string | null;
  providers: ProviderStatus[];   // per-provider connection status
}

export async function getDataSource(): Promise<DataSource> {
  const org = await getCurrentOrgId();
  const [src, connectedRaw, syncedAt] = await Promise.all([
    getMeta(org, "source"),
    getMeta(org, "connected"),
    getMeta(org, "synced_at"),
  ]);
  let connected: string[] = [];
  try { connected = JSON.parse(connectedRaw || "[]"); } catch { connected = []; }
  return { source: src === "live" ? "live" : "sample", connected, syncedAt, providers: providerStatuses() };
}

export interface SyncResult {
  ok: boolean;
  source: "live" | "sample";
  rows: number;
  connected: string[];
  errors: { id: string; message: string }[];
  message: string;
}

/**
 * Pull real provider usage and REPLACE the current org's rows with it. Read-only
 * upstream. The public demo org never accepts real data — it always stays on the
 * sample fleet, so a deployer's real spend can't leak into the no-login demo.
 */
export async function syncRealData(days = 90): Promise<SyncResult> {
  const org = await getCurrentOrgId();
  if (org === DEMO_ORG) {
    return { ok: false, source: "sample", rows: 0, connected: [], errors: [], message: "The demo workspace always shows sample data — sign in to connect real spend." };
  }
  if (!anyConnected()) {
    return { ok: false, source: (await getMeta(org, "source")) === "live" ? "live" : "sample", rows: 0, connected: [], errors: [], message: "No providers connected — add read-only credentials to your environment first." };
  }
  const { rows, connected, errors } = await fetchRealUsage(days);
  if (rows.length === 0) {
    return { ok: false, source: (await getMeta(org, "source")) === "live" ? "live" : "sample", rows: 0, connected, errors, message: errors.length ? `Connected, but the API returned an error: ${errors.map((e) => `${e.id}: ${e.message}`).join("; ")}` : "Connected, but no spend was returned for the window." };
  }
  await ingest(org, rows);
  await Promise.all([
    setMeta(org, "source", "live"),
    setMeta(org, "connected", JSON.stringify(connected)),
    setMeta(org, "synced_at", new Date().toISOString()),
  ]);
  return { ok: true, source: "live", rows: rows.length, connected, errors, message: `Loaded ${rows.length.toLocaleString()} real usage rows from ${connected.join(", ")}.` };
}

const INGEST_SQL = `INSERT INTO usage
  (org_id, day, provider_id, region_id, gpu_id, model_id, team, project_id, gpu_hours, cost, energy_kwh, co2_kg, utilization, anomaly)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

/** Replace `org`'s usage rows with the given normalized rows. */
export async function ingest(org: string, rows: UsageRow[]): Promise<void> {
  await ready();
  const c = client();
  await c.execute({ sql: "DELETE FROM usage WHERE org_id = ?", args: [org] });
  const stmts = rows.map((r) => ({
    sql: INGEST_SQL,
    args: [org, r.day, r.providerId, r.regionId, r.gpuId, r.modelId, r.team, r.projectId, r.gpuHours, r.cost, r.energyKwh, r.co2Kg, r.utilization, r.anomaly],
  }));
  for (let i = 0; i < stmts.length; i += 500) {
    await c.batch(stmts.slice(i, i + 500), "write");
  }
}

/** If a provider is connected and the org's data is missing or stale, refresh it. */
export async function ensureFreshData(): Promise<void> {
  if (!anyConnected()) return;
  const org = await getCurrentOrgId();
  if (org === DEMO_ORG) return; // demo never auto-pulls real data
  const [source, syncedAt] = await Promise.all([getMeta(org, "source"), getMeta(org, "synced_at")]);
  const stale = !syncedAt || Date.now() - new Date(syncedAt).getTime() > STALE_MS;
  if (source !== "live" || stale) {
    try { await syncRealData(); } catch (e) { captureError(e, { where: "ensureFreshData", org }); /* keep serving whatever we have */ }
  }
}

/** Revert the current org to the bundled sample dataset (clears its real data). */
export async function resetToSample(): Promise<void> {
  const org = await getCurrentOrgId();
  await ready();
  await seedOrg(client(), org);
  await Promise.all([
    setMeta(org, "source", "sample"),
    setMeta(org, "connected", "[]"),
    setMeta(org, "synced_at", ""),
  ]);
}
