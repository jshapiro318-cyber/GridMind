import { DashboardSkeleton } from "@/components/Skeletons";

// Tailored skeleton for the heaviest, most-visited view — and the one a new
// customer lands on right after sign-in — so its (cold-start) data load streams
// in behind a matching placeholder instead of a black screen.
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
