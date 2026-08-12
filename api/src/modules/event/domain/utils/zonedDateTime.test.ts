import { describe, it, expect } from "vitest";
import { buildMonthRangeUtc, getYearMonthInTimeZone } from "./zonedDateTime";
import { assertValidTimeZone } from "./timeZoneValidation";
import { ConfigurationError } from "../../../../shared/errors/ConfigurationError";

describe("buildMonthRangeUtc", () => {
  it("preserves year 1", () => {
    const range = buildMonthRangeUtc("UTC", 1, 1);
    expect(range.gte.getUTCFullYear()).toBe(1);
    expect(range.gte.getUTCMonth()).toBe(0);
    expect(range.lt.getUTCMonth()).toBe(1);
  });

  it("preserves year 99", () => {
    const range = buildMonthRangeUtc("UTC", 99, 6);
    expect(range.gte.getUTCFullYear()).toBe(99);
    expect(range.gte.getUTCMonth()).toBe(5);
    expect(range.lt.getUTCMonth()).toBe(6);
  });

  it("preserves year 100", () => {
    const range = buildMonthRangeUtc("UTC", 100, 1);
    expect(range.gte.getUTCFullYear()).toBe(100);
  });

  it("preserves year 9999", () => {
    const range = buildMonthRangeUtc("UTC", 9999, 1);
    expect(range.gte.getUTCFullYear()).toBe(9999);
  });

  it("handles December overflow to next year", () => {
    const range = buildMonthRangeUtc("UTC", 2026, 12);
    expect(range.gte.getUTCFullYear()).toBe(2026);
    expect(range.gte.getUTCMonth()).toBe(11);
    expect(range.lt.getUTCFullYear()).toBe(2027);
    expect(range.lt.getUTCMonth()).toBe(0);
  });

  it("produces half-open range [start, nextMonth)", () => {
    const range = buildMonthRangeUtc("UTC", 2026, 8);
    // Aug 1 00:00 UTC <= start < Sep 1 00:00 UTC
    expect(range.gte < range.lt).toBe(true);
    // Difference should be exactly 1 month
    const diffMs = range.lt.getTime() - range.gte.getTime();
    // August has 31 days = 31 * 24 * 60 * 60 * 1000
    expect(diffMs).toBe(31 * 24 * 60 * 60 * 1000);
  });

  it("timezone offset shifts the range", () => {
    const utc = buildMonthRangeUtc("UTC", 2026, 8);
    const brt = buildMonthRangeUtc("America/Sao_Paulo", 2026, 8);
    // BRT is UTC-3, so the range should be 3 hours later
    expect(brt.gte.getTime()).toBe(utc.gte.getTime() + 3 * 60 * 60 * 1000);
  });
});

describe("getYearMonthInTimeZone", () => {
  it("returns month and year for a given instant", () => {
    const instant = new Date("2026-08-15T10:00:00Z");
    const result = getYearMonthInTimeZone(instant, "UTC");
    expect(result.year).toBe(2026);
    expect(result.month).toBe(8);
  });

  it("shifts month near boundary in negative offset", () => {
    // Aug 1 02:00 UTC = Jul 31 23:00 BRT (UTC-3)
    const instant = new Date("2026-08-01T02:00:00Z");
    const result = getYearMonthInTimeZone(instant, "America/Sao_Paulo");
    expect(result.year).toBe(2026);
    expect(result.month).toBe(7);
  });

  it("shifts month near boundary in positive offset", () => {
    // Use a timezone with positive offset
    const instant = new Date("2026-07-31T22:00:00Z");
    const result = getYearMonthInTimeZone(instant, "Asia/Dubai");
    // Dubai is UTC+4
    expect(result.year).toBe(2026);
    expect(result.month).toBe(8);
  });
});

describe("assertValidTimeZone", () => {
  it("accepts valid IANA timezone", () => {
    expect(() => assertValidTimeZone("America/Sao_Paulo")).not.toThrow();
    expect(() => assertValidTimeZone("UTC")).not.toThrow();
    expect(() => assertValidTimeZone("America/New_York")).not.toThrow();
  });

  it("rejects invalid IANA timezone", () => {
    expect(() => assertValidTimeZone("Invalid/Zone")).toThrow(ConfigurationError);
    expect(() => assertValidTimeZone("")).toThrow(ConfigurationError);
    expect(() => assertValidTimeZone("America/")).toThrow(ConfigurationError);
  });

  it("rejects empty string", () => {
    expect(() => assertValidTimeZone("")).toThrow(ConfigurationError);
  });
});
