import { en } from "@/i18n/en";
import { tr } from "@/i18n/tr";
import { fr } from "@/i18n/fr";
import { ru } from "@/i18n/ru";
import { ar } from "@/i18n/ar";
import { es } from "@/i18n/es";

export type Language = "en" | "tr" | "fr" | "ru" | "ar" | "es";
export type Translations = typeof en;

export const DEFAULT_LANGUAGE: Language = "en";
export const RTL_LANGUAGES: Language[] = ["ar"];

export const LANGUAGE_OPTIONS: Array<{
  code: Language;
  label: string;
  shortLabel: string;
}> = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "tr", label: "Türkçe", shortLabel: "TR" },
  { code: "fr", label: "Français", shortLabel: "FR" },
  { code: "ru", label: "Русский", shortLabel: "RU" },
  { code: "ar", label: "العربية", shortLabel: "AR" },
  { code: "es", label: "Español", shortLabel: "ES" },
];

export const translations: Record<Language, Translations> = {
  en,
  tr,
  fr,
  ru,
  ar,
  es,
};

export function isLanguage(value: string | null | undefined): value is Language {
  return LANGUAGE_OPTIONS.some((option) => option.code === value);
}

export function isRtlLanguage(lang: Language) {
  return RTL_LANGUAGES.includes(lang);
}
