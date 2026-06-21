import { NextResponse } from "next/server";
import { client } from "@/lib/db";

// Liveness/readiness probe for uptime monitoring & load balancers. Verifies DB
// connectivity without side effects (no schema init / seed). 200 = healthy,
// 503 = degraded.
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let db: "ok" | "error" = "ok";
  try {
    await client().execute("SELECT 1 AS ok");
  } catch {
    db = "error";
  }
  const healthy = db === "ok";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      db,
      uptimeMs: Math.round(process.uptime() * 1000),
      latencyMs: Date.now() - started,
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
