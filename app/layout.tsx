import type { Metadata } from "next";
import { Archivo, Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// Display grotesque for app/UI surfaces (deliberately not the Inter reflex).
const display = Archivo({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["400", "500", "600", "700", "800"] });
// Editorial serif for the landing's big headlines — high-contrast, premium, and
// rare in AI-SaaS. Pairs on a contrast axis with the grotesque + mono.
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · GridMind AI",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["AI compute", "GPU cost optimization", "cloud cost", "GridScore", "AI infrastructure", "carbon-aware routing", "FinOps"],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // og:image is emitted automatically by app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // twitter:image is emitted automatically by app/twitter-image.tsx
  },
  // favicon (app/icon.svg) and apple-icon (app/apple-icon.tsx) are auto-detected
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-bg font-sans antialiased">{children}</body>
    </html>
  );
}
