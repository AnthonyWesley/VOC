/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { calculateAge } from "./calculateAge";

describe("calculateAge", () => {
  it("should calculate age correctly", () => {
    const birthDate = new Date("1990-01-15");
    const age = calculateAge(birthDate);
    expect(age).toBeGreaterThan(0);
  });
});
