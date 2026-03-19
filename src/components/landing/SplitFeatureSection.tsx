import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SmartLink from "./SmartLink";

type SplitFeatureSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  note: string;
  action: {
    label: string;
    href?: string;
  };
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

export default function SplitFeatureSection({
  id,
  eyebrow,
  title,
  description,
  points,
  note,
  action,
  image,
  imageAlt,
  reverse = false,
}: SplitFeatureSectionProps) {
  return (
    <section id={id} className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={[
            "grid items-center gap-8 lg:gap-14",
            reverse ? "lg:grid-cols-[1fr_1.02fr]" : "lg:grid-cols-[1.02fr_1fr]",
          ].join(" ")}
        >
          <div className={reverse ? "lg:order-2" : undefined}>
            <div className="homepage-shadow-card overflow-hidden rounded-[2rem] border border-homepage-border bg-homepage-shell-cool">
              <img
                src={image}
                alt={imageAlt}
                className="h-[420px] w-full object-cover transition-transform duration-700 hover:scale-[1.03] md:h-[520px]"
              />
            </div>
          </div>

          <div className={reverse ? "lg:order-1" : undefined}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">{eyebrow}</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-[3.2rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-homepage-text md:text-lg">{description}</p>

            <ul className="mt-8 space-y-4">
              {points.map((point) => (
                <li key={point} className="flex gap-4 text-homepage-text">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
                  <span className="text-base leading-7">{point}</span>
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-xl border-l border-homepage-border-strong pl-5 text-sm leading-6 text-homepage-muted">
              {note}
            </p>

            <Button
              variant="outline"
              asChild
              className="homepage-focus-soft mt-8 h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell hover:text-homepage-ink"
            >
              <SmartLink href={action.href}>
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </SmartLink>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
