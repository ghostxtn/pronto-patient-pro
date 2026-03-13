import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const testimonials = [
    { name: "Sarah M.", text: t.testimonial1, rating: 5 },
    { name: "James R.", text: t.testimonial2, rating: 5 },
    { name: "Emily K.", text: t.testimonial3, rating: 5 },
  ];

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-background" ref={ref}>
      <div className="container">
        <div className="max-w-2xl mb-16">
          <motion.span
            className="text-xs font-semibold text-primary uppercase tracking-[0.2em]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {t.navTestimonials}
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold mt-3 tracking-tight text-foreground leading-tight"
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {t.whatPatientsSay}{" "}
            <span className="gradient-text">{t.patientsSayWord}</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((tt, i) => (
            <motion.div
              key={tt.name}
              initial={{ opacity: 0, y: 35 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
              className="group"
            >
              <div className="rounded-xl border border-border/60 bg-card p-7 hover:border-primary/20 transition-all duration-500 h-full flex flex-col">
                <Quote className="h-6 w-6 text-primary/20 mb-5 shrink-0" />
                <p className="text-muted-foreground leading-relaxed flex-1 text-sm">
                  "{tt.text}"
                </p>
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm">
                      {tt.name[0]}
                    </div>
                    <span className="font-display font-semibold text-sm text-foreground">{tt.name}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: tt.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
