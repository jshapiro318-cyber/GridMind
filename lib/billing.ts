import "server-only";
import { exec, q1 } from "./db";
import { getCurrentOrgId } from "./tenant";

export interface Subscription {
  orgId: string;
  plan: string; // 'free' | 'startup' | 'growth'
  status: string; // 'active' | 'past_due' | 'canceled' | 'inactive'
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
}

const FREE: Omit<Subscription, "orgId"> = {
  plan: "free",
  status: "inactive",
  stripeCustomerId: null,
  currentPeriodEnd: null,
};

/** The current org's subscription (defaults to free). */
export async function getSubscription(): Promise<Subscription> {
  const orgId = await getCurrentOrgId();
  return getSubscriptionFor(orgId);
}

export async function getSubscriptionFor(orgId: string): Promise<Subscription> {
  const row = await q1<{ plan: string; status: string; stripe_customer_id: string | null; current_period_end: string | null }>(
    "SELECT plan, status, stripe_customer_id, current_period_end FROM subscriptions WHERE org_id = ?",
    [orgId]
  );
  if (!row) return { orgId, ...FREE };
  return {
    orgId,
    plan: row.plan,
    status: row.status,
    stripeCustomerId: row.stripe_customer_id,
    currentPeriodEnd: row.current_period_end,
  };
}

/** True when the org has a live paid plan. */
export function isActive(sub: Subscription): boolean {
  return sub.plan !== "free" && (sub.status === "active" || sub.status === "trialing");
}

export async function upsertSubscription(s: {
  orgId: string;
  plan: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
}): Promise<void> {
  await exec(
    `INSERT INTO subscriptions (org_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(org_id) DO UPDATE SET
       plan = excluded.plan,
       status = excluded.status,
       stripe_customer_id = COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
       stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
       current_period_end = excluded.current_period_end,
       updated_at = excluded.updated_at`,
    [s.orgId, s.plan, s.status, s.stripeCustomerId ?? null, s.stripeSubscriptionId ?? null, s.currentPeriodEnd ?? null, new Date().toISOString()]
  );
}

/** Find the org that owns a Stripe customer (used by subscription webhooks). */
export async function orgForCustomer(customerId: string): Promise<string | null> {
  const row = await q1<{ org_id: string }>("SELECT org_id FROM subscriptions WHERE stripe_customer_id = ?", [customerId]);
  return row?.org_id ?? null;
}
