import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AnimatedCounter from "./AnimatedCounter";

export default function HeroSection() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const stats = [
    { value: "15+", label: t.expertDoctors },
    { value: "10000+", label: t.happyPatients },
    { value: "8", label: t.specializations },
    { value: "98%", label: t.satisfactionRate },
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "hsl(222 47% 11%)" }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(220 20% 100% / 0.05) 1px, transparent 1px),
            linear-gradient(90deg, hsl(220 20% 100% / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gradient orbs */}
      <motion.div
        className="absolute top-1/3 right-0 w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(221 83% 53% / 0.08) 0%, transparent 60%)",
          y,
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(173 58% 39% / 0.06) 0%, transparent 60%)",
        }}
      />

      {/* Top edge line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <motion.div className="container relative z-10 pt-28 pb-20" style={{ opacity }}>
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/60 text-xs font-medium uppercase tracking-wider">
              <Shield className="h-3 w-3 text-primary" />
              {t.trustedBy}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-display font-bold tracking-tight leading-[0.95] mt-8 text-white"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.heroTitle1}
            <br />
            <span className="gradient-text">{t.heroTitle2}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed mt-7"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.heroDesc}
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button size="lg" asChild className="group rounded-lg px-7 text-sm h-12 bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg shadow-white/10">
              <Link to="/auth?tab=signup">
                {t.bookAppointment}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-lg px-7 text-sm h-12 border-white/15 text-white/80 hover:bg-white/5 hover:text-white bg-transparent">
              <a href="#specializations">
                {t.exploreSpecializations}
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24 max-w-4xl">
          {stats.map((stat, i) => (
            <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
