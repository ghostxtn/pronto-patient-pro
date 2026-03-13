import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LandingNav() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 100], [0, 1]);
  const navBlur = useTransform(scrollY, [0, 100], [0, 20]);

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50 border-b"
      style={{
        backgroundColor: useTransform(navBg, (v) => `hsl(var(--card) / ${0.6 + v * 0.3})`),
        backdropFilter: useTransform(navBlur, (v) => `blur(${v}px)`),
        borderColor: useTransform(navBg, (v) => `hsl(var(--border) / ${v * 0.6})`),
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <motion.div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)" }}
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="font-display text-xl font-bold tracking-tight">MediBook</span>
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
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" asChild className="text-sm">
            <Link to="/auth">{t.signIn}</Link>
          </Button>
          <Button asChild className="rounded-full px-6 shadow-soft text-sm">
            <Link to="/auth?tab=signup">{t.getStarted}</Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
