"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { DEMO_ORG } from "./db";
import { getCurrentOrgId } from "./tenant";
import { getSubscriptionFor } from "./billing";
import { planById, stripe, stripeConfigured } from "./stripe";
import { SITE_URL } from "./site";
import { captureError } from "./observability";

export interface BillingActionResult {
  error?: string;
}

async function baseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    /* fall through */
  }
  return SITE_URL;
}

/** Begin a Stripe Checkout for a self-serve plan. Requires a signed-in org. */
export async function startCheckout(_prev: BillingActionResult | null, formData: FormData): Promise<BillingActionResult> {
  if (!stripeConfigured || !stripe) return { error: "Billing isn't enabled on this deployment yet." };
  const plan = planById(String(formData.get("plan") ?? ""));
  if (!plan?.priceId) return { error: "That plan isn't available for self-serve checkout." };

  const orgId = await getCurrentOrgId();
  if (orgId === DEMO_ORG) return { error: "Sign in to subscribe." };

  let url: string;
  try {
    const session = await auth();
    const sub = await getSubscriptionFor(orgId);
    const base = await baseUrl();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      // 3-day free trial: card captured now, first charge after 3 days. Cancel
      // anytime in the trial and you're never billed.
      subscription_data: { trial_period_days: 3 },
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${base}/billing?status=success`,
      cancel_url: `${base}/billing?status=cancel`,
      client_reference_id: orgId,
      customer: sub.stripeCustomerId ?? undefined,
      customer_email: sub.stripeCustomerId ? undefined : session?.user?.email ?? undefined,
      metadata: { orgId, plan: plan.id },
      allow_promotion_codes: true,
    });
    if (!checkout.url) return { error: "Could not start checkout — please try again." };
    url = checkout.url;
  } catch (e) {
    captureError(e, { where: "startCheckout", plan: plan.id });
    // Surface Stripe's actual message — it pinpoints config issues (wrong price
    // id, test/live mode mismatch) instead of a generic "try again".
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Checkout error: ${msg}` };
  }
  redirect(url); // to Stripe-hosted checkout
}

/** Open the Stripe customer portal to manage/cancel an existing subscription. */
export async function openBillingPortal(_prev: BillingActionResult | null, _formData: FormData): Promise<BillingActionResult> {
  if (!stripeConfigured || !stripe) return { error: "Billing isn't enabled on this deployment yet." };
  const orgId = await getCurrentOrgId();
  if (orgId === DEMO_ORG) return { error: "Sign in first." };
  const sub = await getSubscriptionFor(orgId);
  if (!sub.stripeCustomerId) return { error: "No billing account yet — subscribe to a plan first." };

  let url: string;
  try {
    const base = await baseUrl();
    const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${base}/billing` });
    url = portal.url;
  } catch (e) {
    captureError(e, { where: "openBillingPortal" });
    return { error: "Could not open the billing portal — please try again." };
  }
  redirect(url);
}
