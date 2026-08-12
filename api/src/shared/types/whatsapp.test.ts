import { describe, it, expect } from "vitest";
import { maskPhone } from "./whatsapp";

describe("maskPhone", () => {
  it("masks long phone numbers", () => {
    expect(maskPhone("5511999999999")).toBe("*********9999");
  });

  it("masks short phone numbers", () => {
    expect(maskPhone("9999")).toBe("****");
  });

  it("handles empty string", () => {
    expect(maskPhone("")).toBe("*");
  });

  it("handles single digit", () => {
    expect(maskPhone("5")).toBe("*");
  });

  it("strips non-digit characters", () => {
    expect(maskPhone("+55 (11) 99999-9999")).toBe("*********9999");
  });
});
