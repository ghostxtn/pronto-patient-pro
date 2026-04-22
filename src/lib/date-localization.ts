import { format } from "date-fns";
import { ar, enUS, es, fr, ru, tr } from "date-fns/locale";
import type { Language } from "@/i18n/config";

const DATE_FNS_LOCALES = {
  en: enUS,
  tr,
  fr,
  ru,
  ar,
  es,
} as const;

const INTL_LOCALES: Record<Language, string> = {
  en: "en-US",
  tr: "tr-TR",
  fr: "fr-FR",
  ru: "ru-RU",
  ar: "ar",
  es: "es-ES",
};

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function getDateFnsLocale(lang: Language) {
  return DATE_FNS_LOCALES[lang] ?? enUS;
}

export function getIntlLocale(lang: Language) {
  return INTL_LOCALES[lang] ?? INTL_LOCALES.en;
}

export function formatLocalizedDate(
  value: Date | string | number,
  lang: Language,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(getIntlLocale(lang), options).format(toDate(value));
}

export function formatLocalizedDateFns(
  value: Date | string | number,
  pattern: string,
  lang: Language,
) {
  return format(toDate(value), pattern, { locale: getDateFnsLocale(lang) });
}
