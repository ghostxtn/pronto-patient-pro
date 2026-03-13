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
    let step = 0;

    const timer = setInterval(() => {
      step++;
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
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="py-5 px-4 border-l border-white/10">
        <div className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
          {displayValue}{suffix}
        </div>
        <div className="text-xs text-white/40 mt-1 font-medium uppercase tracking-wider">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
