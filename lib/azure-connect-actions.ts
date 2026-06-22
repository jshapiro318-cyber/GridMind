"use server";

import { revalidatePath } from "next/cache";
import { resolveWritableOrg } from "./guest";
import { saveConnection, deleteConnection, getConnection, gridmindAzureClientId } from "./connections";
import { syncRealData, type SyncResult } from "./sync";
import { isUuid, azureConsentUrl, azureRoleCommand } from "./azure-template";
import { rateLimit } from "./rate-limit";
import type { ConnectResult } from "./connections-actions";

export interface AzureSetup {
  clientId: string;
  clientConfigured: boolean;   // has the operator set AZURE_CLIENT_ID?
  tenantId: string;
  subscriptionId: string;
  consentUrl: string;
  roleCommand: string;
  connectedSubscription: string | null;
}

/**
 * Resolve the writable org (pinning the guest cookie so the connect below writes to
 * the same org), then return the exact admin-consent URL + role-assignment command
 * the customer's admin runs in their own tenant. Prefills any ids already stored.
 */
export async function beginAzureConnectAction(): Promise<AzureSetup> {
  const org = await resolveWritableOrg();
  const existing = await getConnection(org, "azure");
  const tenantId = existing?.provider === "azure" ? existing.tenantId : "";
  const subscriptionId = existing?.provider === "azure" ? existing.subscriptionId : "";
  const clientId = gridmindAzureClientId();
  return {
    clientId,
    clientConfigured: !!clientId,
    tenantId,
    subscriptionId,
    consentUrl: azureConsentUrl(clientId, tenantId),
    roleCommand: azureRoleCommand(clientId, subscriptionId),
    connectedSubscription: existing?.provider === "azure" ? existing.subscriptionId : null,
  };
}

/** Store the customer's tenant + subscription ids and immediately try to pull spend. */
export async function connectAzureAction(_prev: ConnectResult | null, formData: FormData): Promise<ConnectResult> {
  if (!(await rateLimit("connect", 10, 60_000))) {
    return { ok: false, message: "Too many attempts — please wait a minute." };
  }
  const tenantId = String(formData.get("tenantId") || "").trim();
  const subscriptionId = String(formData.get("subscriptionId") || "").trim();
  if (!isUuid(tenantId)) {
    return { ok: false, message: "That doesn't look like a tenant id — expected a GUID like 00000000-0000-0000-0000-000000000000." };
  }
  if (!isUuid(subscriptionId)) {
    return { ok: false, message: "That doesn't look like a subscription id — expected a GUID like 00000000-0000-0000-0000-000000000000." };
  }

  const org = await resolveWritableOrg();
  await saveConnection(org, { provider: "azure", tenantId, subscriptionId });

  let synced: SyncResult | null = null;
  try {
    synced = await syncRealData();
  } catch (e) {
    synced = { ok: false, source: "sample", rows: 0, connected: [], errors: [], message: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/", "layout");

  if (synced?.ok) {
    return { ok: true, message: `Connected. Pulled ${synced.rows.toLocaleString()} usage rows from your Azure subscription.` };
  }
  return {
    ok: true,
    message: `Subscription saved, but no data came back yet${synced?.message ? ` (${synced.message})` : ""}. Confirm an admin granted consent, that GridMind's app has Cost Management Reader on this subscription, and that GridMind's own AZURE_CLIENT_ID/AZURE_CLIENT_SECRET are configured, then hit Sync.`,
  };
}

/** Remove the Azure connection and revert the workspace toward sample/other data. */
export async function disconnectAzureAction(): Promise<void> {
  const org = await resolveWritableOrg();
  await deleteConnection(org, "azure");
  revalidatePath("/", "layout");
}
