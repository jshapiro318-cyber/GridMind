"use client";

import { useActionState } from "react";
import { importCsvAction, type CsvImportResult } from "@/lib/csv-actions";

export function CsvImport() {
  const [state, action, pending] = useActionState<CsvImportResult | null, FormData>(importCsvAction, null);

  return (
    <div className="card card-pad mt-4">
      <div className="flex items-center gap-2.5">
        <span className="stat-label">Import a CSV</span>
        <span className="pill">your data</span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Drop a billing or usage export — only a <span className="font-mono text-ink">date</span> and{" "}
        <span className="font-mono text-ink">cost</span> column are required. Provider, region, GPU,{" "}
        <span className="font-mono text-ink">gpu_hours</span>, team and project are used when present. Replaces this
        workspace&apos;s data; the public demo is never touched.
      </p>
      <form action={action} className="mt-3.5 flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="max-w-full text-sm text-ink-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-bg-hover file:px-3 file:py-1.5 file:text-ink hover:file:brightness-110"
        />
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-40">
          {pending ? "Importing…" : "Import CSV"}
        </button>
      </form>
      {state && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${state.ok ? "border-leaf/30 bg-leaf/10 text-leaf" : "border-amber/30 bg-amber/10 text-amber"}`}>
          {state.message}
        </div>
      )}
    </div>
  );
}
