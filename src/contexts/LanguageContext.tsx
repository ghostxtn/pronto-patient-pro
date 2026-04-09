import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";
import { en } from "@/i18n/en";
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  isRtlLanguage,
  translations,
  type Language,
  type Translations,
} from "@/i18n/config";

interface LanguageContextType {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(
    () => {
      const storedLanguage = localStorage.getItem("medibook-lang");
      return isLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
    },
  );

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("medibook-lang", l);
  }, []);

  useEffect(() => {
    const dir = isRtlLanguage(lang) ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [lang]);

  const t = useMemo<Translations>(() => {
    const currentTranslations = translations[lang];

    return new Proxy(currentTranslations, {
      get(target, prop: string | symbol) {
        if (typeof prop !== "string") {
          return Reflect.get(target, prop);
        }

        if (prop in target) {
          return target[prop];
        }

        const fallback = en[prop] ?? prop;

        if (import.meta.env.DEV) {
          console.warn(`[i18n] Missing translation key "${prop}" for language "${lang}"`);
          return `__MISSING:${prop}__`;
        }

        return fallback;
      },
    });
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
