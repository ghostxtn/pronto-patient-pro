import {
  addDays,
  format,
  parse,
  setHours,
  setMinutes,
  startOfWeek,
  subDays,
} from "date-fns";
import {
  Appointment,
  AvailabilityOverride,
  AvailabilitySlot,
  CalendarEvent,
} from "@/types/calendar";

const CLINIC_TIME_ZONE = "Europe/Istanbul";

export function parseCalendarDate(date: string) {
  return parse(date, "yyyy-MM-dd", new Date());
}

export function getClinicNowParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    minutes: Number(hour) * 60 + Number(minute),
    dayOfWeek: new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay(),
  };
}

export function isPastSchedulerSelection(date: string, startTime: string) {
  const clinicNow = getClinicNowParts();

  if (date < clinicNow.date) {
    return true;
  }

  if (date > clinicNow.date) {
    return false;
  }

  const [hours, minutes] = startTime.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes <= clinicNow.minutes;
}

function parseTimeToDate(baseDate: Date, time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return setMinutes(setHours(baseDate, hours), minutes);
}

export function availabilityToEvents(
  slots: AvailabilitySlot[],
  weekStart: Date,
): CalendarEvent[] {
  const sundayBase = startOfWeek(subDays(weekStart, 1), { weekStartsOn: 0 });

  return slots.map((slot) => {
    const slotDate = addDays(sundayBase, slot.day_of_week);
    return {
      id: `availability-${slot.id}-${format(slotDate, "yyyy-MM-dd")}`,
      title: "Musait",
      start: parseTimeToDate(slotDate, slot.start_time),
      end: parseTimeToDate(slotDate, slot.end_time),
      type: "availability",
      resource: slot,
    };
  });
}

export function appointmentsToEvents(
  appointments: Appointment[],
): CalendarEvent[] {
  return appointments.map((appointment) => {
    const baseDate = parseCalendarDate(appointment.appointment_date);
    return {
      id: appointment.id,
      title: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
      start: parseTimeToDate(baseDate, appointment.start_time),
      end: parseTimeToDate(baseDate, appointment.end_time),
      type: "appointment",
      resource: appointment,
    };
  });
}

export function overridesToEvents(
  overrides: AvailabilityOverride[],
): CalendarEvent[] {
  return overrides.map((override) => {
    const baseDate = parseCalendarDate(override.date);

    if (override.type === "blackout") {
      if (override.start_time && override.end_time) {
        return {
          id: override.id,
          title: override.reason ?? "Blok",
          start: parseTimeToDate(baseDate, override.start_time),
          end: parseTimeToDate(baseDate, override.end_time),
          type: override.type,
          resource: override,
        };
      }

      const blackoutDate = parseCalendarDate(override.date);
      return {
        id: override.id,
        title: override.reason ?? "Tum Gun Blok",
        start: blackoutDate,
        end: blackoutDate,
        allDay: true,
        type: override.type,
        resource: override,
      };
    }

    const start =
      override.start_time
        ? parseTimeToDate(baseDate, override.start_time)
        : setMinutes(setHours(baseDate, 0), 0);
    const end =
      override.end_time
        ? parseTimeToDate(baseDate, override.end_time)
        : setMinutes(setHours(baseDate, 23), 59);

    return {
      id: override.id,
      title: override.reason ?? "Özel Mesai",
      start,
      end,
      type: override.type,
      resource: override,
    };
  });
}
