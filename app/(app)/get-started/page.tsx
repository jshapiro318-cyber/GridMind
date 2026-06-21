import Link from "next/link";
import { getDataSource } from "@/lib/sync";
import { GetStarted } from "@/components/GetStarted";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get started · GridMind" };

export default async function GetStartedPage() {
  const dataSource = await getDataSource();
  const live = dataSource.source === "live";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">First value · under 5 minutes</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">See your own savings</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        Upload a billing CSV and GridMind shows you exactly where your AI-compute spend is leaking and the cheapest place
        to run each workload. No cloud credentials, no sign-up, and nothing moves without you — it&apos;s read-only and it
        only recommends. <Link href="/security" className="text-brand underline underline-offset-2 hover:brightness-110">How we handle your data →</Link>
      </p>

      {live && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-leaf/30 bg-leaf/[0.05] px-4 py-3">
          <span className="text-sm text-ink-muted">
            <span className="font-medium text-ink">Your data&apos;s already loaded.</span> Re-upload below to replace it, or jump back in.
          </span>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Open your dashboard →</Link>
        </div>
      )}

      <div className="mt-8">
        <GetStarted />
      </div>

      <div className="mt-8 rounded-xl border border-line bg-bg-card/40 p-5">
        <div className="stat-label">What you&apos;ll see</div>
        <ul className="mt-3 grid gap-2.5 text-sm text-ink-muted sm:grid-cols-2">
          <li className="flex items-start gap-2"><span className="mt-0.5 text-brand">→</span> Total spend, by provider, model and team</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 text-brand">→</span> Your GridScore™ and how much it can improve</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 text-brand">→</span> A routing plan: the cheapest viable placement per workload</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 text-brand">→</span> Estimated monthly and annual savings</li>
        </ul>
      </div>
    </div>
  );
}
