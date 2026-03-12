import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setLang(lang === "en" ? "tr" : "en")}
      title={lang === "en" ? "Türkçe'ye geç" : "Switch to English"}
    >
      <span className="text-xs font-bold uppercase">{lang === "en" ? "TR" : "EN"}</span>
    </Button>
  );
}
