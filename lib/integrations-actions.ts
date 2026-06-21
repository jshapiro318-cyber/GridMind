"use server";

import { revalidatePath } from "next/cache";
import { resetToSample, syncRealData, type SyncResult } from "./sync";
import { rateLimit } from "./rate-limit";

/** Pull fresh real data from connected providers and refresh every page. */
export async function syncNowAction(): Promise<SyncResult> {
  if (!(await rateLimit("sync", 8, 60_000))) {
    return { ok: false, source: "sample", rows: 0, connected: [], errors: [], message: "Too many syncs — please wait a minute." };
  }
  const res = await syncRealData();
  revalidatePath("/", "layout");
  return res;
}

/** Drop real data and go back to the bundled sample dataset. */
export async function resetToSampleAction(): Promise<void> {
  await resetToSample();
  revalidatePath("/", "layout");
}
