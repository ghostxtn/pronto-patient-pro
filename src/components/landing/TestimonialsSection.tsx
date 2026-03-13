import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    { name: "Sarah M.", text: t.testimonial1, rating: 5 },
    { name: "James R.", text: t.testimonial2, rating: 5 },
    { name: "Emily K.", text: t.testimonial3, rating: 5 },
  ];

  return (
    <section id="testimonials" className="py-24 md:py-32 relative" ref={ref}>
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.span
            className="text-sm font-medium text-primary uppercase tracking-[0.2em]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {t.navTestimonials}
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-display font-bold mt-4 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {t.whatPatientsSay}{" "}
            <span className="gradient-text">{t.patientsSayWord}</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((tt, i) => (
            <motion.div
              key={tt.name}
              initial={{ opacity: 0, y: 50, rotateY: -15 }}
              animate={isInView ? { opacity: 1, y: 0, rotateY: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
              className="group relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-info/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8 hover:border-primary/20 transition-all duration-500">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: tt.rating }).map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.15 + j * 0.05 }}
                    >
                      <Star className="h-4 w-4 fill-warning text-warning" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">"{tt.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                    {tt.name[0]}
                  </div>
                  <span className="font-display font-semibold text-sm">{tt.name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
