export type MinuteRange = {
  start: number;
  end: number;
};

export type SlotEntry = {
  startTime: string;
  endTime: string;
  duration: number;
  startMinutes: number;
  endMinutes: number;
};

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function rangesOverlap(left: MinuteRange, right: MinuteRange): boolean {
  return left.start < right.end && right.start < left.end;
}

export function rangesTouch(left: MinuteRange, right: MinuteRange): boolean {
  return left.end === right.start || right.end === left.start;
}

export function rangesOverlapOrTouch(
  left: MinuteRange,
  right: MinuteRange,
): boolean {
  return rangesOverlap(left, right) || rangesTouch(left, right);
}

export function rangeContains(
  container: MinuteRange,
  target: MinuteRange,
): boolean {
  return container.start <= target.start && container.end >= target.end;
}

export function mergeRanges(
  ranges: MinuteRange[],
  options: {
    mergeTouching?: boolean;
  } = {},
): MinuteRange[] {
  if (ranges.length === 0) {
    return [];
  }

  const sortedRanges = [...ranges]
    .map((range) => ({ ...range }))
    .sort((left, right) => left.start - right.start);
  const mergedRanges = [sortedRanges[0]];

  for (const range of sortedRanges.slice(1)) {
    const currentRange = mergedRanges[mergedRanges.length - 1];
    const shouldMerge =
      rangesOverlap(currentRange, range) ||
      (options.mergeTouching === true && rangesTouch(currentRange, range));

    if (shouldMerge) {
      currentRange.end = Math.max(currentRange.end, range.end);
      continue;
    }

    mergedRanges.push(range);
  }

  return mergedRanges;
}

export function createUnionRange(ranges: MinuteRange[]): MinuteRange {
  return ranges.reduce(
    (unionRange, range) => ({
      start: Math.min(unionRange.start, range.start),
      end: Math.max(unionRange.end, range.end),
    }),
    { ...ranges[0] },
  );
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isExpiredStartTime(
  date: string,
  startTime: string,
  now: Date = new Date(),
): boolean {
  const today = formatLocalDate(now);

  if (date < today) {
    return true;
  }

  if (date > today) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return timeToMinutes(startTime) <= currentMinutes;
}
