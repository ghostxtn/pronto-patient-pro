import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Stethoscope, HeartPulse, Brain, Eye, Baby, Bone, ScanFace, Smile,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope, "heart-pulse": HeartPulse, brain: Brain,
  eye: Eye, baby: Baby, bone: Bone, "scan-face": ScanFace, smile: Smile,
};

export default function SpecializationsSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const specializations = [
    { name: t.generalMedicine, icon: "stethoscope", color: "from-primary to-info" },
    { name: t.cardiology, icon: "heart-pulse", color: "from-destructive to-warning" },
    { name: t.dermatology, icon: "scan-face", color: "from-secondary to-success" },
    { name: t.orthopedics, icon: "bone", color: "from-warning to-destructive" },
    { name: t.pediatrics, icon: "baby", color: "from-info to-primary" },
    { name: t.neurology, icon: "brain", color: "from-accent-foreground to-primary" },
    { name: t.ophthalmology, icon: "eye", color: "from-secondary to-info" },
    { name: t.dentistry, icon: "smile", color: "from-success to-secondary" },
  ];

  return (
    <section id="specializations" className="py-24 md:py-32 relative" ref={ref}>
      <div className="container">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.span
            className="text-sm font-medium text-primary uppercase tracking-[0.2em]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {t.navSpecializations}
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-display font-bold mt-4 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {t.ourSpecializations}{" "}
            <span className="gradient-text">{t.specializationsWord}</span>
          </motion.h2>
          <motion.p
            className="text-muted-foreground mt-4 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.specDesc}
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {specializations.map((spec, i) => {
            const Icon = iconMap[spec.icon] || Stethoscope;
            const isHovered = hoveredIndex === i;

            return (
              <motion.div
                key={spec.name}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative group cursor-pointer"
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--info) / 0.08))`,
                    filter: "blur(20px)",
                  }}
                />
                <motion.div
                  className="relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6 md:p-8 text-center transition-all duration-500 hover:border-primary/30"
                  animate={isHovered ? { y: -8, scale: 1.02 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className={`mx-auto w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${spec.color} flex items-center justify-center mb-4`}
                    animate={isHovered ? { rotate: [0, -5, 5, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
                  </motion.div>
                  <h3 className="font-display font-semibold text-sm md:text-base">{spec.name}</h3>
                  <motion.div
                    className="h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mt-3"
                    initial={{ width: 0 }}
                    animate={isHovered ? { width: "60%" } : { width: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
