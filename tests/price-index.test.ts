import { describe, it, expect } from "vitest";
import { priceIndex, cellRate, bestRate } from "../lib/price-index";

const index = priceIndex();
const byId = (id: string) => index.find((r) => r.gpu.id === id);

describe("gpu price index", () => {
  it("returns rows only for GPUs offered by at least two providers", () => {
    expect(index.length).toBeGreaterThan(0);
    for (const row of index) expect(row.rates.length).toBeGreaterThanOrEqual(2);
  });

  it("excludes GPUs no provider offers (e.g. MI300X)", () => {
    expect(byId("mi300x")).toBeUndefined();
  });

  it("sorts each row cheapest-first and keeps min/max/cheapest consistent", () => {
    for (const row of index) {
      for (let i = 1; i < row.rates.length; i++) {
        expect(row.rates[i].rate).toBeGreaterThanOrEqual(row.rates[i - 1].rate);
      }
      expect(row.cheapest.rate).toBeCloseTo(row.min, 6);
      expect(row.rates[0].rate).toBeCloseTo(row.min, 6);
      expect(row.rates[row.rates.length - 1].rate).toBeCloseTo(row.max, 6);
      expect(row.spreadX).toBeGreaterThan(1);
    }
  });

  it("H100 spans all eight providers; cheapest is a neocloud, priciest a hyperscaler", () => {
    const h100 = byId("h100");
    expect(h100).toBeDefined();
    expect(h100!.rates.length).toBe(8);
    expect(h100!.cheapest.kind).toBe("neocloud");
    expect(h100!.rates[h100!.rates.length - 1].kind).toBe("hyperscaler");
    expect(h100!.spreadX).toBeGreaterThan(1.3);
  });

  it("cellRate returns a positive number when offered and null when not", () => {
    expect(cellRate("h100", "runpod")).toBeGreaterThan(0);
    expect(cellRate("l4", "azure")).toBeNull(); // Azure doesn't list the L4
    expect(bestRate("mi300x", "aws")).toBeNull();
  });
});
