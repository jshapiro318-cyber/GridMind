import { describe, it, expect } from "vitest";
import { MODES, bestRoute, candidatesFor, regionPriceFactor, simulateSavings } from "../lib/routing";

const H100 = { gpuId: "h100", gpuCount: 1, hours: 720, mode: "cost" } as const;
const placeKey = (r: { best: { providerId: string; regionId: string } }) => `${r.best.providerId}/${r.best.regionId}`;

describe("routing engine", () => {
  it("exposes exactly the four optimization modes", () => {
    expect(MODES.map((m) => m.id).sort()).toEqual(["balanced", "carbon", "cost", "speed"]);
  });

  it("Lowest Cost picks the cheapest viable H100 placement", () => {
    const c = candidatesFor({ ...H100, mode: "cost" });
    expect(c.length).toBeGreaterThan(0);
    const minCost = Math.min(...c.map((x) => x.monthlyCost));
    expect(c[0].monthlyCost).toBeCloseTo(minCost, 5);
  });

  it("Lowest Carbon picks the greenest (lowest CO2) placement", () => {
    const c = candidatesFor({ ...H100, mode: "carbon" });
    const minCo2 = Math.min(...c.map((x) => x.co2Kg));
    expect(c[0].co2Kg).toBeCloseTo(minCo2, 3);
  });

  it("Fastest picks a lowest-latency placement", () => {
    const c = candidatesFor({ ...H100, mode: "speed" });
    const minLat = Math.min(...c.map((x) => x.latencyMs));
    expect(c[0].latencyMs).toBe(minLat);
  });

  it("Balanced and Lowest Carbon recommend DIFFERENT placements (regression for the mode-collapse bug)", () => {
    const bal = bestRoute({ ...H100, mode: "balanced" });
    const carb = bestRoute({ ...H100, mode: "carbon" });
    expect(bal).not.toBeNull();
    expect(carb).not.toBeNull();
    expect(placeKey(bal!)).not.toEqual(placeKey(carb!));
  });

  it("honours an allowed-providers constraint", () => {
    const c = candidatesFor({ ...H100, mode: "cost" }, { allowedProviders: ["aws"] });
    expect(c.length).toBeGreaterThan(0);
    expect(c.every((x) => x.providerId === "aws")).toBe(true);
  });

  it("clamps regionPriceFactor to [0.82, 1.18]", () => {
    expect(regionPriceFactor(0)).toBeGreaterThanOrEqual(0.82);
    expect(regionPriceFactor(1000)).toBeLessThanOrEqual(1.18);
  });

  it("simulateSavings never returns negative savings vs the default", () => {
    const r = simulateSavings({ monthlySpend: 100_000, gpuIds: ["h100"], providerIds: ["aws"], modelIds: [], mode: "cost" });
    expect(r.optimizedSpend).toBeLessThanOrEqual(r.currentSpend + 1e-6);
    expect(r.savingsUsd).toBeGreaterThanOrEqual(0);
    expect(r.routings.length).toBeGreaterThan(0);
  });
});
