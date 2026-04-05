import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type PublicPageLayoutProps = {
  children: ReactNode;
};

export default function PublicPageLayout({ children }: PublicPageLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="homepage-shell-gradient min-h-screen overflow-x-hidden bg-homepage-shell text-homepage-ink"
    >
      <LandingNav />
      <main className="pt-28 pb-16">{children}</main>
      <LandingFooter />
    </motion.div>
  );
}
