// Shared site identity — used by metadata, robots, sitemap, and OG images.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gridmind.ai").replace(/\/$/, "");
export const SITE_NAME = "GridMind AI";
export const SITE_TITLE = "GridMind AI — The Operating System for AI Compute";
export const SITE_DESCRIPTION =
  "GridMind is the intelligence layer for global AI infrastructure. Optimize, route, and cut the cost of AI workloads across every cloud and GPU provider.";

// Public routes worth surfacing to crawlers.
export const PUBLIC_ROUTES = ["/", "/gpu-prices", "/dashboard", "/routing", "/gridscore", "/map", "/simulator", "/budget", "/marketplace", "/security", "/privacy", "/terms"];
