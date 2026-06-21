import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseCsvUsage } from "../lib/csv-import";

// The downloadable sample at public/sample-billing.csv is the "first value in
// 5 minutes" on-ramp — if it stops parsing into usable, place-able rows, the
// whole get-started flow silently degrades. Guard the contract here.
const csv = readFileSync(new URL("../public/sample-billing.csv", import.meta.url), "utf8");

describe("sample-billing.csv", () => {
  const parsed = parseCsvUsage(csv);

  it("parses without error into many rows", () => {
    expect(parsed.error).toBeUndefined();
    expect(parsed.rows.length).toBeGreaterThanOrEqual(30);
    expect(parsed.skipped).toBe(0);
  });

  it("carries the columns that unlock placement savings (gpu, region, hours)", () => {
    const placeable = parsed.rows.filter((r) => r.gpuId !== "unknown" && r.regionId !== "unknown" && r.gpuHours > 0);
    // Nearly every row should be fully place-able so the savings math actually engages.
    expect(placeable.length).toBeGreaterThanOrEqual(parsed.rows.length - 1);
  });

  it("has real spend and tagged teams/projects for the breakdowns", () => {
    expect(parsed.rows.reduce((s, r) => s + r.cost, 0)).toBeGreaterThan(0);
    expect(parsed.rows.some((r) => r.team !== "untagged")).toBe(true);
    expect(parsed.rows.some((r) => r.projectId !== "untagged")).toBe(true);
  });
});
