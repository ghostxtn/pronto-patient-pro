import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { en } from "@/i18n/en";
import { tr } from "@/i18n/tr";

type Language = "en" | "tr";
type Translations = typeof en;

interface LanguageContextType {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
}

const translations: Record<Language, Translations> = { en, tr };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(
    () => (localStorage.getItem("medibook-lang") as Language) || "en"
  );

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("medibook-lang", l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
