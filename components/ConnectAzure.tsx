"use client";

import { useActionState, useState, useTransition } from "react";
import {
  beginAzureConnectAction,
  connectAzureAction,
  disconnectAzureAction,
  type AzureSetup,
} from "@/lib/azure-connect-actions";
import type { ConnectResult } from "@/lib/connections-actions";
import { azureConsentUrl, azureRoleCommand } from "@/lib/azure-template";

export function ConnectAzure() {
  const [setup, setSetup] = useState<AzureSetup | null>(null);
  const [loading, startLoad] = useTransition();
  const [disc, startDisc] = useTransition();
  const [tenantId, setTenantId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, action, connecting] = useActionState<ConnectResult | null, FormData>(connectAzureAction, null);

  function begin() {
    startLoad(async () => {
      const s = await beginAzureConnectAction();
      setSetup(s);
      setTenantId(s.tenantId);
      setSubscriptionId(s.subscriptionId);
    });
  }
  function disconnect() {
    startDisc(async () => {
      await disconnectAzureAction();
      const s = await beginAzureConnectAction();
      setSetup(s);
      setTenantId(s.tenantId);
      setSubscriptionId(s.subscriptionId);
    });
  }

  if (!setup) {
    return (
      <div className="card card-pad">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-medium text-ink">Connect your Azure subscription</span>
          <span className="pill text-leaf">recommended · no secret</span>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Grant read-only Cost Management access with an <b className="text-ink">admin-consented app</b> — your admin
          consents to GridMind&apos;s app in your tenant and assigns it one read-only role. No secret is shared or stored,
          and you revoke anytime by removing the role assignment.
        </p>
        <button onClick={begin} disabled={loading} className="btn btn-primary btn-sm mt-3 disabled:opacity-50">
          {loading ? "Preparing…" : "Generate my setup →"}
        </button>
      </div>
    );
  }

  // Recompute the consent URL + role command live from what the admin types, using
  // GridMind's own client id — placeholders show through until both are filled in.
  const consentUrl = azureConsentUrl(setup.clientId, tenantId);
  const roleCommand = azureRoleCommand(setup.clientId, subscriptionId);

  function copy() {
    navigator.clipboard?.writeText(roleCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const connected = !!setup.connectedSubscription;

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-leaf" : "bg-ink-faint/60"}`} />
          <span className="font-medium text-ink">Connect your Azure subscription</span>
          <span className="pill">read-only · cross-tenant</span>
        </div>
        {connected && (
          <button onClick={disconnect} disabled={disc} className="btn btn-ghost btn-sm disabled:opacity-50">
            {disc ? "…" : "Disconnect"}
          </button>
        )}
      </div>

      {connected && (
        <div className="mt-3 break-all rounded-lg border border-leaf/30 bg-leaf/10 px-3 py-2 text-xs text-leaf">
          Connected subscription: <span className="font-mono">{setup.connectedSubscription}</span>
        </div>
      )}

      {!setup.clientConfigured && (
        <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">
          This deployment hasn&apos;t set <span className="font-mono">AZURE_CLIENT_ID</span> yet — the links and command
          below use a placeholder where GridMind&apos;s app (client) id belongs. Set it so your admin consents to the
          right app.
        </div>
      )}

      {/* Step 1 — enter ids, then consent + assign the role */}
      <form action={action} className="mt-4">
        <div className="stat-label">Step 1 · Enter your tenant + subscription ids</div>
        <p className="mt-1 text-sm text-ink-muted">
          GridMind reads spend with its own app — your admin just consents to it and grants it{" "}
          <span className="font-mono text-ink">Cost Management Reader</span> on this subscription. The consent link and
          command below fill in from the ids you enter.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            name="tenantId"
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="tenant id · 00000000-0000-0000-0000-000000000000"
            className="min-w-[300px] flex-1 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
          <input
            name="subscriptionId"
            required
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            placeholder="subscription id · 00000000-0000-0000-0000-000000000000"
            className="min-w-[300px] flex-1 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-ink-faint">Admin-consent URL</span>
          <a href={consentUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-brand underline underline-offset-2 hover:text-ink">{consentUrl}</a>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="pill">Assign the role</span>
          <button type="button" onClick={copy} className="ml-auto pill hover:text-ink">{copied ? "Copied ✓" : "Copy"}</button>
        </div>
        <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink-muted">{roleCommand}</pre>

        <div className="mt-4 stat-label">Step 2 · Connect &amp; sync</div>
        <div className="mt-2">
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
        GridMind stores only your tenant + subscription ids — never a secret — and reading your spend needs GridMind&apos;s
        own AZURE_CLIENT_ID/AZURE_CLIENT_SECRET on the deployment.{" "}
        <a href="/security" className="underline underline-offset-2 hover:text-ink-muted">How access works →</a>
      </p>
    </div>
  );
}
