import { describe, it, expect } from "vitest";
import { encodeEventCursor, decodeEventCursor } from "./eventCursor";
import { ValidationError } from "../../../../shared/errors/ValidationError";

describe("EventCursor codec", () => {
  const validCursor = { startsAt: "2026-08-15T10:00:00.000Z", id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" };

  it("encode → decode round-trip", () => {
    const encoded = encodeEventCursor(validCursor);
    const decoded = decodeEventCursor(encoded);
    expect(decoded).toEqual(validCursor);
  });

  function expectInvalidCursor(fn: () => unknown) {
    let thrown: any;
    try { fn(); } catch (e: any) { thrown = e; }
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.code).toBe("INVALID_CURSOR");
  }

  it("rejects non-Base64URL characters", () => {
    expectInvalidCursor(() => decodeEventCursor("invalid!!!"));
  });

  it("rejects empty string", () => {
    expectInvalidCursor(() => decodeEventCursor(""));
  });

  it("rejects Base64URL with invalid JSON", () => {
    const b64 = Buffer.from("not-json").toString("base64url");
    expectInvalidCursor(() => decodeEventCursor(b64));
  });

  it("rejects JSON array", () => {
    const b64 = Buffer.from('["a","b"]').toString("base64url");
    expectInvalidCursor(() => decodeEventCursor(b64));
  });

  it("rejects object without startsAt", () => {
    const b64 = Buffer.from(JSON.stringify({ id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })).toString("base64url");
    expectInvalidCursor(() => decodeEventCursor(b64));
  });

  it("rejects object without id", () => {
    const b64 = Buffer.from(JSON.stringify({ startsAt: "2026-08-15T10:00:00.000Z" })).toString("base64url");
    expectInvalidCursor(() => decodeEventCursor(b64));
  });

  it("rejects invalid startsAt (not ISO datetime)", () => {
    const b64 = Buffer.from(JSON.stringify({ startsAt: "not-a-date", id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })).toString("base64url");
    expectInvalidCursor(() => decodeEventCursor(b64));
  });

  it("rejects invalid id (not ULID)", () => {
    const b64 = Buffer.from(JSON.stringify({ startsAt: "2026-08-15T10:00:00.000Z", id: "not-a-ulid" })).toString("base64url");
    expectInvalidCursor(() => decodeEventCursor(b64));
  });

  it("rejects extra properties", () => {
    const b64 = Buffer.from(JSON.stringify({ startsAt: "2026-08-15T10:00:00.000Z", id: "01ARZ3NDEKTSV4RRFFQ69G5FAV", extra: true })).toString("base64url");
    expectInvalidCursor(() => decodeEventCursor(b64));
  });

  it("encodeEventCursor rejects invalid input", () => {
    expect(() => encodeEventCursor({ startsAt: "bad", id: "bad" })).toThrow();
  });
});
