"use client";

import Link from "next/link";
import { useActionState } from "react";
import { openBillingPortal, startCheckout, type BillingActionResult } from "@/lib/billing-actions";

type PlanOption = { id: string; name: string; price: string; available: boolean };

// Presentation for each self-serve plan — positioning + what's included.
const PLAN_META: Record<string, { amount: string; per: string; tagline: string; features: string[]; recommended?: boolean }> = {
  startup: {
    amount: "$99",
    per: "/mo",
    tagline: "One team getting its AI-compute spend under control.",
    features: ["Unified cost dashboard", "Up to 3 cloud providers", "30-day spend history", "GridScore + routing plan"],
  },
  growth: {
    amount: "$499",
    per: "/mo",
    tagline: "Optimizing across every cloud and GPU, with alerts.",
    features: ["Everything in Startup", "All 8 providers", "Live AI routing + GridScore", "CSV & cloud-connect import", "Anomaly detection"],
    recommended: true,
  },
};

export function BillingPanel({
  configured,
  signedIn,
  plan,
  status,
  hasCustomer,
  currentPeriodEnd,
  plans,
  checkoutStatus,
}: {
  configured: boolean;
  signedIn: boolean;
  plan: string;
  status: string;
  hasCustomer: boolean;
  currentPeriodEnd: string | null;
  plans: PlanOption[];
  checkoutStatus: string | null;
}) {
  const [checkout, checkoutAction, checkoutPending] = useActionState<BillingActionResult | null, FormData>(startCheckout, null);
  const [portal, portalAction, portalPending] = useActionState<BillingActionResult | null, FormData>(openBillingPortal, null);

  const trialing = status === "trialing";
  const onPaid = plan !== "free" && (status === "active" || trialing);
  const renews = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const daysLeft = trialing && currentPeriodEnd ? Math.max(0, Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / 86_400_000)) : null;
  const err = checkout?.error || portal?.error;
  const currentName = plans.find((p) => p.id === plan)?.name ?? "your plan";

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 sm:px-6 sm:py-12">
      {/* ── State header ─────────────────────────────────────────── */}
      {onPaid ? (
        <section className="card card-pad">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${trialing ? "bg-brass" : "bg-leaf"}`} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight text-ink">{currentName} plan</h1>
                  <span className={`pill ${trialing ? "text-brass" : "text-leaf"}`}>{trialing ? "Free trial" : "Active"}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {trialing
                    ? `${daysLeft === 0 ? "Your trial ends today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial`}${renews ? ` — your card is charged ${renews} unless you cancel.` : "."}`
                    : renews
                      ? `Renews ${renews}.`
                      : "Your workspace is on a paid plan."}
                </p>
              </div>
            </div>
            {hasCustomer && (
              <form action={portalAction}>
                <button disabled={portalPending} className="btn btn-ghost btn-sm disabled:opacity-50">
                  {portalPending ? "Opening…" : "Manage billing"}
                </button>
              </form>
            )}
          </div>
        </section>
      ) : (
        <header className="max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[2rem] sm:leading-[1.15]">Start your free trial</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            Pick a plan and get the full app on your own data — free for 3 days. We ask for a card so you can keep going,
            but you&rsquo;re not charged until the trial ends, and you can cancel anytime.
          </p>
        </header>
      )}

      {/* ── Status messages ──────────────────────────────────────── */}
      {(checkoutStatus === "success" || checkoutStatus === "cancel" || err || !configured || (configured && !signedIn)) && (
        <div className="mt-5 flex flex-col gap-2">
          {checkoutStatus === "success" && (
            <Banner tone="leaf">
              Your free trial&rsquo;s started — welcome!{" "}
              <Link href="/get-started" className="font-medium underline underline-offset-2">Add your data →</Link>
            </Banner>
          )}
          {checkoutStatus === "cancel" && <Banner tone="muted">Checkout canceled — no charge was made.</Banner>}
          {err && <Banner tone="amber">{err}</Banner>}
          {!configured && (
            <Banner tone="muted">
              Billing isn&rsquo;t enabled on this deployment yet. Set <code className="rounded bg-bg px-1 font-mono text-ink-muted">STRIPE_SECRET_KEY</code> and the plan price ids — see <code className="rounded bg-bg px-1 font-mono text-ink-muted">docs/DEPLOY.md</code>.
            </Banner>
          )}
          {configured && !signedIn && (
            <Banner tone="muted">
              <Link href="/signin" className="text-brand underline underline-offset-2 hover:brightness-110">Sign in</Link> to start your 3-day free trial.
            </Banner>
          )}
        </div>
      )}

      {/* ── Plan cards ───────────────────────────────────────────── */}
      <div className="mt-7 grid items-start gap-4 md:grid-cols-2">
        {plans.map((p) => {
          const meta = PLAN_META[p.id];
          const current = plan === p.id;
          const rec = !!meta?.recommended;
          // Already paying → plan changes go through the Stripe portal (proration),
          // not a second checkout. Unpaid → checkout starts the trial.
          const usePortal = onPaid && !current;
          const canAct = current ? false : usePortal ? configured && signedIn && hasCustomer : configured && signedIn && p.available;
          const pending = checkoutPending || portalPending;
          const label = current ? "Current plan" : pending ? "Working…" : usePortal ? "Switch plan" : "Start 3-day free trial";

          return (
            <div
              key={p.id}
              className={`lift relative flex flex-col rounded-2xl border p-6 ${rec ? "border-brand/45 bg-bg-card shadow-glow" : "border-line bg-bg-card/70"}`}
            >
              {rec && (
                <span className="absolute -top-2.5 right-5 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
                  Most popular
                </span>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink">{p.name}</h2>
                {current && <span className="pill text-leaf">current</span>}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="tnum text-[2.6rem] font-semibold leading-none tracking-tight text-ink">{meta?.amount ?? p.price}</span>
                <span className="text-sm text-ink-faint">{meta?.per ?? ""}</span>
              </div>
              <p className="mt-2 text-[12.5px] text-ink-faint">{onPaid ? "billed monthly" : "free for 3 days, then billed monthly"}</p>

              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{meta?.tagline}</p>

              <ul className="mt-4 flex flex-col gap-2.5">
                {meta?.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <svg viewBox="0 0 16 16" className="mt-[3px] h-3.5 w-3.5 shrink-0 text-leaf" fill="none" aria-hidden="true">
                      <path d="M3 8.4l3 3 7-7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <form action={usePortal ? portalAction : checkoutAction} className="mt-6 flex flex-col">
                {!usePortal && <input type="hidden" name="plan" value={p.id} />}
                <button
                  disabled={!canAct || pending}
                  className={`press w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-[transform,filter,background-color,border-color] duration-200 disabled:cursor-not-allowed ${
                    current
                      ? "cursor-default border border-line bg-transparent text-ink-faint"
                      : rec
                        ? "bg-brand text-bg shadow-glow hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
                        : "border border-line-bright bg-bg-hover text-ink hover:border-brand/40 disabled:opacity-40"
                  }`}
                >
                  {label}
                </button>
                {!current && !onPaid && (
                  <span className="mt-2 text-center text-[11px] text-ink-faint">then {p.price} · cancel anytime</span>
                )}
              </form>
            </div>
          );
        })}
      </div>

      {/* ── Trust strip ──────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-line bg-bg-raised/60 px-5 py-3.5">
        <div className="flex items-center gap-2 text-[13px] text-ink-muted">
          <LockIcon />
          Payments secured by <span className="font-medium text-ink">Stripe</span> · cancel anytime
        </div>
        <CardBrands />
      </div>

      {/* ── Sales-led tiers ──────────────────────────────────────── */}
      <p className="mt-6 text-center text-sm text-ink-muted">
        Need team chargeback, SSO, or volume pricing?{" "}
        <a href="mailto:hello@gridmind.ai" className="font-medium text-brand underline underline-offset-2 hover:brightness-110">Talk to sales →</a>
      </p>
    </div>
  );
}

function Banner({ tone, children }: { tone: "leaf" | "amber" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "leaf"
      ? "border-leaf/30 bg-leaf/10 text-leaf"
      : tone === "amber"
        ? "border-amber/30 bg-amber/10 text-amber"
        : "border-line bg-bg-raised/60 text-ink-muted";
  return <div className={`rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${cls}`}>{children}</div>;
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ink-faint" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="6.4" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.4 7V5.4a2.6 2.6 0 0 1 5.2 0V7" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

// Recognizable card marks on light tiles — the standard checkout trust signal.
function CardBrands() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Accepted cards">
      <span className="flex h-6 w-[38px] items-center justify-center rounded-[5px] bg-white">
        <span className="text-[10px] font-extrabold italic leading-none tracking-tight text-[#1a1f71]">VISA</span>
      </span>
      <span className="flex h-6 w-[38px] items-center justify-center rounded-[5px] bg-white">
        <svg viewBox="0 0 34 20" className="h-[15px]" aria-hidden="true">
          <circle cx="14" cy="10" r="6.6" fill="#eb001b" />
          <circle cx="20" cy="10" r="6.6" fill="#f79e1b" fillOpacity="0.92" />
        </svg>
      </span>
      <span className="flex h-6 w-[38px] items-center justify-center rounded-[5px] bg-[#1f72cd]">
        <span className="text-[8.5px] font-bold leading-none tracking-tight text-white">AMEX</span>
      </span>
    </div>
  );
}
