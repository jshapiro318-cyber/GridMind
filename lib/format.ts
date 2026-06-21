// Display formatters. Kept dependency-free so they work on server and client.

export function usd(n: number, opts: { compact?: boolean; cents?: boolean } = {}): string {
  if (opts.compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(n);
}

export function num(n: number, frac = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  }).format(n);
}

export function compact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function pct(n: number, frac = 0): string {
  return `${n >= 0 ? "" : ""}${n.toFixed(frac)}%`;
}

export function signedPct(n: number, frac = 1): string {
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(frac)}%`;
}

/** Tonnes of CO₂ from kilograms, with sensible units. */
export function co2(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg)} kg`;
}

export function kwh(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} GWh`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)} MWh`;
  return `${Math.round(n)} kWh`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
