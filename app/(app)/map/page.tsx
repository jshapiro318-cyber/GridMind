import { REGIONS, project } from "@/lib/catalog";
import { getRegionUsage } from "@/lib/data";
import { ComputeMap } from "@/components/ComputeMap";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const usage = await getRegionUsage();
  const nodes = REGIONS.map((r) => {
    const u = usage.find((x) => x.regionId === r.id);
    const p = project(r.lat, r.lon);
    return {
      id: r.id,
      name: r.name,
      city: r.city,
      country: r.country,
      x: p.x,
      y: p.y,
      electricityCents: r.electricityCents,
      carbon: r.carbon,
      renewablePct: r.renewablePct,
      latencyMs: r.latencyMs,
      availability: r.availability,
      pue: r.pue,
      cost: u?.cost ?? 0,
      gpuHours: u?.gpuHours ?? 0,
      co2: u?.co2Kg ?? 0,
      energy: u?.energyKwh ?? 0,
    };
  });
  return <ComputeMap nodes={nodes} />;
}
