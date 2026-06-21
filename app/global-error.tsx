"use client";

// Catches errors thrown in the root layout itself — renders its own <html>/<body>
// with inline styles so it works even if the app stylesheet failed to load.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e1318",
          color: "#ece4d8",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#b0a594", marginTop: "0.6rem", lineHeight: 1.6 }}>
            An unexpected error occurred. You can try again.
            {error.digest ? <span style={{ display: "block", fontSize: "0.7rem", color: "#8b8174", marginTop: "0.5rem", fontFamily: "monospace" }}>ref: {error.digest}</span> : null}
          </p>
          <button
            onClick={() => reset()}
            style={{ marginTop: "1.6rem", border: "none", borderRadius: 8, background: "#ecb84c", color: "#0e1318", padding: "0.6rem 1.4rem", fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
