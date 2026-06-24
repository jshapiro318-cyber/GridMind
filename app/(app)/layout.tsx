import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { ensureFreshData, getDataSource } from "@/lib/sync";
import { auth, authConfigured } from "@/auth";
import { stripeConfigured } from "@/lib/stripe";
import { getSubscription, isActive } from "@/lib/billing";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const sub = await getSubscription();

  // Paywall — enforced ONLY once both sign-in and billing are configured, so the
  // app never locks before the operator sets up Auth + Stripe. Signed-out → sign
  // in; signed-in without an active subscription or trial → /billing to start one.
  // /billing stays reachable so an unsubscribed user can actually subscribe.
  if (authConfigured && stripeConfigured) {
    if (!session?.user) redirect("/signin");
    if (!isActive(sub)) {
      const pathname = (await headers()).get("x-pathname") ?? "";
      if (pathname !== "/billing") redirect("/billing");
    }
  }

  // Pull/refresh real data if a provider is connected (throttled, no-op otherwise).
  await ensureFreshData();
  const ds = await getDataSource();
  const user = session?.user
    ? { name: session.user.name, email: session.user.email, image: session.user.image }
    : null;
  const trial = sub.status === "trialing" && sub.currentPeriodEnd
    ? { daysLeft: Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86_400_000)) }
    : null;
  return (
    <div className="app-backdrop min-h-screen">
      <AppShell dataSource={{ source: ds.source, connected: ds.connected, syncedAt: ds.syncedAt }} user={user} trial={trial}>
        {children}
      </AppShell>
    </div>
  );
}
