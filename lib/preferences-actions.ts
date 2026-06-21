"use server";

// Server actions for reading and persisting user preferences. Preferences live
// in a first-party cookie (no auth yet → scoped per browser); server components
// read them at render time and the Settings form writes them through here. When
// real auth lands, only this file changes — swap the cookie for a per-user row.

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_PREFERENCES,
  PREFS_COOKIE,
  normalizePreferences,
  type Preferences,
} from "./preferences";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Read the caller's preferences, falling back to defaults. Safe in any server component. */
export async function getPreferences(): Promise<Preferences> {
  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Persist preferences and refresh every personalized (dynamic) view. */
export async function savePreferences(prefs: Preferences): Promise<Preferences> {
  const clean = normalizePreferences(prefs);
  const store = await cookies();
  store.set(PREFS_COOKIE, JSON.stringify(clean), {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return clean;
}

/** Clear preferences back to the defaults. */
export async function resetPreferences(): Promise<Preferences> {
  const store = await cookies();
  store.delete(PREFS_COOKIE);
  revalidatePath("/", "layout");
  return DEFAULT_PREFERENCES;
}
