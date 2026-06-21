"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgId } from "./tenant";
import { DEMO_ORG, setMeta } from "./db";
import { ingest } from "./sync";
import { parseCsvUsage } from "./csv-import";
import { rateLimit } from "./rate-limit";

const MAX_ROWS = 250_000;

export interface CsvImportResult {
  ok: boolean;
  rows: number;
  message: string;
}

/** Parse an uploaded CSV and replace the signed-in org's usage with it. */
export async function importCsvAction(_prev: CsvImportResult | null, formData: FormData): Promise<CsvImportResult> {
  const org = await getCurrentOrgId();
  if (org === DEMO_ORG) {
    return { ok: false, rows: 0, message: "Sign in to import your own data — the demo workspace stays on sample data." };
  }
  if (!(await rateLimit("csv", 10, 60_000))) {
    return { ok: false, rows: 0, message: "Too many imports — please wait a minute and try again." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, rows: 0, message: "Choose a CSV file to import." };
  }
  if (file.size > 8_000_000) {
    return { ok: false, rows: 0, message: "That file is over 8 MB — trim it or split it first." };
  }

  const parsed = parseCsvUsage(await file.text());
  if (parsed.error) return { ok: false, rows: 0, message: parsed.error };
  if (parsed.rows.length === 0) {
    return { ok: false, rows: 0, message: "No usable rows found — every row needs at least a valid date and a cost." };
  }
  if (parsed.rows.length > MAX_ROWS) {
    return { ok: false, rows: 0, message: `Too many rows (${parsed.rows.length.toLocaleString()}). Max ${MAX_ROWS.toLocaleString()} — pre-aggregate to daily totals first.` };
  }

  await ingest(org, parsed.rows);
  await Promise.all([
    setMeta(org, "source", "live"),
    setMeta(org, "connected", JSON.stringify(["CSV import"])),
    setMeta(org, "synced_at", new Date().toISOString()),
  ]);
  revalidatePath("/", "layout");
  return {
    ok: true,
    rows: parsed.rows.length,
    message: `Imported ${parsed.rows.length.toLocaleString()} rows${parsed.skipped ? ` (${parsed.skipped} skipped)` : ""}. Your dashboard now reflects your data.`,
  };
}
