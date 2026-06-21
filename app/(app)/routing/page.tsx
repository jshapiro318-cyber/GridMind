import { getCurrentAllocation, getRecommendedAllocation, type Allocation } from "@/lib/routingcenter";
import type { Mode } from "@/lib/routing";
import { getPreferences } from "@/lib/preferences-actions";
import { constraintsFrom, hasActiveConstraints } from "@/lib/preferences";
import { RoutingCenter } from "@/components/RoutingCenter";

export const dynamic = "force-dynamic";

const MODE_IDS: Mode[] = ["cost", "speed", "carbon", "balanced"];

export default async function RoutingPage() {
  const prefs = await getPreferences();
  const constraints = constraintsFrom(prefs);
  const [current, recEntries] = await Promise.all([
    getCurrentAllocation(),
    Promise.all(MODE_IDS.map(async (m) => [m, await getRecommendedAllocation(m, constraints)] as const)),
  ]);
  const recommended = Object.fromEntries(recEntries) as Record<Mode, Allocation>;
  return (
    <RoutingCenter
      current={current}
      recommended={recommended}
      defaultMode={prefs.mode}
      constrained={hasActiveConstraints(prefs)}
    />
  );
}
