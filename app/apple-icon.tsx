import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Opaque apple-touch icon (iOS masks the corners itself).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f0c0a" }}>
        <svg width="118" height="118" viewBox="0 0 20 20" fill="none">
          <g stroke="#ecb84c" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M3 7l7-4 7 4-7 4-7-4z" />
            <path d="M3 13l7 4 7-4M3 10l7 4 7-4" opacity="0.5" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
