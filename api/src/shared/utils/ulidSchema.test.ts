import { describe, it, expect } from "vitest";
import { ulidSchema } from "../utils/ulidSchema";

describe("ulidSchema", () => {
  it("accepts valid uppercase ULID", () => {
    expect(ulidSchema.parse("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("rejects lowercase ULID", () => {
    expect(() => ulidSchema.parse("01arz3ndektsv4rrffq69g5fav")).toThrow();
  });

  it("rejects UUID", () => {
    expect(() => ulidSchema.parse("550e8400-e29b-41d4-a716-446655440000")).toThrow();
  });

  it("rejects arbitrary string", () => {
    expect(() => ulidSchema.parse("abc")).toThrow();
  });

  it("rejects wrong length", () => {
    expect(() => ulidSchema.parse("01ARZ3NDEKTSV4RRFFQ69G5FA")).toThrow();
  });

  it("rejects ULID with forbidden characters (I, L, O, U)", () => {
    expect(() => ulidSchema.parse("01ARZ3NDEKTSV4RRFFQ69G5FIV")).toThrow();
    expect(() => ulidSchema.parse("01ARZ3NDEKTSV4RRFFQ69G5FLV")).toThrow();
    expect(() => ulidSchema.parse("01ARZ3NDEKTSV4RRFFQ69G5FOV")).toThrow();
    expect(() => ulidSchema.parse("01ARZ3NDEKTSV4RRFFQ69G5FUV")).toThrow();
  });
});
