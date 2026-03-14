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
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const specializations = [
    { name: t.generalMedicine, icon: "stethoscope" },
    { name: t.cardiology, icon: "heart-pulse" },
    { name: t.dermatology, icon: "scan-face" },
    { name: t.orthopedics, icon: "bone" },
    { name: t.pediatrics, icon: "baby" },
    { name: t.neurology, icon: "brain" },
    { name: t.ophthalmology, icon: "eye" },
    { name: t.dentistry, icon: "smile" },
  ];

  return (
    <section id="specializations" className="py-24 md:py-32 bg-background" ref={ref}>
      <div className="container">
        <div className="grid md:grid-cols-[1fr_2fr] gap-12 md:gap-16 items-start">
          {/* Left heading */}
          <div className="sticky top-24">
            <motion.span
              className="text-xs font-semibold text-primary uppercase tracking-[0.2em]"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              {t.navSpecializations}
            </motion.span>
            <motion.h2
              className="text-3xl md:text-4xl font-display font-bold mt-3 tracking-tight text-foreground leading-tight"
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              {t.ourSpecializations}{" "}
              <span className="gradient-text">{t.specializationsWord}</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground mt-4 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t.specDesc}
            </motion.p>
          </div>

          {/* Right grid */}
          <div className="grid grid-cols-2 gap-3">
            {specializations.map((spec, i) => {
              const Icon = iconMap[spec.icon] || Stethoscope;
              const isHovered = hoveredIndex === i;

              return (
                <motion.div
                  key={spec.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  <motion.div
                    className="rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4 transition-colors duration-300 hover:border-primary/30 hover:bg-accent/30"
                    animate={isHovered ? { x: 4 } : { x: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm text-foreground">{spec.name}</h3>
                    </div>
                    <motion.div
                      className="ml-auto text-primary/40"
                      animate={isHovered ? { x: 4, opacity: 1 } : { x: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      →
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
