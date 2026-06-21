"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importCsvAction, type CsvImportResult } from "@/lib/csv-actions";

const STEPS = [
  { n: 1, t: "Export your billing", d: "Any CSV with a date and a cost works — AWS Cost Explorer, a GCP/Azure export, or your own spreadsheet." },
  { n: 2, t: "Upload it here", d: "It loads into a private workspace just for you. The shared demo is never touched and nothing is shared." },
  { n: 3, t: "See your savings", d: "Get your spend, your GridScore, and the cheapest place to run each workload — in under five minutes." },
];

export function GetStarted() {
  const [state, action, pending] = useActionState<CsvImportResult | null, FormData>(importCsvAction, null);
  const done = state?.ok === true;

  return (
    <div className="flex flex-col gap-6">
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => {
          const cleared = done && s.n < 3;
          return (
            <li key={s.n} className={`rounded-xl border p-4 ${cleared ? "border-leaf/30 bg-leaf/[0.05]" : "border-line bg-bg-card/50"}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${cleared ? "bg-leaf text-bg" : "bg-brand/15 text-brand"}`}>
                  {cleared ? "✓" : s.n}
                </span>
                <span className="text-sm font-semibold text-ink">{s.t}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{s.d}</p>
            </li>
          );
        })}
      </ol>

      {!done ? (
        <div className="card card-pad">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="stat-label">Upload your billing CSV</span>
              <span className="pill">date + cost required</span>
            </div>
            <a href="/sample-billing.csv" download className="text-xs font-medium text-brand underline-offset-2 hover:underline">
              Download a sample CSV ↓
            </a>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Required: <Mono>date</Mono> and <Mono>cost</Mono>. Recommended for savings:{" "}
            <Mono>provider</Mono>, <Mono>region</Mono>, <Mono>gpu</Mono>, <Mono>gpu_hours</Mono> — that&apos;s what lets
            GridMind find a cheaper place to run each workload. <Mono>team</Mono> and <Mono>project</Mono> unlock
            chargeback. Headers are matched loosely (e.g. <Mono>amount</Mono> → cost).
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
              {pending ? "Analyzing…" : "Analyze my spend →"}
            </button>
          </form>
          {state && state.ok === false && (
            <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">{state.message}</div>
          )}
          <p className="mt-3 text-[11px] text-ink-faint">
            Prefer not to upload? <Link href="/dashboard" className="underline underline-offset-2 hover:text-ink-muted">Explore the sample data</Link> instead, or{" "}
            <Link href="/integrations" className="underline underline-offset-2 hover:text-ink-muted">enter a few numbers by hand</Link>.
          </p>
        </div>
      ) : (
        <div className="card card-pad border-leaf/30 bg-leaf/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-leaf">✓</span>
            <span className="text-sm font-semibold text-ink">
              Analyzed {state!.rows.toLocaleString()} {state!.rows === 1 ? "row" : "rows"} of your spend
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Your private workspace is ready. Your dashboard now shows your real numbers — your spend, your GridScore, and
            exactly where you&apos;re overpaying.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/dashboard?imported=${state!.rows}`} className="btn btn-primary">See your savings →</Link>
            <Link href="/routing" className="btn btn-ghost">See the routing plan</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[0.92em] text-ink">{children}</span>;
}
