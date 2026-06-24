import { Landing } from "@/components/Landing";
import { authConfigured } from "@/auth";
import { stripeConfigured } from "@/lib/stripe";

export default function MarketingHome() {
  // When sign-in + billing are live, the app is gated behind a trial — so the
  // landing sells the trial instead of an open demo.
  return <Landing gated={authConfigured && stripeConfigured} />;
}
