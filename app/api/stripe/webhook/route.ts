import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { planForPriceId, stripe, stripeConfigured } from "@/lib/stripe";
import { orgForCustomer, upsertSubscription } from "@/lib/billing";
import { captureError } from "@/lib/observability";

export const dynamic = "force-dynamic";

// Stripe → us. Verifies the signature, then records subscription state per org.
export async function POST(req: Request): Promise<Response> {
  if (!stripeConfigured || !stripe) return NextResponse.json({ error: "billing disabled" }, { status: 503 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook secret not set" }, { status: 500 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orgId = s.metadata?.orgId || s.client_reference_id || null;
        if (orgId) {
          await upsertSubscription({
            orgId,
            plan: s.metadata?.plan || "startup",
            status: "active",
            stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null,
            stripeSubscriptionId: typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null,
            currentPeriodEnd: null,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const orgId = await orgForCustomer(customerId);
          if (orgId) {
            const active = sub.status === "active" || sub.status === "trialing";
            const priceId = sub.items?.data?.[0]?.price?.id;
            const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
            await upsertSubscription({
              orgId,
              plan: active ? planForPriceId(priceId) ?? "startup" : "free",
              status: sub.status,
              stripeCustomerId: customerId,
              stripeSubscriptionId: sub.id,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            });
          }
        }
        break;
      }
    }
  } catch (e) {
    // Ack with 200 so Stripe doesn't retry-storm; the error is logged centrally.
    captureError(e, { where: "stripe.webhook", type: event.type });
    return NextResponse.json({ received: true, handled: false });
  }

  return NextResponse.json({ received: true });
}
