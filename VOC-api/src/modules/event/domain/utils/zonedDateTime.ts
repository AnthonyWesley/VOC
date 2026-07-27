type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function createUtcDate(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, monthIndex, day);
  return date;
}

function getZonedParts(instant: Date, timeZone: string): ZonedDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(instant);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = getZonedParts(instant, timeZone);

  const representedAsUtc = createUtcDate(parts.year, parts.month - 1, parts.day);
  representedAsUtc.setUTCHours(parts.hour, parts.minute, parts.second, 0);

  const instantWithoutMs = Math.trunc(instant.getTime() / 1000) * 1000;

  return representedAsUtc.getTime() - instantWithoutMs;
}

function localMidnightToUtc(year: number, month: number, day: number, timeZone: string): Date {
  const nominalUtc = createUtcDate(year, month - 1, day);

  const firstOffset = getTimeZoneOffsetMs(nominalUtc, timeZone);
  const firstCandidate = new Date(nominalUtc.getTime() - firstOffset);

  const correctedOffset = getTimeZoneOffsetMs(firstCandidate, timeZone);

  return new Date(nominalUtc.getTime() - correctedOffset);
}

export function buildMonthRangeUtc(
  timeZone: string,
  year: number,
  month: number,
): { gte: Date; lt: Date } {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    gte: localMidnightToUtc(year, month, 1, timeZone),
    lt: localMidnightToUtc(nextYear, nextMonth, 1, timeZone),
  };
}

export function getYearMonthInTimeZone(
  instant: Date,
  timeZone: string,
): { year: number; month: number } {
  const parts = getZonedParts(instant, timeZone);

  if (!Number.isInteger(parts.year) || !Number.isInteger(parts.month)) {
    throw new Error("UNABLE_TO_RESOLVE_SITE_YEAR_MONTH");
  }

  return { year: parts.year, month: parts.month };
}
