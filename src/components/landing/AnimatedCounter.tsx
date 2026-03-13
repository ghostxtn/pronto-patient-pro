import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  label: string;
  index: number;
}

export default function AnimatedCounter({ value, label, index }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  const numericPart = value.replace(/[^0-9.]/g, "");
  const suffix = value.replace(/[0-9.]/g, "");
  const target = parseFloat(numericPart);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      const eased = target * (1 - Math.pow(1 - step / steps, 3));
      setDisplayValue(
        target >= 100 ? Math.round(eased).toLocaleString() : eased.toFixed(target % 1 !== 0 ? 1 : 0)
      );
      if (step >= steps) {
        setDisplayValue(numericPart);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, target, numericPart]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-info/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="relative glass rounded-2xl p-6 md:p-8 text-center border border-border/30 hover:border-primary/30 transition-all duration-500 hover:shadow-elevated">
        <div className="text-3xl md:text-5xl font-display font-bold gradient-text tracking-tight">
          {displayValue}{suffix}
        </div>
        <div className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wider">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
