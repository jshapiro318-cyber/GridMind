"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SkipLink } from "./SkipLink";
import { AICFO } from "./AICFO";
import { UserMenu, type SessionUser } from "./UserMenu";

type NavItem = { href: string; label: string; short: string; icon: (p: IconProps) => ReactNode };

// Grouped IA: Overview → Optimize → Analytics → Infrastructure → Account.
// Every existing surface is preserved; sections give the platform a clear
// "I always know where to look" hierarchy.
const NAV_GROUPS: { section: string; items: NavItem[] }[] = [
  { section: "Overview", items: [{ href: "/dashboard", label: "Command Center", short: "Overview", icon: GridIcon }] },
  {
    section: "Optimize",
    items: [
      { href: "/routing", label: "AI Routing Center", short: "Routing", icon: RouteIcon },
      { href: "/gridscore", label: "GridScore™", short: "GridScore", icon: GaugeIcon },
      { href: "/simulator", label: "Savings Simulator", short: "Simulator", icon: SparkIcon },
    ],
  },
  { section: "Analytics", items: [{ href: "/budget", label: "Budget & Forecast", short: "Budget", icon: PulseIcon }] },
  {
    section: "Infrastructure",
    items: [
      { href: "/map", label: "Global Compute Map", short: "Map", icon: GlobeIcon },
      { href: "/marketplace", label: "Compute Marketplace", short: "Market", icon: TagIcon },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/integrations", label: "Your data", short: "Data", icon: PlugIcon },
      { href: "/billing", label: "Billing", short: "Billing", icon: CardIcon },
      { href: "/settings", label: "Preferences", short: "Settings", icon: GearIcon },
    ],
  },
];
const NAV_FLAT: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

const TITLES: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Executive Command Center", sub: "Your entire AI business · last 30 days" },
  "/routing": { title: "AI Routing Center", sub: "Deploy optimal workload placement" },
  "/gridscore": { title: "GridScore™", sub: "Your score, the leaderboard & how to improve" },
  "/map": { title: "Global Compute Map", sub: "Live regional cost, carbon & capacity" },
  "/simulator": { title: "Compute Savings Simulator", sub: "Model your optimized spend" },
  "/budget": { title: "AI Budget Intelligence", sub: "Forecasts, waste detection & alerts" },
  "/marketplace": { title: "Compute Marketplace", sub: "Buy, reserve & bid on GPU capacity" },
  "/settings": { title: "Routing Preferences", sub: "Budget, constraints & workload profile" },
  "/integrations": { title: "Your data", sub: "Add your own — CSV, a quick estimate, or connect a cloud" },
  "/get-started": { title: "Get started", sub: "See your savings in under 5 minutes" },
  "/billing": { title: "Billing", sub: "Your plan & payment" },
};

type DataSourceInfo = { source: "live" | "sample"; connected: string[]; syncedAt: string | null };

export function AppShell({ children, dataSource, user, trial }: { children: ReactNode; dataSource?: DataSourceInfo; user?: SessionUser | null; trial?: { daysLeft: number } | null }) {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? { title: "GridMind AI", sub: "AI Compute Intelligence" };
  const live = dataSource?.source === "live";
  const connectedCount = dataSource?.connected.length ?? 0;

  return (
    <>
      <SkipLink />
      <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-line bg-bg-raised/70 px-3 py-5 backdrop-blur lg:flex">
        <Link href="/dashboard" className="mb-7 flex items-center gap-2.5 px-2">
          <Logo />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-ink">GridMind</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand">AI · Compute OS</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.section} className="flex flex-col gap-1">
              <div className="px-3 pb-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint/70">{group.section}</div>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} className={`nav-item ${active ? "nav-item-active" : ""}`}>
                    <item.icon active={active} />
                    <span>{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand shadow-glow" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <Link href="/" className="mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-faint transition-colors hover:text-ink-muted">
          <span>←</span> Back to gridmind.ai
        </Link>

        <Link href="/integrations" className="mt-auto block rounded-lg border border-line bg-bg-card p-3 transition-colors hover:border-line-bright">
          <div className="flex items-center gap-2 text-xs text-ink">
            <span className={`h-2 w-2 rounded-full ${live ? "animate-pulseNode bg-leaf" : "bg-ink-faint"}`} />
            {live ? "Live data connected" : "Running on sample data"}
          </div>
          <div className="mt-1 text-[11px] text-ink-faint">
            {live
              ? `${connectedCount} provider${connectedCount === 1 ? "" : "s"} · read-only · syncing`
              : "Connect a cloud to see real spend →"}
          </div>
        </Link>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-3.5">
          <Link href="/" className="shrink-0 lg:hidden" aria-label="GridMind home">
            <Logo />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-ink">{meta.title}</h1>
            <p className="truncate text-xs text-ink-muted">{meta.sub}</p>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <Link href="/integrations" className="pill" title={live ? `Live data from ${connectedCount} connected provider${connectedCount === 1 ? "" : "s"}` : "Sample data — connect a cloud account to go live"}>
              <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulseNode bg-leaf" : "bg-ink-faint"}`} />
              <span className={live ? "text-leaf" : "text-ink-muted"}>{live ? `Live data · ${connectedCount}` : "Sample data"}</span>
            </Link>
            <UserMenu user={user ?? null} />
          </div>
        </header>

        {/* Mobile nav — the sidebar is hidden below lg */}
        <nav className="flex items-center gap-1.5 overflow-x-auto border-b border-line bg-bg/70 px-4 py-2 backdrop-blur lg:hidden [&::-webkit-scrollbar]:hidden">
          {NAV_FLAT.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-bg-hover text-ink" : "text-ink-muted hover:text-ink"}`}
              >
                <item.icon active={active} />
                {item.short}
              </Link>
            );
          })}
        </nav>

        <main id="main" tabIndex={-1} className="flex-1 px-4 py-5 outline-none sm:px-6 sm:py-6">
          {trial && (
            <Link href="/billing" className="press mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brass/30 bg-brass/[0.07] px-4 py-2.5 transition-colors hover:border-brass/50">
              <span className="flex items-center gap-2 text-sm text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                <span className="font-medium">{trial.daysLeft === 0 ? "Your free trial ends today" : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left in your free trial`}</span>
                <span className="hidden text-ink-muted sm:inline">— add a plan to keep your workspace.</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-brass">Manage billing →</span>
            </Link>
          )}
          {children}
        </main>
      </div>
      </div>
      <AICFO />
    </>
  );
}

