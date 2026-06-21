"use server";

import { revalidatePath } from "next/cache";
import { resolveWritableOrg } from "./guest";
import { saveConnection, deleteConnection, getConnection, externalIdForOrg, gridmindAwsAccountId } from "./connections";
import { syncRealData, type SyncResult } from "./sync";
import { isRoleArn, cloudFormationTemplate, terraformSnippet, DEFAULT_AWS_REGION } from "./aws-template";
import { rateLimit } from "./rate-limit";

export interface AwsSetup {
  account: string;
  accountConfigured: boolean;   // has the operator set GRIDMIND_AWS_ACCOUNT_ID?
  externalId: string;
  region: string;
  cloudformation: string;
  terraform: string;
  connectedRoleArn: string | null;
}

/**
 * Resolve (and persist) this workspace's stable ExternalId, then return the exact
 * setup the customer runs in their own AWS account. Resolving the writable org
 * here also pins the guest cookie, so the ExternalId shown matches the org the
 * subsequent connect writes to.
 */
export async function beginAwsConnectAction(): Promise<AwsSetup> {
  const org = await resolveWritableOrg();
  const externalId = await externalIdForOrg(org);
  const account = gridmindAwsAccountId();
  const existing = await getConnection(org, "aws");
  return {
    account,
    accountConfigured: !!account,
    externalId,
    region: existing?.provider === "aws" ? existing.region : DEFAULT_AWS_REGION,
    cloudformation: cloudFormationTemplate(externalId, account),
    terraform: terraformSnippet(externalId, account),
    connectedRoleArn: existing?.provider === "aws" ? existing.roleArn : null,
  };
}

export interface ConnectResult {
  ok: boolean;
  message: string;
}

/** Store the customer's role ARN and immediately try to pull their spend. */
export async function connectAwsAction(_prev: ConnectResult | null, formData: FormData): Promise<ConnectResult> {
  if (!(await rateLimit("connect", 10, 60_000))) {
    return { ok: false, message: "Too many attempts — please wait a minute." };
  }
  const roleArn = String(formData.get("roleArn") || "").trim();
  const region = String(formData.get("region") || DEFAULT_AWS_REGION).trim() || DEFAULT_AWS_REGION;
  if (!isRoleArn(roleArn)) {
    return { ok: false, message: "That doesn't look like an IAM role ARN — expected arn:aws:iam::<account>:role/GridMindCostReadOnly." };
  }

  const org = await resolveWritableOrg();
  const externalId = await externalIdForOrg(org);
  await saveConnection(org, { provider: "aws", roleArn, externalId, region });

  let synced: SyncResult | null = null;
  try {
    synced = await syncRealData();
  } catch (e) {
    synced = { ok: false, source: "sample", rows: 0, connected: [], errors: [], message: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/", "layout");

  if (synced?.ok) {
    return { ok: true, message: `Connected. Pulled ${synced.rows.toLocaleString()} usage rows from your AWS account.` };
  }
  return {
    ok: true,
    message: `Role saved, but no data came back yet${synced?.message ? ` (${synced.message})` : ""}. Confirm the role exists in your account and that GridMind's own AWS identity is configured, then hit Sync.`,
  };
}

/** Remove the AWS connection and revert the workspace toward sample/other data. */
export async function disconnectAwsAction(): Promise<void> {
  const org = await resolveWritableOrg();
  await deleteConnection(org, "aws");
  revalidatePath("/", "layout");
}
