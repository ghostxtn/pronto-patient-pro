import assert = require('node:assert/strict');
import {
  generateSlotEntriesForRange,
  rangesOverlap,
} from './calendar-time.utils';

function filterBusySlots(
  slotStarts: string[],
  busyRange: { start: number; end: number },
) {
  return slotStarts.filter((slotStart) => {
    const [hours, minutes] = slotStart.split(':').map(Number);
    const candidateStart = hours * 60 + minutes;
    const candidateEnd = candidateStart + 30;

    return !rangesOverlap(
      { start: candidateStart, end: candidateEnd },
      busyRange,
    );
  });
}

const patientGridFromShiftedAvailability = generateSlotEntriesForRange(
  9 * 60 + 30,
  14 * 60,
  30,
  { alignToGrid: true },
).map((slot) => slot.startTime);

assert.equal(
  patientGridFromShiftedAvailability.includes('12:00'),
  true,
  'fixed patient grid should generate 12:00 inside a 09:30+ free range',
);

const postBusySlots = filterBusySlots(patientGridFromShiftedAvailability, {
  start: 10 * 60 + 30,
  end: 12 * 60,
});

assert.equal(
  postBusySlots.includes('12:00'),
  true,
  'busy 10:30-12:00 should keep 12:00 free',
);

assert.equal(
  postBusySlots.includes('11:30'),
  false,
  'busy 10:30-12:00 should still block 11:30',
);

const earlyDaySlots = filterBusySlots(
  generateSlotEntriesForRange(6 * 60, 9 * 60, 30, {
    alignToGrid: true,
  }).map((slot) => slot.startTime),
  {
    start: 7 * 60,
    end: 8 * 60 + 30,
  },
);

assert.equal(
  earlyDaySlots.includes('06:30'),
  true,
  'busy 07:00-08:30 should keep 06:30 free',
);

assert.equal(
  earlyDaySlots.includes('07:00'),
  false,
  'busy 07:00-08:30 should still block 07:00',
);
