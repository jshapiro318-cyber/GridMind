import { PageSkeleton } from "@/components/Skeletons";

// Shown inside the app shell while a server-rendered view streams in (the app
// pages are dynamic / data-backed). A shimmer skeleton instead of a bare spinner
// so a slow or cold load never reads as a black screen.
export default function Loading() {
  return <PageSkeleton />;
}
