"use client";

import { useEffect, useState, useTransition } from "react";
import { resetToSampleAction, syncNowAction } from "@/lib/integrations-actions";
import { CsvImport } from "./CsvImport";
import { ManualEntry } from "./ManualEntry";
import { ConnectAws } from "./ConnectAws";

type ProviderStatus = { id: string; label: string; configured: boolean; mode: "read-only"; detail: string };
type SyncOutcome = { ok: boolean; rows: number; connected: string[]; message: string };

// Exact env vars + the read-only grant each provider needs. Shown so the user
// can wire credentials themselves — GridMind never sees or stores them.
const SETUP: Record<string, { vars: string[]; scope: string; note: string }> = {
  aws: {
    vars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION  (optional)", "GRIDMIND_AWS_TEAM_TAG  (optional)"],
    scope: "IAM policy granting only ce:GetCostAndUsage — Cost Explorer, read-only",
    note: "Per-team breakdown needs a cost-allocation tag; set GRIDMIND_AWS_TEAM_TAG to its key.",
  },
  azure: {
    vars: ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET", "AZURE_SUBSCRIPTION_ID"],
    scope: "“Cost Management Reader” role on the subscription — read-only",
    note: "Register an app, then assign Cost Management Reader at the subscription scope.",
  },
  gcp: {
    vars: ["GCP_PROJECT_ID", "GCP_SA_EMAIL", "GCP_SA_PRIVATE_KEY", "GCP_BILLING_TABLE"],
    scope: "Service account with BigQuery Data Viewer + Job User on the billing-export dataset",
    note: "Enable Cloud Billing export to BigQuery first; point GCP_BILLING_TABLE at that table.",
  },
  neocloud: {
    vars: ["GRIDMIND_NEOCLOUD_FEEDS"],
    scope: "A read-only cost-feed URL (+ optional API key) per provider",
    note: 'JSON array, e.g. [{"id":"coreweave","providerId":"coreweave","url":"https://…","key":"…"}]',
  },
};