function Logo() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 shadow-glow">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <g stroke="#ecb84c" strokeWidth="1.3">
          <path d="M3 7l7-4 7 4-7 4-7-4z" />
          <path d="M3 13l7 4 7-4M3 10l7 4 7-4" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

type IconProps = { active?: boolean };
const ic = (active?: boolean) => (active ? "#ecb84c" : "#b0a594");

function GridIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </g>
    </svg>
  );
}
function GlobeIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4">
        <circle cx="8" cy="8" r="6" />
        <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
      </g>
    </svg>
  );
}
function SparkIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l1.6 4.2 4.4.3-3.4 2.8 1.1 4.4L8 10.9 4.3 13.2l1.1-4.4L2 6l4.4-.3L8 1.5z" stroke={ic(active)} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function PulseIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 8h3l1.5-4 2.5 8 1.5-4h3" stroke={ic(active)} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TagIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4">
        <path d="M2 2h5l7 7-5 5-7-7V2z" />
        <circle cx="5" cy="5" r="1" />
      </g>
    </svg>
  );
}
function RouteIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4" strokeLinecap="round">
        <circle cx="3.5" cy="3.5" r="1.6" />
        <circle cx="12.5" cy="12.5" r="1.6" />
        <path d="M3.5 5v3a3 3 0 0 0 3 3h3" />
        <path d="M9.5 8.5L12 11l2.5-2.5" opacity="0.6" />
      </g>
    </svg>
  );
}
function GaugeIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4" strokeLinecap="round">
        <path d="M2.5 12a6 6 0 1 1 11 0" />
        <path d="M8 12l3-3.5" />
      </g>
    </svg>
  );
}
function GearIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4" strokeLinejoin="round">
        <circle cx="8" cy="8" r="2.2" />
        <path d="M8 1.4v1.8M8 12.8v1.8M14.6 8h-1.8M3.2 8H1.4M12.7 3.3l-1.3 1.3M4.6 11.4l-1.3 1.3M12.7 12.7l-1.3-1.3M4.6 4.6L3.3 3.3" />
      </g>
    </svg>
  );
}

function PlugIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 9.5 4.7 6.2a2.4 2.4 0 0 1 0-3.4l.3-.3a2.4 2.4 0 0 1 3.4 0L11.7 5.8a2.4 2.4 0 0 1 0 3.4l-.3.3a2.4 2.4 0 0 1-3.4 0Z" />
        <path d="M9.5 6.5 11.5 4.5M6.5 9.5 4 12M10 10l2 2" />
      </g>
    </svg>
  );
}

function CardIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g stroke={ic(active)} strokeWidth="1.4" strokeLinejoin="round">
        <rect x="1.8" y="3.6" width="12.4" height="8.8" rx="1.6" />
        <path d="M1.8 6.4h12.4" strokeLinecap="round" />
        <path d="M4.2 9.6h2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
