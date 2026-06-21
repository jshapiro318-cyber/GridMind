import { describe, it, expect } from "vitest";
import { blendScores, gradeOf, scorePlacement, scoreProvider } from "../lib/gridscore";

describe("gridscore", () => {
  it("scores a placement 0–100 with a grade and a full breakdown", () => {
    const s = scorePlacement("aws", "us-east-1");
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
    expect(typeof s.grade).toBe("string");
    for (const k of ["cost", "carbon", "latency", "reliability"] as const) {
      expect(s.breakdown).toHaveProperty(k);
    }
  });

  it("a green region beats a dirty one on the carbon axis", () => {
    const green = scorePlacement("crusoe", "ca-central"); // Montréal ~31 gCO2/kWh
    const dirty = scorePlacement("aws", "ap-south-1"); // Mumbai ~708 gCO2/kWh
    expect(green.breakdown.carbon).toBeGreaterThan(dirty.breakdown.carbon);
  });

  it("returns a zeroed score for an invalid placement", () => {
    const s = scorePlacement("nope", "nowhere");
    expect(s.score).toBe(0);
    expect(s.grade).toBe("F");
  });

  it("blendScores produces a valid blended score", () => {
    const b = blendScores([
      { weight: 1, score: scorePlacement("aws", "us-east-1") },
      { weight: 2, score: scorePlacement("lambda", "us-west-2") },
    ]);
    expect(b.score).toBeGreaterThanOrEqual(0);
    expect(b.score).toBeLessThanOrEqual(100);
  });

  it("gradeOf maps extremes sensibly", () => {
    expect(gradeOf(96)).toMatch(/A/);
    expect(gradeOf(5)).toBe("F");
  });

  it("scoreProvider returns a positive score for a known provider", () => {
    expect(scoreProvider("coreweave").score).toBeGreaterThan(0);
  });
});