export function IntegrationsPanel({
  source,
  syncedAt,
  connected,
  providers,
}: {
  source: "live" | "sample";
  syncedAt: string | null;
  connected: string[];
  providers: ProviderStatus[];
}) {
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<SyncOutcome | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const live = source === "live";
  const configuredCount = providers.filter((p) => p.configured).length;

  function sync() {
    setOutcome(null);
    startTransition(async () => {
      const r = await syncNowAction();
      setOutcome({ ok: r.ok, rows: r.rows, connected: r.connected, message: r.message });
    });
  }
  function reset() {
    setOutcome(null);
    startTransition(async () => {
      await resetToSampleAction();
    });
  }

  const when = mounted && syncedAt ? new Date(syncedAt).toLocaleString() : null;

  return (
    <div className="mx-auto max-w-[920px] px-4 py-6 sm:px-6">
      {/* Status header */}
      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${live ? "animate-pulseNode bg-leaf" : "bg-ink-faint"}`} />
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                {live ? "Live data" : "Sample data"}
              </h2>
              <span className="pill">read-only</span>
            </div>
            <p className="mt-1.5 text-sm text-ink-muted">
              {live
                ? `Your dashboard is showing real spend from ${connected.length} connected cloud${connected.length === 1 ? "" : "s"}.`
                : "Your dashboard is showing a built-in sample fleet. Connect a cloud to see your own numbers."}
              {when && <span className="text-ink-faint"> · last synced {when}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={sync} disabled={pending || configuredCount === 0} className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-40">
              {pending ? "Syncing…" : "Sync now"}
            </button>
            {live && (
              <button onClick={reset} disabled={pending} className="btn btn-ghost btn-sm disabled:opacity-40">
                Reset to sample
              </button>
            )}
          </div>
        </div>

        {configuredCount === 0 && (
          <p className="mt-3 text-xs text-ink-faint">
            No credentials detected in your environment yet. Add any provider below, then restart the server and hit
            {" "}<span className="text-ink-muted">Sync now</span>.
          </p>
        )}
        {outcome && (
          <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${outcome.ok ? "border-leaf/30 bg-leaf/10 text-leaf" : "border-amber/30 bg-amber/10 text-amber"}`}>
            {outcome.message}
          </div>
        )}
      </div>

      {/* What it does / doesn't do — the honest contract */}
      <div className="card card-pad mt-4">
        <div className="stat-label">What GridMind does with access</div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {[
            ["does", "Reads billing & usage — spend by day, region & GPU type"],
            ["does", "Recommends savings — you decide what to act on"],
            ["dont", "Never launches, stops, drains, or bids on anything"],
            ["dont", "Never moves money or changes your cloud configuration"],
            ["does", "Estimates energy & carbon from each region’s grid intensity"],
            ["dont", "Never sees your credentials — they stay in your environment"],
          ].map(([kind, text], i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 ${kind === "does" ? "text-leaf" : "text-ink-faint"}`}>{kind === "does" ? "✓" : "✕"}</span>
              <span className={kind === "does" ? "text-ink-muted" : "text-ink-faint"}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add your data — no sign-up needed (CSV or a quick manual estimate) */}
      <div className="mt-7 flex items-center gap-2.5">
        <h3 className="text-base font-semibold tracking-tight text-ink">Add your data</h3>
        <span className="pill text-leaf">no sign-up</span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">It loads into a private workspace just for you — the shared demo is never touched.</p>
      <CsvImport />
      <ManualEntry />

      {/* Connect a cloud (read-only) */}
      <div className="mt-7 mb-1">
        <h3 className="text-base font-semibold tracking-tight text-ink">Or connect a cloud</h3>
        <p className="mt-1 text-sm text-ink-muted">Read-only billing access. Connect your AWS account with a cross-account role (no keys), or set environment credentials for a self-hosted deployment.</p>
      </div>
      <div className="mb-4"><ConnectAws /></div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Self-hosted · set credentials in your environment</p>
      <div className="grid gap-3">
        {providers.map((p) => {
          const setup = SETUP[p.id];
          const isLoaded = connected.includes(p.id);
          return (
            <div key={p.id} className="card card-pad">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${p.configured ? "bg-leaf" : "bg-ink-faint/60"}`} />
                  <span className="font-medium text-ink">{p.label}</span>
                  <span className="pill">read-only</span>
                </div>
                <span className={`text-xs font-medium ${p.configured ? "text-leaf" : "text-ink-faint"}`}>
                  {isLoaded ? "Connected · data loaded" : p.configured ? "Configured" : "Not connected"}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{p.detail}</p>

              {setup && (
                <details className="group mt-3">
                  <summary className="cursor-pointer list-none text-xs text-ink-faint transition-colors hover:text-ink-muted">
                    <span className="group-open:hidden">Show setup ▾</span>
                    <span className="hidden group-open:inline">Hide setup ▴</span>
                  </summary>
                  <div className="mt-2.5 rounded-lg border border-line bg-bg p-3">
                    <div className="stat-label">Environment variables</div>
                    <ul className="mt-1.5 space-y-1">
                      {setup.vars.map((v) => (
                        <li key={v} className="font-mono text-[12px] text-ink-muted">{v}</li>
                      ))}
                    </ul>
                    <div className="stat-label mt-3">Read-only access to grant</div>
                    <p className="mt-1 text-[12px] text-ink-muted">{setup.scope}</p>
                    <p className="mt-2 text-[11px] text-ink-faint">{setup.note}</p>
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[11px] text-ink-faint">
        Set credentials in <span className="font-mono text-ink-muted">.env.local</span> (see{" "}
        <span className="font-mono text-ink-muted">.env.example</span>), restart, then Sync now. Data refreshes
        automatically every 6 hours while a provider stays connected.
      </p>
    </div>
  );
}
