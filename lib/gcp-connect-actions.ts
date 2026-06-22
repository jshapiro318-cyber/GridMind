"use server";

import { revalidatePath } from "next/cache";
import { resolveWritableOrg } from "./guest";
import { saveConnection, deleteConnection, getConnection, gridmindGcpSaEmail } from "./connections";
import { syncRealData, type SyncResult } from "./sync";
import { isGcpProjectId, isBillingTable, gcloudGrantCommands } from "./gcp-template";
import { type ConnectResult } from "./connections-actions";
import { rateLimit } from "./rate-limit";

export interface GcpSetup {
  saEmail: string;
  saConfigured: boolean;        // has the operator set GCP_SA_EMAIL?
  project: string;
  table: string;
  grantCommands: string;
  connectedTable: string | null;
}

/**
 * Resolve the writable org (pinning the guest cookie so the setup shown matches
 * the org the subsequent connect writes to), then return the exact gcloud the
 * customer runs in their own project to grant GridMind's service account read
 * access to their BigQuery billing export.
 */
export async function beginGcpConnectAction(): Promise<GcpSetup> {
  const org = await resolveWritableOrg();
  const existing = await getConnection(org, "gcp");
  const saEmail = gridmindGcpSaEmail();
  const project = existing?.provider === "gcp" ? existing.project : "";
  const table = existing?.provider === "gcp" ? existing.table : "";
  return {
    saEmail,
    saConfigured: !!saEmail,
    project,
    table,
    grantCommands: gcloudGrantCommands(saEmail, existing?.provider === "gcp" ? existing.project : ""),
    connectedTable: existing?.provider === "gcp" ? existing.table : null,
  };
}

/** Store the customer's project + billing table and immediately try to pull their spend. */
export async function connectGcpAction(_prev: ConnectResult | null, formData: FormData): Promise<ConnectResult> {
  if (!(await rateLimit("connect", 10, 60_000))) {
    return { ok: false, message: "Too many attempts — please wait a minute." };
  }
  const project = String(formData.get("project") || "").trim();
  const table = String(formData.get("table") || "").trim();
  if (!isGcpProjectId(project)) {
    return { ok: false, message: "That doesn't look like a GCP project id — expected 6–30 chars, starting with a lowercase letter (e.g. my-gcp-project)." };
  }
  if (!isBillingTable(table)) {
    return { ok: false, message: "That doesn't look like a billing-export table — expected project.dataset.table (e.g. myproj.billing.gcp_billing_export_v1_0123AB)." };
  }

  const org = await resolveWritableOrg();
  await saveConnection(org, { provider: "gcp", project, table });

  let synced: SyncResult | null = null;
  try {
    synced = await syncRealData();
  } catch (e) {
    synced = { ok: false, source: "sample", rows: 0, connected: [], errors: [], message: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/", "layout");

  if (synced?.ok) {
    return { ok: true, message: `Connected. Pulled ${synced.rows.toLocaleString()} usage rows from your BigQuery billing export.` };
  }
  return {
    ok: true,
    message: `Project + table saved, but no data came back yet${synced?.message ? ` (${synced.message})` : ""}. Confirm GridMind's service account was granted access on that dataset + project, and that GridMind's own GCP_SA_* identity is configured, then hit Sync.`,
  };
}

/** Remove the GCP connection and revert the workspace toward sample/other data. */
export async function disconnectGcpAction(): Promise<void> {
  const org = await resolveWritableOrg();
  await deleteConnection(org, "gcp");
  revalidatePath("/", "layout");
}
