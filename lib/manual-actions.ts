"use server";

import { revalidatePath } from "next/cache";
import { setMeta } from "./db";
import { resolveWritableOrg, clearGuestWorkspace } from "./guest";
import { ingest } from "./sync";
import { synthesizeUsage } from "./synth";
import { rateLimit } from "./rate-limit";

export interface ManualResult {
  ok: boolean;
  message: string;
}

/** Save a quick manual estimate into the caller's (or a new guest) workspace. */
export async function saveManualDataAction(_prev: ManualResult | null, formData: FormData): Promise<ManualResult> {
  if (!(await rateLimit("manual", 20, 60_000))) {
    return { ok: false, message: "Too many updates — please wait a minute." };
  }
  const monthlySpend = Number(String(formData.get("monthlySpend") ?? "").replace(/[$,\s]/g, ""));
  const providerId = String(formData.get("provider") ?? "aws");
  const gpuId = String(formData.get("gpu") ?? "h100");

  if (!isFinite(monthlySpend) || monthlySpend <= 0) {
    return { ok: false, message: "Enter your approximate monthly AI-compute spend." };
  }
  if (monthlySpend > 1_000_000_000) {
    return { ok: false, message: "That spend looks too large — double-check the number." };
  }

  const rows = synthesizeUsage({ monthlySpend, providerId, gpuId });
  if (rows.length === 0) {
    return { ok: false, message: "Pick a provider and GPU that go together, then try again." };
  }

  const org = await resolveWritableOrg();
  await ingest(org, rows);
  await Promise.all([
    setMeta(org, "source", "live"),
    setMeta(org, "connected", JSON.stringify(["Manual estimate"])),
    setMeta(org, "synced_at", new Date().toISOString()),
  ]);
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Done — your dashboard now models ~$${Math.round(monthlySpend).toLocaleString()}/mo on ${providerId.toUpperCase()} · ${gpuId.toUpperCase()}.`,
  };
}

/** Return a guest visitor to the shared sample demo. */
export async function exitGuestWorkspaceAction(): Promise<void> {
  await clearGuestWorkspace();
  revalidatePath("/", "layout");
}
