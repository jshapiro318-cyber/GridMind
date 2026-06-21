import { DEMO_ORG } from "@/lib/db";
import { getSubscription } from "@/lib/billing";
import { getCurrentOrgId } from "@/lib/tenant";
import { PLANS, stripeConfigured } from "@/lib/stripe";
import { BillingPanel } from "@/components/BillingPanel";

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [sp, sub, orgId] = await Promise.all([searchParams, getSubscription(), getCurrentOrgId()]);
  return (
    <BillingPanel
      configured={stripeConfigured}
      signedIn={orgId !== DEMO_ORG}
      plan={sub.plan}
      status={sub.status}
      hasCustomer={!!sub.stripeCustomerId}
      currentPeriodEnd={sub.currentPeriodEnd}
      plans={PLANS.map((p) => ({ id: p.id, name: p.name, price: p.price, available: !!p.priceId }))}
      checkoutStatus={sp?.status ?? null}
    />
  );
}
