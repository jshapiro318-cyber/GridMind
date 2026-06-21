import { ImageResponse } from "next/og";

export const alt = "GridMind AI — the operating system for AI compute";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded OG card, rendered at build/request time — consistent with the dark
// "terminal" identity (steel + brass on near-black).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f0c0a",
          padding: "72px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: -140, right: -120, width: 560, height: 560, borderRadius: 9999, backgroundImage: "radial-gradient(circle, rgba(236,184,76,0.32), rgba(236,184,76,0))", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -180, left: -120, width: 560, height: 560, borderRadius: 9999, backgroundImage: "radial-gradient(circle, rgba(255,180,62,0.20), rgba(255,180,62,0))", display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 56, height: 56, borderRadius: 14, border: "1px solid rgba(236,184,76,0.4)", backgroundColor: "rgba(236,184,76,0.12)", alignItems: "center", justifyContent: "center" }}>
            <svg width="34" height="34" viewBox="0 0 20 20" fill="none">
              <g stroke="#ecb84c" strokeWidth="1.3">
                <path d="M3 7l7-4 7 4-7 4-7-4z" />
                <path d="M3 13l7 4 7-4M3 10l7 4 7-4" opacity="0.5" />
              </g>
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#ece4d8" }}>GridMind</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: "#ece4d8", letterSpacing: -2, lineHeight: 1.04 }}>The operating system</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.04 }}>
            <span style={{ color: "#ece4d8" }}>for </span>
            <span style={{ color: "#ecb84c" }}>&nbsp;AI compute.</span>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 28, color: "#b0a594" }}>Optimize, route, and cut the cost of AI workloads across every cloud.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16, fontSize: 22, color: "#8b8174" }}>
            <span>8 providers</span>
            <span style={{ color: "#342a20" }}>·</span>
            <span>13 regions</span>
            <span style={{ color: "#342a20" }}>·</span>
            <span style={{ color: "#ffd97a" }}>GridScore™</span>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#b0a594" }}>gridmind.ai</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
