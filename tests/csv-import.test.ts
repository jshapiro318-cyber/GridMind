import { describe, it, expect } from "vitest";
import { parseCsvUsage } from "../lib/csv-import";

describe("CSV import parser", () => {
  it("parses a minimal date + cost CSV", () => {
    const r = parseCsvUsage("date,cost\n2026-01-01,1234.50\n2026-01-02,2000\n");
    expect(r.error).toBeUndefined();
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].day).toBe("2026-01-01");
    expect(r.rows[0].cost).toBeCloseTo(1234.5, 2);
  });

  it("maps aliased headers and catalog ids", () => {
    const r = parseCsvUsage("usage_date,amount,cloud,location,gpu,hours\n2026-01-01,500,aws,us-east-1,h100,10\n");
    expect(r.rows[0].providerId).toBe("aws");
    expect(r.rows[0].regionId).toBe("us-east-1");
    expect(r.rows[0].gpuId).toBe("h100");
    expect(r.rows[0].gpuHours).toBe(10);
  });

  it("estimates energy & CO2 only when GPU + hours are known", () => {
    const known = parseCsvUsage("date,cost,gpu,gpu_hours,region\n2026-01-01,500,h100,100,us-east-1\n");
    expect(known.rows[0].energyKwh).toBeGreaterThan(0);
    expect(known.rows[0].co2Kg).toBeGreaterThan(0);

    const unknown = parseCsvUsage("date,cost\n2026-01-01,500\n");
    expect(unknown.rows[0].energyKwh).toBe(0);
    expect(unknown.rows[0].gpuId).toBe("unknown");
  });

  it("tolerates utilization given as a percent", () => {
    const r = parseCsvUsage("date,cost,utilization\n2026-01-01,500,73\n");
    expect(r.rows[0].utilization).toBeCloseTo(0.73, 2);
  });

  it("errors when there is no date or cost column", () => {
    const r = parseCsvUsage("foo,bar\n1,2\n");
    expect(r.error).toBeTruthy();
    expect(r.rows).toHaveLength(0);
  });

  it("handles quoted fields containing commas", () => {
    const r = parseCsvUsage('date,cost,project\n2026-01-01,"1,234.50","Team, A"\n');
    expect(r.rows[0].cost).toBeCloseTo(1234.5, 2);
    expect(r.rows[0].projectId).toBe("Team, A");
  });

  it("skips rows with an unparseable date", () => {
    const r = parseCsvUsage("date,cost\nnot-a-date,500\n2026-01-01,500\n");
    expect(r.rows).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });
});
