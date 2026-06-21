import "server-only";
import crypto from "node:crypto";
import { REGIONS } from "@/lib/catalog";
import { mapRegion, rangeStart, utcDay, type CostProvider, type ProviderStatus, type UsageRow } from "./types";

// ── Google Cloud adapter — REAL, read-only (BigQuery billing export) ─────────
// GCP spend lives in the standard BigQuery billing export. Needs (the customer's
// own) service-account creds + the export table, in the environment:
//   GCP_PROJECT_ID, GCP_SA_EMAIL, GCP_SA_PRIVATE_KEY (PEM),
//   GCP_BILLING_TABLE  (e.g.  myproj.billing.gcp_billing_export_v1_0123AB_…)
// Role required: BigQuery Data Viewer + Job User on that dataset (read-only).
// (One-time setup on the customer's side: enable the Cloud Billing → BigQuery export.)

const KNOWN = new Set(REGIONS.map((r) => r.id));

function configured(): boolean {
  return !!(process.env.GCP_PROJECT_ID && process.env.GCP_SA_EMAIL && process.env.GCP_SA_PRIVATE_KEY && process.env.GCP_BILLING_TABLE);
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Mint a Google OAuth access token from the service-account key (RS256 JWT). */
async function token(): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: process.env.GCP_SA_EMAIL,
    scope: "https://www.googleapis.com/auth/bigquery.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat, exp: iat + 3600,
  }));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const key = (process.env.GCP_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const sig = b64url(signer.sign(key));
  const assertion = `${header}.${claims}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`GCP token ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function fetchUsage(days: number): Promise<UsageRow[]> {
  if (!configured()) return [];
  const project = process.env.GCP_PROJECT_ID!;
  const table = process.env.GCP_BILLING_TABLE!.replace(/[`;]/g, ""); // identifier only
  const access = await token();
  const query = `
    SELECT FORMAT_TIMESTAMP('%Y-%m-%d', usage_start_time) AS day,
           IFNULL(location.region, 'unknown') AS region,
           IFNULL(project.id, 'untagged') AS project,
           SUM(cost) AS cost
    FROM \`${table}\`
    WHERE usage_start_time >= TIMESTAMP('${rangeStart(days)}')
    GROUP BY day, region, project
    HAVING cost > 0`;
  const res = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, useLegacySql: false, timeoutMs: 30000 }),
  });
  if (!res.ok) throw new Error(`BigQuery ${res.status}`);
  const data = (await res.json()) as { rows?: { f: { v: string }[] }[] };
  return (data.rows ?? []).map((r): UsageRow => ({
    day: r.f[0].v,
    providerId: "gcp",
    regionId: mapRegion(String(r.f[1].v).toLowerCase(), KNOWN),
    gpuId: "unknown", modelId: "unknown", team: "untagged", projectId: r.f[2].v || "untagged",
    gpuHours: 0, cost: Number(r.f[3].v ?? 0), energyKwh: 0, co2Kg: 0, utilization: 0, anomaly: 0,
  })).filter((r) => r.cost > 0);
}

export const gcpProvider: CostProvider = {
  id: "gcp",
  label: "Google Cloud",
  configured,
  status(): ProviderStatus {
    return {
      id: "gcp", label: "Google Cloud", configured: configured(), mode: "read-only",
      detail: configured() ? "BigQuery billing export" : "Set GCP_PROJECT_ID, GCP_SA_EMAIL, GCP_SA_PRIVATE_KEY, GCP_BILLING_TABLE (billing export)",
    };
  },
  fetchUsage,
};
