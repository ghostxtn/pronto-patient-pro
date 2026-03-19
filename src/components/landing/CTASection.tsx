import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LandingContent } from "./content";
import SmartLink from "./SmartLink";

type FaqSectionProps = {
  copy: LandingContent["faqPreview"];
};

export default function CTASection({ copy }: FaqSectionProps) {
  return (
    <section id={copy.sectionId} className="pb-0 pt-12 md:pt-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="homepage-section-gradient rounded-[2rem] border border-homepage-border-strong p-6 md:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
                {copy.eyebrow}
              </p>
              <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-[3rem]">
                {copy.title}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-homepage-text md:text-lg">
                {copy.description}
              </p>

              <Button
                variant="outline"
                asChild
                className="homepage-focus-soft mt-8 h-11 rounded-full border-homepage-border-strong bg-white/70 px-5 text-sm text-homepage-muted hover:bg-white hover:text-homepage-ink"
              >
                <SmartLink href={copy.action.href ?? "#faq"}>
                  {copy.action.label}
                  <ArrowRight className="h-4 w-4" />
                </SmartLink>
              </Button>
            </div>

            <div className="homepage-shadow-card rounded-[1.65rem] border border-homepage-border bg-white/92 p-5 md:p-6">
              <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
                {copy.items.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="border-homepage-border">
                    <AccordionTrigger className="text-left font-display text-lg leading-7 text-homepage-ink hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-homepage-text">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
