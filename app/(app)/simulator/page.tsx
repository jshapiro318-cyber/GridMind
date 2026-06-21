import { Simulator } from "@/components/Simulator";
import { getPreferences } from "@/lib/preferences-actions";
import { constraintsFrom } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const prefs = await getPreferences();
  return <Simulator initialGpus={prefs.gpuIds} initialMode={prefs.mode} constraints={constraintsFrom(prefs)} />;
}
