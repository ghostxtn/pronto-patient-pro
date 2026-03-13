import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AnimatedCounter from "./AnimatedCounter";

const letterVariants = {
  hidden: { opacity: 0, y: 80, rotateX: 90 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function HeroSection() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const stats = [
    { value: "15+", label: t.expertDoctors },
    { value: "10000+", label: t.happyPatients },
    { value: "8", label: t.specializations },
    { value: "98%", label: t.satisfactionRate },
  ];

  const heroTitle1 = t.heroTitle1;
  const heroTitle2 = t.heroTitle2;

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }}>
        <motion.div
          className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
            y,
          }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--secondary) / 0.06) 0%, transparent 70%)",
            y: useTransform(scrollYProgress, [0, 1], [0, 100]),
          }}
          animate={{ scale: [1.1, 1, 1.1], rotate: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating grid dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
      </div>

      <motion.div className="container relative z-10 pt-28 pb-16" style={{ opacity, scale }}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5" />
              {t.trustedBy}
            </span>
          </motion.div>

          {/* Title with letter animation */}
          <div className="mt-8 mb-6 perspective-1000">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[0.95]">
              <span className="block overflow-hidden">
                {heroTitle1.split("").map((char, i) => (
                  <motion.span
                    key={`t1-${i}`}
                    className="inline-block"
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={letterVariants}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </span>
              <span className="block overflow-hidden mt-1">
                {heroTitle2.split("").map((char, i) => (
                  <motion.span
                    key={`t2-${i}`}
                    className="inline-block gradient-text"
                    custom={i + heroTitle1.length}
                    initial="hidden"
                    animate="visible"
                    variants={letterVariants}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.heroDesc}
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button size="lg" asChild className="group rounded-full px-8 text-base h-13 shadow-elevated relative overflow-hidden">
              <Link to="/auth?tab=signup">
                <span className="relative z-10 flex items-center">
                  {t.bookAppointment}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="group rounded-full px-8 text-base h-13 backdrop-blur-sm border-border/50 hover:border-primary/40 hover:bg-primary/5">
              <a href="#specializations">
                <Play className="mr-2 h-4 w-4 text-primary" />
                {t.exploreSpecializations}
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary mt-2"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
