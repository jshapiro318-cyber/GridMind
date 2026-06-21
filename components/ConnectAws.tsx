"use client";

import { useActionState, useState, useTransition } from "react";
import {
  beginAwsConnectAction,
  connectAwsAction,
  disconnectAwsAction,
  type AwsSetup,
  type ConnectResult,
} from "@/lib/connections-actions";

export function ConnectAws() {
  const [setup, setSetup] = useState<AwsSetup | null>(null);
  const [loading, startLoad] = useTransition();
  const [disc, startDisc] = useTransition();
  const [tab, setTab] = useState<"cfn" | "tf">("cfn");
  const [copied, setCopied] = useState(false);
  const [state, action, connecting] = useActionState<ConnectResult | null, FormData>(connectAwsAction, null);

  function begin() {
    startLoad(async () => setSetup(await beginAwsConnectAction()));
  }
  function disconnect() {
    startDisc(async () => {
      await disconnectAwsAction();
      setSetup(await beginAwsConnectAction());
    });
  }
  function copy() {
    if (!setup) return;
    navigator.clipboard?.writeText(tab === "cfn" ? setup.cloudformation : setup.terraform);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!setup) {
    return (
      <div className="card card-pad">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-medium text-ink">Connect your AWS account</span>
          <span className="pill text-leaf">recommended · no access keys</span>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Grant read-only Cost Explorer access with a <b className="text-ink">cross-account role</b> — you create a role
          in your own account that trusts GridMind, scoped to one read action. No keys are shared or stored, and you
          revoke anytime by deleting the role.
        </p>
        <button onClick={begin} disabled={loading} className="btn btn-primary btn-sm mt-3 disabled:opacity-50">
          {loading ? "Preparing…" : "Generate my setup →"}
        </button>
      </div>
    );
  }

  const connected = !!setup.connectedRoleArn;

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-leaf" : "bg-ink-faint/60"}`} />
          <span className="font-medium text-ink">Connect your AWS account</span>
          <span className="pill">read-only · cross-account</span>
        </div>
        {connected && (
          <button onClick={disconnect} disabled={disc} className="btn btn-ghost btn-sm disabled:opacity-50">
            {disc ? "…" : "Disconnect"}
          </button>
        )}
      </div>

      {connected && (
        <div className="mt-3 break-all rounded-lg border border-leaf/30 bg-leaf/10 px-3 py-2 text-xs text-leaf">
          Connected role: <span className="font-mono">{setup.connectedRoleArn}</span>
        </div>
      )}

      {!setup.accountConfigured && (
        <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">
          This deployment hasn&apos;t set <span className="font-mono">GRIDMIND_AWS_ACCOUNT_ID</span> yet — the template
          below uses a placeholder where GridMind&apos;s AWS account id belongs. Set it so a customer&apos;s role trusts
          the right principal.
        </div>
      )}

      {/* Step 1 — create the role */}
      <div className="mt-4">
        <div className="stat-label">Step 1 · Create a read-only role in your AWS account</div>
        <p className="mt-1 text-sm text-ink-muted">
          Deploy this in the AWS account whose spend you want to see. It creates one role granting only{" "}
          <span className="font-mono text-ink">ce:GetCostAndUsage</span>, trusting GridMind under your unique ExternalId.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-ink-faint">Your ExternalId</span>
          <span className="font-mono text-ink">{setup.externalId}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => setTab("cfn")} className={`pill ${tab === "cfn" ? "text-brand" : ""}`}>CloudFormation</button>
          <button type="button" onClick={() => setTab("tf")} className={`pill ${tab === "tf" ? "text-brand" : ""}`}>Terraform</button>
          <button type="button" onClick={copy} className="ml-auto pill hover:text-ink">{copied ? "Copied ✓" : "Copy"}</button>
        </div>
        <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink-muted">{tab === "cfn" ? setup.cloudformation : setup.terraform}</pre>
      </div>

      {/* Step 2 — paste the ARN back */}
      <form action={action} className="mt-4">
        <div className="stat-label">Step 2 · Paste the Role ARN it outputs</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input type="hidden" name="region" value={setup.region} />
          <input
            name="roleArn"
            required
            defaultValue={setup.connectedRoleArn ?? ""}
            placeholder="arn:aws:iam::123456789012:role/GridMindCostReadOnly"
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
        GridMind stores only the role ARN + ExternalId — never a key — and assuming the role needs GridMind&apos;s own AWS
        identity on the deployment. <a href="/security" className="underline underline-offset-2 hover:text-ink-muted">How access works →</a>
      </p>
    </div>
  );
}
