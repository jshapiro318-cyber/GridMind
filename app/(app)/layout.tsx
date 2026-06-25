import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { PageSkeleton } from "@/components/Skeletons";
import type { SessionUser } from "@/components/UserMenu";
import { ensureFreshData, getDataSource } from "@/lib/sync";
import { auth, authConfigured } from "@/auth";
import { stripeConfigured } from "@/lib/stripe";
import { getSubscription, isActive } from "@/lib/billing";

type Trial = { daysLeft: number } | null;

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

  const user: SessionUser | null = session?.user
    ? { name: session.user.name, email: session.user.email, image: session.user.image }
    : null;
  const trial: Trial = sub.status === "trialing" && sub.currentPeriodEnd
    ? { daysLeft: Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86_400_000)) }
    : null;

  // Render the shell immediately and stream the data-source status in behind a
  // skeleton. ensureFreshData()/getDataSource() can be slow on a cold start, and
  // blocking the whole layout on them paints only the dark body — a black screen.
  return (
    <div className="app-backdrop min-h-screen">
      <Suspense
        fallback={
          <AppShell dataSource={{ source: "sample", connected: [], syncedAt: null }} user={user} trial={trial}>
            <PageSkeleton />
          </AppShell>
        }
      >
        <ShellWithData user={user} trial={trial}>{children}</ShellWithData>
      </Suspense>
    </div>
  );
}

/** Resolves the (potentially slow) data-source status, then renders the shell. */
async function ShellWithData({ user, trial, children }: { user: SessionUser | null; trial: Trial; children: React.ReactNode }) {
  // Pull/refresh real data if a provider is connected (throttled, no-op otherwise).
  await ensureFreshData();
  const ds = await getDataSource();
  return (
    <AppShell dataSource={{ source: ds.source, connected: ds.connected, syncedAt: ds.syncedAt }} user={user} trial={trial}>
      {children}
    </AppShell>
  );
}
