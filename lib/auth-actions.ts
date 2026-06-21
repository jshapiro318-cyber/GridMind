"use server";

import { signIn, signOut } from "@/auth";

/** Begin an OAuth sign-in flow, returning to the dashboard on success. */
export async function signInWith(provider: string): Promise<void> {
  await signIn(provider, { redirectTo: "/dashboard" });
}

/** Sign out and return to the public landing page. */
export async function doSignOut(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
