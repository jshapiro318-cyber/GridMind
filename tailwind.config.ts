import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GridMind "Furnace" palette
        // Warm graphite body; molten FLAME as the bold primary (your compute,
        // running hot), MINT as the functional "optimized / saved" signal, GOLD
        // as the warm value accent. A committed warm system — deliberately the
        // opposite of cool steel-blue, and not a single-accent-on-black cliché.
        bg: {
          deep: "#080706", // deepest layer — letterboxing & footer
          DEFAULT: "#0f0c0a", // warm graphite
          raised: "#181310",
          card: "#1e1813",
          hover: "#281f18",
        },
        line: {
          DEFAULT: "#342a20",
          soft: "#241d16",
          bright: "#4b3a2b",
        },
        ink: {
          bright: "#faf5ee",
          DEFAULT: "#ece4d8",
          muted: "#b0a594", // warm gray
          faint: "#8b8174", // warm gray — 5.1:1 on bg (AA pass)
        },
        brand: {
          DEFAULT: "#ecb84c", // gold — the professional primary (10.7:1 on bg)
          dim: "#a8842f",
          bright: "#f2cf6e",
        },
        brass: "#ffd97a", // luminous champagne — value / savings highlight
        ember: "#ff6a3d", // heat — used sparingly for "hot / cost / burn" moments
        electric: "#ff9a5c",
        amber: "#e8a33c",
        rose: "#ff5d5d",
        violet: "#b08cff",
        leaf: "#3fe39a", // mint — the "optimized / cooled" signal
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(236,184,76,0.16), 0 0 26px -8px rgba(236,184,76,0.3)",
        "glow-lg": "0 0 0 1px rgba(236,184,76,0.2), 0 18px 60px -18px rgba(236,184,76,0.45)",
        "glow-brass": "0 0 0 1px rgba(255,180,62,0.22), 0 18px 60px -18px rgba(255,180,62,0.4)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.7)",
        // Layered elevation scale (design-system tokens)
        e1: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 6px 18px -10px rgba(0,0,0,0.6)",
        e2: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 18px 48px -20px rgba(0,0,0,0.75)",
        e3: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 40px 90px -30px rgba(0,0,0,0.85)",
      },
      transitionTimingFunction: {
        ek: "cubic-bezier(0.23, 1, 0.32, 1)",
        "ek-inout": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        sheen: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
        "radial-brand": "radial-gradient(60% 60% at 50% 0%, rgba(236,184,76,0.18), transparent 70%)",
      },
      keyframes: {
        pulseNode: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.12)" },
        },
        dash: {
          to: { strokeDashoffset: "-1000" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        gradientPan: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.06)" },
        },
      },
      animation: {
        pulseNode: "pulseNode 3s ease-in-out infinite",
        dash: "dash 22s linear infinite",
        riseIn: "riseIn 0.5s ease-out both",
        shimmer: "shimmer 6s ease-in-out infinite",
        floaty: "floaty 7s ease-in-out infinite",
        gradientPan: "gradientPan 8s ease-in-out infinite",
        breathe: "breathe 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
