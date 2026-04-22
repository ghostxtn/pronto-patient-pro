import { ArrowRight } from "lucide-react";
import PublicPageLayout from "@/components/landing/PublicPageLayout";
import SmartLink from "@/components/landing/SmartLink";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type LocalizedPageSection =
  | {
      type: "text";
      title?: string;
      body: string;
      highlighted?: boolean;
    }
  | {
      type: "list";
      title: string;
      items: string[];
      highlighted?: boolean;
    }
  | {
      type: "faq";
      title: string;
      items: Array<{
        q: string;
        a: string;
      }>;
    };

export type LocalizedPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LocalizedPageSection[];
  actions?: Array<{
    label: string;
    href: string;
    variant?: "default" | "outline";
    withArrow?: boolean;
  }>;
};

export default function LocalizedContentPage({ content }: { content: LocalizedPageContent }) {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            {content.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">{content.description}</p>
        </section>

        {content.sections.map((section, index) => {
          if (section.type === "faq") {
            return (
              <section key={`${section.title}-${index}`} className="mb-10">
                <h2 className="mb-4 font-display text-2xl tracking-tight text-homepage-ink">
                  {section.title}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={`${section.title}-${itemIndex}`}
                      value={`${section.title}-${itemIndex}`}
                      className="border-homepage-border"
                    >
                      <AccordionTrigger className="text-left font-display text-base leading-7 text-homepage-ink hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-7 text-homepage-text">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            );
          }

          if (section.type === "list") {
            return (
              <section
                key={`${section.title}-${index}`}
                className={section.highlighted ? "mb-10 rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6" : "mb-10"}
              >
                <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
                  {section.title}
                </h2>
                <ul className="mt-4 space-y-3 text-base leading-7 text-homepage-text">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          return (
            <section
              key={`${section.title ?? "text"}-${index}`}
              className={section.highlighted ? "mb-10 rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6" : "mb-10"}
            >
              {section.title ? (
                <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
                  {section.title}
                </h2>
              ) : null}
              <p
                className={[
                  section.highlighted ? "text-sm" : "text-base",
                  section.title ? "mt-4" : "",
                  "leading-7 text-homepage-text",
                ].join(" ").trim()}
              >
                {section.body}
              </p>
            </section>
          );
        })}

        {content.actions?.length ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {content.actions.map((action) => (
              <Button
                key={`${action.href}-${action.label}`}
                variant={action.variant === "outline" ? "outline" : "default"}
                asChild
                className={
                  action.variant === "outline"
                    ? "homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
                    : "homepage-focus-soft h-11 rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm text-white hover:bg-homepage-brand-deep"
                }
              >
                <SmartLink href={action.href}>
                  {action.label}
                  {action.withArrow ? <ArrowRight className="h-4 w-4" /> : null}
                </SmartLink>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </PublicPageLayout>
  );
}
