import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ScanFace, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorksSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    { icon: ScanFace, title: t.step1Title, desc: t.step1Desc },
    { icon: CalendarCheck, title: t.step2Title, desc: t.step2Desc },
    { icon: CheckCircle2, title: t.step3Title, desc: t.step3Desc },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-24 md:py-32 relative"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Decorative line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.span
            className="text-sm font-medium text-primary uppercase tracking-[0.2em]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {t.navHowItWorks}
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-display font-bold mt-4 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {t.howItWorks}{" "}
            <span className="gradient-text">{t.worksWord}</span>
          </motion.h2>
          <motion.p
            className="text-muted-foreground mt-4 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.howItWorksDesc}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto relative">
          {/* Connecting line */}
          <motion.div
            className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px"
            style={{ background: "var(--gradient-primary)" }}
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative group"
            >
              <div className="relative rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm p-8 md:p-10 text-center hover:border-primary/30 transition-all duration-500 hover:shadow-elevated">
                {/* Step number */}
                <motion.div
                  className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-soft z-10"
                  style={{ background: "var(--gradient-primary)" }}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <span className="text-primary-foreground">{i + 1}</span>
                </motion.div>

                <motion.div
                  className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent/80 flex items-center justify-center mb-6 mt-2"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <step.icon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </motion.div>
                <h3 className="font-display font-bold text-lg md:text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
