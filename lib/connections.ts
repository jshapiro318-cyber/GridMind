import "server-only";
import { randomBytes } from "node:crypto";
import { q, exec, getMeta, setMeta } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Per-org cloud connections — the multi-tenant store that lets EACH customer
// grant GridMind read-only access to THEIR OWN account, via a delegated
// cross-account role (no keys ever stored). One row per (org, provider); the
// `config` blob holds only non-secret connection metadata (a role ARN + the
// org's ExternalId), never a credential.
// ─────────────────────────────────────────────────────────────────────────────

export interface AwsConnection {
  provider: "aws";
  roleArn: string;
  externalId: string;
  region: string;
}
export type Connection = AwsConnection;

/** GridMind's own AWS account id — the principal a customer's role trusts. The
 *  operator sets this once; until then the wizard shows a clear placeholder. */
export function gridmindAwsAccountId(): string {
  return process.env.GRIDMIND_AWS_ACCOUNT_ID || "";
}

/** A stable, unguessable ExternalId for an org — generated once and persisted so
 *  the customer's role keeps trusting the same value across deploys and secret
 *  rotations. Protects against the cross-account "confused deputy". */
export async function externalIdForOrg(org: string): Promise<string> {
  let id = await getMeta(org, "aws_external_id");
  if (!id) {
    id = "gridmind-" + randomBytes(12).toString("hex");
    await setMeta(org, "aws_external_id", id);
  }
  return id;
}

export async function getConnections(org: string): Promise<Connection[]> {
  const rows = await q<{ config: string }>("SELECT config FROM connections WHERE org_id = ?", [org]);
  const out: Connection[] = [];
  for (const r of rows) {
    try { out.push(JSON.parse(r.config) as Connection); } catch { /* skip corrupt row */ }
  }
  return out;
}

export async function getConnection(org: string, provider: string): Promise<Connection | null> {
  const rows = await q<{ config: string }>("SELECT config FROM connections WHERE org_id = ? AND provider_id = ?", [org, provider]);
  if (!rows[0]) return null;
  try { return JSON.parse(rows[0].config) as Connection; } catch { return null; }
}

export async function saveConnection(org: string, conn: Connection): Promise<void> {
  await exec(
    "INSERT INTO connections (org_id, provider_id, config, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(org_id, provider_id) DO UPDATE SET config = excluded.config",
    [org, conn.provider, JSON.stringify(conn), new Date().toISOString()]
  );
}

export async function deleteConnection(org: string, provider: string): Promise<void> {
  await exec("DELETE FROM connections WHERE org_id = ? AND provider_id = ?", [org, provider]);
}
