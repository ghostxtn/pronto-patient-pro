import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CTASection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-16 bg-background" ref={ref}>
      <div className="container">
        <motion.div
          className="rounded-2xl p-12 md:p-16 relative overflow-hidden"
          style={{ background: "hsl(222 47% 11%)" }}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Subtle gradient accent */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full opacity-20"
            style={{ background: "radial-gradient(ellipse at 100% 0%, hsl(221 83% 53% / 0.3), transparent 70%)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                {t.ctaTitle}
              </h2>
              <p className="text-white/45 mt-3 leading-relaxed">
                {t.ctaDesc}
              </p>
            </div>
            <div className="shrink-0">
              <Button
                size="lg"
                asChild
                className="group rounded-lg px-7 h-12 text-sm bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg shadow-white/10"
              >
                <Link to="/auth?tab=signup">
                  {t.createAccount}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
