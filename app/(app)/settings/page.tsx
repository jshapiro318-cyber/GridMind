import { getPreferences } from "@/lib/preferences-actions";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const prefs = await getPreferences();
  return <SettingsForm initial={prefs} />;
}
