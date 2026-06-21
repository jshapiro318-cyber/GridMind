import { getDataSource } from "@/lib/sync";
import { IntegrationsPanel } from "@/components/IntegrationsPanel";

// Always reflect the current connection/sync state, never a cached snapshot.
export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const ds = await getDataSource();
  return (
    <IntegrationsPanel
      source={ds.source}
      syncedAt={ds.syncedAt}
      connected={ds.connected}
      providers={ds.providers}
    />
  );
}
