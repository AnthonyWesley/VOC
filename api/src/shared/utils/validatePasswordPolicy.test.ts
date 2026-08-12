import { describe, it, expect } from "vitest";
import { validatePasswordPolicy } from "./validatePasswordPolicy";
import { ValidationError } from "../errors/ValidationError";

describe("validatePasswordPolicy", () => {
  it("deve aceitar senha v?lida (8+ chars, upper, lower, number, special)", () => {
    expect(() => validatePasswordPolicy("Valid@123")).not.toThrow();
  });

  it("deve rejeitar senha com menos de 8 caracteres", () => {
    expect(() => validatePasswordPolicy("Ab1@")).toThrow(ValidationError);
  });

  it("deve rejeitar senha sem letra min?scula", () => {
    expect(() => validatePasswordPolicy("ABCDEF@1")).toThrow(ValidationError);
  });

  it("deve rejeitar senha sem letra mai?scula", () => {
    expect(() => validatePasswordPolicy("abcdef@1")).toThrow(ValidationError);
  });

  it("deve rejeitar senha sem n?mero", () => {
    expect(() => validatePasswordPolicy("Abcdef@g")).toThrow(ValidationError);
  });

  it("deve rejeitar senha sem caractere especial", () => {
    expect(() => validatePasswordPolicy("Abcdefg1")).toThrow(ValidationError);
  });

  it("deve rejeitar senha vazia", () => {
    expect(() => validatePasswordPolicy("")).toThrow(ValidationError);
  });
});
