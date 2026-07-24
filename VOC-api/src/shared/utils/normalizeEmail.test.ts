import { describe, it, expect } from "vitest";
import { normalizeEmail } from "./normalizeEmail";

describe("normalizeEmail", () => {
  it("deve converter para min?sculas", () => {
    expect(normalizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("deve remover espa?os nas bordas", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("deve aplicar trim e lowercase simultaneamente", () => {
    expect(normalizeEmail("  User@Example.Com  ")).toBe("user@example.com");
  });
});
