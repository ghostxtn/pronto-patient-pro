import { Stethoscope } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LandingFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/40 py-8 bg-background">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Stethoscope className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-sm text-foreground">MediBook</span>
        </div>
        <p className="text-xs text-muted-foreground">{t.copyright}</p>
        <div className="flex gap-6">
          {[t.privacy, t.terms, t.contact].map((label) => (
            <a
              key={label}
              href="#"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
