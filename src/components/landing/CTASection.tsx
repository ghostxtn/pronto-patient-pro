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
    <section className="py-20" ref={ref}>
      <div className="container">
        <motion.div
          className="rounded-3xl p-12 md:p-20 text-center relative overflow-hidden"
          style={{ background: "var(--gradient-primary)" }}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Animated blobs */}
          <motion.div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10"
            animate={{ scale: [1, 1.3, 1], x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5"
            animate={{ scale: [1.2, 1, 1.2], x: [0, -10, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent)]" />

          <div className="relative z-10">
            <motion.h2
              className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-5 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {t.ctaTitle}
            </motion.h2>
            <motion.p
              className="text-primary-foreground/75 max-w-lg mx-auto mb-10 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t.ctaDesc}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="group rounded-full px-10 h-13 text-base font-semibold shadow-elevated"
              >
                <Link to="/auth?tab=signup">
                  {t.createAccount}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
