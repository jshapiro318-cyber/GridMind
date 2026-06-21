import { AppShell } from "@/components/AppShell";
import { ensureFreshData, getDataSource } from "@/lib/sync";
import { auth } from "@/auth";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // If real provider credentials are configured, pull/refresh real data (throttled,
  // no-op when nothing is connected). Then the shell shows the true data source.
  await ensureFreshData();
  const ds = await getDataSource();
  // Public demo stays accessible signed-out (user = null); when signed in the
  // shell shows the account menu. Per-org data scoping arrives in the next pass.
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, email: session.user.email, image: session.user.image }
    : null;
  return (
    <div className="app-backdrop min-h-screen">
      <AppShell dataSource={{ source: ds.source, connected: ds.connected, syncedAt: ds.syncedAt }} user={user}>
        {children}
      </AppShell>
    </div>
  );
}
