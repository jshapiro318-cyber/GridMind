"use client";

import Link from "next/link";
import { useActionState } from "react";
import { openBillingPortal, startCheckout, type BillingActionResult } from "@/lib/billing-actions";

type PlanOption = { id: string; name: string; price: string; available: boolean };

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

  const onPaid = plan !== "free" && (status === "active" || status === "trialing");
  const renews = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : null;
  const err = checkout?.error || portal?.error;

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6">
      {/* Current plan */}
      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${onPaid ? "bg-leaf" : "bg-ink-faint"}`} />
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                {onPaid ? `${plans.find((p) => p.id === plan)?.name ?? plan} plan` : "Free / demo"}
              </h2>
              {onPaid && <span className="pill text-leaf">{status}</span>}
            </div>
            <p className="mt-1.5 text-sm text-ink-muted">
              {onPaid
                ? `Your workspace is on a paid plan${renews ? ` · renews ${renews}` : ""}.`
                : "Start your 3-day free trial to unlock your workspace — card required, cancel anytime."}
            </p>
          </div>
          {onPaid && hasCustomer && (
            <form action={portalAction}>
              <button disabled={portalPending} className="btn btn-ghost btn-sm disabled:opacity-50">
                {portalPending ? "Opening…" : "Manage billing"}
              </button>
            </form>
          )}
        </div>

        {checkoutStatus === "success" && (
          <div className="mt-3 rounded-lg border border-leaf/30 bg-leaf/10 px-3 py-2 text-xs text-leaf">Your free trial&rsquo;s started — welcome! <Link href="/get-started" className="underline underline-offset-2">Add your data →</Link></div>
        )}
        {checkoutStatus === "cancel" && (
          <div className="mt-3 rounded-lg border border-line bg-bg px-3 py-2 text-xs text-ink-muted">Checkout canceled — no charge was made.</div>
        )}
        {err && <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">{err}</div>}
        {!configured && (
          <p className="mt-3 text-xs text-ink-faint">
            Billing isn&apos;t enabled on this deployment yet. Set <span className="font-mono text-ink-muted">STRIPE_SECRET_KEY</span> and the plan price ids (see <span className="font-mono text-ink-muted">docs/DEPLOY.md</span>).
          </p>
        )}
        {configured && !signedIn && (
          <p className="mt-3 text-xs text-ink-faint">
            <Link href="/signin" className="text-brand underline underline-offset-2 hover:brightness-110">Sign in</Link> to start your 3-day free trial.
          </p>
        )}
      </div>

      {/* Self-serve plans */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {plans.map((p) => {
          const current = plan === p.id;
          const canBuy = configured && signedIn && p.available && !current;
          return (
            <div key={p.id} className={`card card-pad ${current ? "border-leaf/40" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-ink">{p.name}</h3>
                {current && <span className="pill text-leaf">current</span>}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-ink">{p.price}</div>
              <form action={checkoutAction} className="mt-4">
                <input type="hidden" name="plan" value={p.id} />
                <button
                  disabled={!canBuy || checkoutPending}
                  className="btn btn-primary btn-sm w-full disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {current ? "Current plan" : checkoutPending ? "Starting…" : `Start free trial · ${p.name}`}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[11px] text-ink-faint">
        Business &amp; Enterprise are value-based and sales-led —{" "}
        <a href="mailto:hello@gridmind.ai" className="text-ink-muted underline underline-offset-2 hover:text-ink">talk to us</a>.
        Secure payments by Stripe; we never see your card details.
      </p>
    </div>
  );
}
