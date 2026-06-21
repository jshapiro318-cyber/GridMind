import { SkipLink } from "@/components/SkipLink";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
