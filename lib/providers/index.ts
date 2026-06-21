import "server-only";
import { awsProvider, fetchUsageViaRole } from "./aws";
import { azureProvider } from "./azure";
import { gcpProvider } from "./gcp";
import { neocloudProvider } from "./neocloud";
import { getConnections } from "../connections";
import type { CostProvider, ProviderStatus, UsageRow } from "./types";

export type { ProviderStatus, UsageRow } from "./types";

const PROVIDERS: CostProvider[] = [awsProvider, azureProvider, gcpProvider, neocloudProvider];

export function providerStatuses(): ProviderStatus[] {
  return PROVIDERS.map((p) => p.status());
}

/** True when at least one provider has read-only credentials configured. */
export function anyConnected(): boolean {
  return PROVIDERS.some((p) => p.configured());
}

export interface FetchResult {
  rows: UsageRow[];
  connected: string[];          // provider ids that returned data
  errors: { id: string; message: string }[];
}

/** Pull real usage from every configured provider (in parallel, fault-isolated). */
export async function fetchRealUsage(days = 90): Promise<FetchResult> {
  const active = PROVIDERS.filter((p) => p.configured());
  const rows: UsageRow[] = [];
  const connected: string[] = [];
  const errors: { id: string; message: string }[] = [];
  await Promise.all(active.map(async (p) => {
    try {
      const r = await p.fetchUsage(days);
      if (r.length) { rows.push(...r); connected.push(p.id); }
    } catch (e) {
      errors.push({ id: p.id, message: e instanceof Error ? e.message : String(e) });
    }
  }));
  return { rows, connected, errors };
}

/** True when THIS org has a stored connection, or the deployment env is configured. */
export async function anyConnectedForOrg(org: string): Promise<boolean> {
  if ((await getConnections(org)).length > 0) return true;
  return anyConnected();
}

/** Pull real usage for a specific org: its own stored cross-account connections if
 *  any, else fall back to the deployment's env-configured providers (self-host). */
export async function fetchRealUsageForOrg(org: string, days = 90): Promise<FetchResult> {
  const conns = await getConnections(org);
  if (conns.length === 0) return fetchRealUsage(days);
  const rows: UsageRow[] = [];
  const connected: string[] = [];
  const errors: { id: string; message: string }[] = [];
  await Promise.all(conns.map(async (c) => {
    try {
      if (c.provider === "aws") {
        const r = await fetchUsageViaRole(c.roleArn, c.externalId, c.region, days);
        if (r.length) { rows.push(...r); connected.push("aws"); }
      }
    } catch (e) {
      errors.push({ id: c.provider, message: e instanceof Error ? e.message : String(e) });
    }
  }));
  return { rows, connected, errors };
}
