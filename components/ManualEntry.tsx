"use client";

import { useActionState } from "react";
import { saveManualDataAction, type ManualResult } from "@/lib/manual-actions";

const PROVIDERS = [
  ["aws", "AWS"], ["gcp", "GCP"], ["azure", "Azure"], ["coreweave", "CoreWeave"],
  ["lambda", "Lambda"], ["together", "Together"], ["crusoe", "Crusoe"], ["runpod", "RunPod"],
] as const;
const GPUS = [
  ["h100", "NVIDIA H100"], ["h200", "NVIDIA H200"], ["a100-80", "A100 80GB"],
  ["a100-40", "A100 40GB"], ["l40s", "L40S"], ["a10g", "A10G"], ["l4", "L4"],
] as const;

export function ManualEntry() {
  const [state, action, pending] = useActionState<ManualResult | null, FormData>(saveManualDataAction, null);

  return (
    <div className="card card-pad mt-3">
      <div className="flex items-center gap-2.5">
        <span className="stat-label">Quick estimate</span>
        <span className="pill">no file needed</span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        No billing export handy? Tell us your rough monthly spend and main stack — GridMind models your dashboard instantly.
      </p>
      <form action={action} className="mt-3.5 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-ink-faint sm:col-span-1">
          Monthly AI spend
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">$</span>
            <input
              name="monthlySpend"
              inputMode="numeric"
              placeholder="50,000"
              required
              className="w-full rounded-lg border border-line bg-bg py-2 pl-6 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Main provider
          <select name="provider" defaultValue="aws" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none">
            {PROVIDERS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Main GPU
          <select name="gpu" defaultValue="h100" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none">
            {GPUS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <div className="sm:col-span-3">
          <button disabled={pending} className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? "Modeling…" : "See my numbers →"}
          </button>
        </div>
      </form>
      {state && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${state.ok ? "border-leaf/30 bg-leaf/10 text-leaf" : "border-amber/30 bg-amber/10 text-amber"}`}>
          {state.message}
        </div>
      )}
    </div>
  );
}
