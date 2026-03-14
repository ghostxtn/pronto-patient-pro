import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ScanFace, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorksSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const steps = [
    { icon: ScanFace, title: t.step1Title, desc: t.step1Desc, num: "01" },
    { icon: CalendarCheck, title: t.step2Title, desc: t.step2Desc, num: "02" },
    { icon: CheckCircle2, title: t.step3Title, desc: t.step3Desc, num: "03" },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-24 md:py-32 relative"
      style={{ background: "hsl(222 47% 11%)" }}
    >
      <div className="container">
        <div className="max-w-2xl mb-16">
          <motion.span
            className="text-xs font-semibold text-primary uppercase tracking-[0.2em]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {t.navHowItWorks}
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold mt-3 tracking-tight text-white leading-tight"
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {t.howItWorks}{" "}
            <span className="gradient-text">{t.worksWord}</span>
          </motion.h2>
          <motion.p
            className="text-white/45 mt-4 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.howItWorksDesc}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-7 md:p-8 hover:border-white/15 hover:bg-white/[0.05] transition-all duration-500 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-2xl font-display font-bold text-white/10">{step.num}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
