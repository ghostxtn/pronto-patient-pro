import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LandingNav() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50"
      style={{
        backgroundColor: useTransform(navBg, (v) =>
          `hsl(222 47% 11% / ${0.4 + v * 0.5})`
        ),
        backdropFilter: useTransform(navBg, (v) => `blur(${v * 24}px)`),
        borderBottom: useTransform(navBg, (v) =>
          `1px solid hsl(220 20% 100% / ${v * 0.06})`
        ),
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <motion.div
            className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-primary)" }}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Stethoscope className="h-5 w-5 text-white" />
          </motion.div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            MediBook
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "#specializations", label: t.navSpecializations },
            { href: "#how-it-works", label: t.navHowItWorks },
            { href: "#testimonials", label: t.navTestimonials },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/50 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" asChild className="text-sm text-white/70 hover:text-white hover:bg-white/10">
            <Link to="/auth">{t.signIn}</Link>
          </Button>
          <Button asChild className="rounded-lg px-5 text-sm bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg shadow-white/10">
            <Link to="/auth?tab=signup">{t.getStarted}</Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
