"use client";

import { useActionState, useState, useTransition } from "react";
import {
  beginGcpConnectAction,
  connectGcpAction,
  disconnectGcpAction,
  type GcpSetup,
} from "@/lib/gcp-connect-actions";
import { type ConnectResult } from "@/lib/connections-actions";

export function ConnectGcp() {
  const [setup, setSetup] = useState<GcpSetup | null>(null);
  const [loading, startLoad] = useTransition();
  const [disc, startDisc] = useTransition();
  const [copied, setCopied] = useState(false);
  const [state, action, connecting] = useActionState<ConnectResult | null, FormData>(connectGcpAction, null);

  function begin() {
    startLoad(async () => setSetup(await beginGcpConnectAction()));
  }
  function disconnect() {
    startDisc(async () => {
      await disconnectGcpAction();
      setSetup(await beginGcpConnectAction());
    });
  }
  function copy() {
    if (!setup) return;
    navigator.clipboard?.writeText(setup.grantCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!setup) {
    return (
      <div className="card card-pad">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-medium text-ink">Connect your Google Cloud account</span>
          <span className="pill text-leaf">recommended · no service-account key</span>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Grant read-only access to your <b className="text-ink">BigQuery billing export</b> — you grant GridMind&apos;s
          own service account two read roles in your own project, scoped to your billing dataset. No key is shared or
          stored, and you revoke anytime by removing the IAM binding.
        </p>
        <button onClick={begin} disabled={loading} className="btn btn-primary btn-sm mt-3 disabled:opacity-50">
          {loading ? "Preparing…" : "Generate my setup →"}
        </button>
      </div>
    );
  }

  const connected = !!setup.connectedTable;

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-leaf" : "bg-ink-faint/60"}`} />
          <span className="font-medium text-ink">Connect your Google Cloud account</span>
          <span className="pill">read-only · billing export</span>
        </div>
        {connected && (
          <button onClick={disconnect} disabled={disc} className="btn btn-ghost btn-sm disabled:opacity-50">
            {disc ? "…" : "Disconnect"}
          </button>
        )}
      </div>

      {connected && (
        <div className="mt-3 break-all rounded-lg border border-leaf/30 bg-leaf/10 px-3 py-2 text-xs text-leaf">
          Connected table: <span className="font-mono">{setup.connectedTable}</span>
        </div>
      )}

      {!setup.saConfigured && (
        <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">
          This deployment hasn&apos;t set <span className="font-mono">GCP_SA_EMAIL</span> yet — the commands below use a
          placeholder where GridMind&apos;s service-account email belongs. Set it so a customer grants the right
          identity.
        </div>
      )}

      {/* Step 1 — grant the service account read access */}
      <div className="mt-4">
        <div className="stat-label">Step 1 · Grant read access in your GCP project</div>
        <p className="mt-1 text-sm text-ink-muted">
          Run this in the project that owns your billing export. It grants GridMind&apos;s service account only{" "}
          <span className="font-mono text-ink">roles/bigquery.dataViewer</span> +{" "}
          <span className="font-mono text-ink">roles/bigquery.jobUser</span> — read your export, run the query, nothing
          else.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-ink-faint">GridMind service account</span>
          <span className="font-mono text-ink">{setup.saEmail || "—"}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={copy} className="ml-auto pill hover:text-ink">{copied ? "Copied ✓" : "Copy"}</button>
        </div>
        <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink-muted">{setup.grantCommands}</pre>
      </div>

      {/* Step 2 — point GridMind at your project + table */}
      <form action={action} className="mt-4">
        <div className="stat-label">Step 2 · Your project id + billing-export table</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            name="project"
            required
            defaultValue={setup.project}
            placeholder="my-gcp-project"
            className="min-w-[220px] flex-1 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
          <input
            name="table"
            required
            defaultValue={setup.connectedTable ?? ""}
            placeholder="myproj.billing.gcp_billing_export_v1_0123AB"
            className="min-w-[300px] flex-1 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
          <button disabled={connecting} className="btn btn-primary btn-sm disabled:opacity-50">
            {connecting ? "Connecting…" : connected ? "Reconnect & sync" : "Connect & sync"}
          </button>
        </div>
        {state && (
          <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${state.ok ? "border-leaf/30 bg-leaf/10 text-leaf" : "border-amber/30 bg-amber/10 text-amber"}`}>
            {state.message}
          </div>
        )}
      </form>

      <p className="mt-3 text-[11px] text-ink-faint">
        GridMind stores only your project + table — never a key — and reading your export needs GridMind&apos;s own GCP
        service-account identity on the deployment. <a href="/security" className="underline underline-offset-2 hover:text-ink-muted">How access works →</a>
      </p>
    </div>
  );
}
