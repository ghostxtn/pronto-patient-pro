import { format, getDay, parse, startOfWeek } from "date-fns";
import { dateFnsLocalizer, Views, type View } from "react-big-calendar";
import type { Language, Translations } from "@/i18n/config";
import { getDateFnsLocale, getIntlLocale } from "@/lib/date-localization";

export function createCalendarLocalizer(lang: Language) {
  const locale = getDateFnsLocale(lang);

  return dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1, locale }),
    getDay,
    locales: {
      [lang]: locale,
    },
  });
}

export function getCalendarMessages(t: Translations) {
  return {
    today: t.today,
    previous: t.previous,
    next: t.next,
    month: t.month,
    week: t.week,
    day: t.day,
    agenda: t.agenda,
    date: t.date,
    time: t.time,
    event: t.appointments,
    noEventsInRange: t.noAppointmentsYetAdmin,
    showMore: (total: number) => `+${total}`,
  };
}

export function getCalendarViewLabels(t: Translations) {
  return {
    [Views.MONTH]: t.month,
    [Views.WEEK]: t.week,
    [Views.DAY]: t.day,
    [Views.AGENDA]: t.agenda,
  } as const;
}

export function getCalendarDayLabels(t: Translations) {
  return {
    0: t.sunday,
    1: t.monday,
    2: t.tuesday,
    3: t.wednesday,
    4: t.thursday,
    5: t.friday,
    6: t.saturday,
  } as const;
}

export function formatCalendarHeaderDay(date: Date, lang: Language) {
  return format(date, "EEE", { locale: getDateFnsLocale(lang) })
    .replace(".", "")
    .toLocaleUpperCase(getIntlLocale(lang));
}

export function formatCalendarRangeLabel(
  date: Date,
  view: View,
  lang: Language,
  t: Translations,
) {
  const locale = getDateFnsLocale(lang);
  const anchor = startOfWeek(date, { weekStartsOn: 1, locale });
  const weekEnd = new Date(anchor);
  weekEnd.setDate(anchor.getDate() + 6);

  if (view === Views.WEEK) {
    if (
      format(anchor, "MMMM yyyy", { locale }) ===
      format(weekEnd, "MMMM yyyy", { locale })
    ) {
      return `${format(anchor, "d", { locale })} - ${format(weekEnd, "d MMMM yyyy", {
        locale,
      })}`;
    }

    return `${format(anchor, "d MMM", { locale })} - ${format(weekEnd, "d MMM yyyy", {
      locale,
    })}`;
  }

  if (view === Views.DAY) {
    return format(date, "d MMMM yyyy, EEEE", { locale });
  }

  if (view === Views.MONTH) {
    return format(date, "MMMM yyyy", { locale });
  }

  return `${t.agenda} - ${format(date, "d MMMM yyyy", { locale })}`;
}
