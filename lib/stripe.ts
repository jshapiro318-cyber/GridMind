import "server-only";
import Stripe from "stripe";

// ─────────────────────────────────────────────────────────────────────────────
// Stripe — self-serve subscriptions for the flat tiers (Startup, Growth).
// Env-gated: with no STRIPE_SECRET_KEY the app still builds/runs and billing
// shows a "not configured" state. The value-based tiers (Business/Enterprise)
// are sales-led, not self-serve checkout.
// ─────────────────────────────────────────────────────────────────────────────

export const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = stripeConfigured
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string)
  : null;

export type PlanId = "startup" | "growth";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  priceId: string | undefined; // Stripe Price id from env
}

/** Self-serve plans and the Stripe Price ids that back them. */
export const PLANS: Plan[] = [
  { id: "startup", name: "Startup", price: "$99/mo", priceId: process.env.STRIPE_PRICE_STARTUP },
  { id: "growth", name: "Growth", price: "$499/mo", priceId: process.env.STRIPE_PRICE_GROWTH },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Map a Stripe Price id back to our plan id (used by the webhook). */
export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  return (PLANS.find((p) => p.priceId === priceId)?.id as PlanId) ?? null;
}
