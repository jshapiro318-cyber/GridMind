// ─────────────────────────────────────────────────────────────────────────────
// Azure cross-tenant connect — the exact, least-privilege setup a customer's admin
// runs in THEIR tenant to grant GridMind READ-ONLY Cost Management access: admin-
// consent GridMind's multi-tenant app, then assign it "Cost Management Reader" on
// the subscription. Plus GUID validation. Pure & import-safe on client + server
// (the wizard renders these, tests assert them). No secrets, no env reads — all
// inputs are passed in.
// ─────────────────────────────────────────────────────────────────────────────

export const AZURE_ROLE_NAME = "Cost Management Reader";
export const TENANT_PLACEHOLDER = "<YOUR_AZURE_TENANT_ID>";
export const CLIENT_PLACEHOLDER = "<YOUR_GRIDMIND_AZURE_CLIENT_ID>";
export const SUBSCRIPTION_PLACEHOLDER = "<YOUR_AZURE_SUBSCRIPTION_ID>";

/** A standard GUID — tenant, subscription, and client ids are all GUIDs. */
export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((s || "").trim());
}

/** The admin-consent URL the customer's admin opens to grant GridMind's multi-tenant
 *  app access in THEIR tenant. Consent is per-tenant, so the tenant id is in the path. */
export function azureConsentUrl(clientId: string, tenantId: string): string {
  const tenant = tenantId || TENANT_PLACEHOLDER;
  const client = clientId || CLIENT_PLACEHOLDER;
  return `https://login.microsoftonline.com/${tenant}/adminconsent?client_id=${client}`;
}

/** The Azure CLI command the customer runs to assign GridMind's app the read-only
 *  "Cost Management Reader" role, scoped to one subscription. */
export function azureRoleCommand(clientId: string, subscriptionId: string): string {
  const client = clientId || CLIENT_PLACEHOLDER;
  const sub = subscriptionId || SUBSCRIPTION_PLACEHOLDER;
  return `az role assignment create --assignee ${client} --role "${AZURE_ROLE_NAME}" --scope /subscriptions/${sub}`;
}
