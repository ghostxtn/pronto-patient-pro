import { useEffect, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function QuickAccessSection() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const { quickAccess } = content;
  const browseHref =
    quickAccess.browseAction.href === "#specialties-preview"
      ? "/specialties"
      : (quickAccess.browseAction.href ?? "/specialties");
  const [activeFilter, setActiveFilter] = useState(quickAccess.filters[0]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveFilter(quickAccess.filters[0]);
  }, [quickAccess]);

  return (
    <section
      id={quickAccess.sectionId}
      className="relative z-10 -mt-10 pb-8 md:-mt-14 md:pb-10"
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="homepage-shadow-card grid gap-8 rounded-[2rem] border border-homepage-border-strong bg-homepage-card p-6 md:grid-cols-[1.1fr_0.95fr] md:p-8 lg:p-10"
        >
          <div className="border-b border-homepage-border pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
              {quickAccess.eyebrow}
            </p>
            <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight text-homepage-ink">
              {quickAccess.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-homepage-text">
              {quickAccess.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {quickAccess.filters.map((filter) => {
                const isActive = filter === activeFilter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={[
                      "homepage-focus-soft rounded-full border px-4 py-2 text-sm transition-colors duration-200",
                      isActive
                        ? "border-homepage-brand bg-homepage-brand text-white"
                        : "border-homepage-border bg-homepage-shell text-homepage-muted hover:border-homepage-border-strong hover:bg-homepage-shell-cool hover:text-homepage-ink",
                    ].join(" ")}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-homepage-soft" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={quickAccess.searchPlaceholder}
                  className="h-14 rounded-full border-homepage-border bg-homepage-shell pl-11 pr-4 text-sm text-homepage-ink shadow-none placeholder:text-homepage-soft focus-visible:ring-homepage-brand/25 focus-visible:ring-offset-white"
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-homepage-muted">{quickAccess.helperText}</p>
            </div>

            <div className="rounded-[1.5rem] border border-homepage-border bg-homepage-shell p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-homepage-soft">
                {quickAccess.panelEyebrow}
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-2xl tracking-tight text-homepage-ink">{activeFilter}</p>
                  <p className="mt-1 text-sm text-homepage-muted">{quickAccess.panelDescription}</p>
                  {query ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-homepage-soft">
                      {lang === "tr" ? "Arama girdisi korunuyor" : "Search input preserved"}: {query}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="homepage-focus-soft h-11 rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm text-white hover:bg-homepage-brand-deep"
                >
                  <SmartLink href={browseHref}>
                    {quickAccess.browseAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </SmartLink>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
                >
                  <SmartLink href={quickAccess.requestAction.href ?? "/request-appointment"}>
                    {quickAccess.requestAction.label}
                  </SmartLink>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
