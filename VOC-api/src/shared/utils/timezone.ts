export function buildMonthRangeUtc(
  timezone: string,
  year: number,
  month: number,
): { gte: Date; lt: Date } {
  // Build month boundaries in the given timezone, then convert to UTC
  const startLocal = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`);
  const startUtc = new Date(startLocal.toLocaleString("en-US", { timeZone: timezone }));

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endLocal = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00`);
  const endUtc = new Date(endLocal.toLocaleString("en-US", { timeZone: timezone }));

  return { gte: startUtc, lt: endUtc };
}
