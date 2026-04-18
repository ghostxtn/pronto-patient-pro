import {
  addDays,
  format,
  parseISO,
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

function parseTimeToDate(baseDate: Date, time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return setMinutes(setHours(baseDate, hours), minutes);
}

export function parseDateOnly(value: string) {
  return parseISO(`${value}T00:00:00`);
}

export function availabilityToEvents(
  slots: AvailabilitySlot[],
  weekStart: Date,
): CalendarEvent[] {
  const sundayBase = startOfWeek(subDays(weekStart, 1), { weekStartsOn: 0 });

  return slots.flatMap((slot) => {
    const slotDate = slot.specific_date
      ? parseDateOnly(slot.specific_date)
      : Number.isInteger(slot.day_of_week)
        ? addDays(sundayBase, slot.day_of_week)
        : null;

    if (!slotDate) {
      return [];
    }

    return [
      {
        id: `availability-${slot.id}-${format(slotDate, "yyyy-MM-dd")}`,
        title: "Musait",
        start: parseTimeToDate(slotDate, slot.start_time),
        end: parseTimeToDate(slotDate, slot.end_time),
        type: "availability" as const,
        resource: slot,
      },
    ];
  });
}

export function appointmentsToEvents(
  appointments: Appointment[],
): CalendarEvent[] {
  return appointments.map((appointment) => {
    const baseDate = parseISO(appointment.appointment_date);
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
    const baseDate = parseISO(override.date);

    if (override.type === "blackout") {
      const blackoutDate = new Date(override.date);
      return {
        id: override.id,
        title: override.reason ?? "Kapali",
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
