import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import type { ReactNode } from "react";

type PublicPageLayoutProps = {
  children: ReactNode;
};

export default function PublicPageLayout({ children }: PublicPageLayoutProps) {
  return (
    <div className="homepage-shell-gradient min-h-screen overflow-x-hidden bg-homepage-shell text-homepage-ink">
      <LandingNav />
      <main className="pt-28 pb-16">{children}</main>
      <LandingFooter />
    </div>
  );
}
