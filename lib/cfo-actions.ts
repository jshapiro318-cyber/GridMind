"use server";

import { getCFOBriefing } from "./cfo";

/** Lazy-load the CFO briefing when the assistant panel opens (keeps page loads light). */
export async function loadCFOBriefing() {
  return getCFOBriefing();
}
