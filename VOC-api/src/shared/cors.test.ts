import { describe, it, expect } from "vitest";
import { parseCorsOrigins, createCorsOptions } from "./cors";

type CustomOrigin = (requestOrigin: string | undefined, callback: (err: Error | null, origin?: any) => void) => void;

describe("parseCorsOrigins", () => {
  it("returns default origins when env is undefined", () => {
    expect(parseCorsOrigins(undefined)).toEqual(["http://localhost:5173"]);
  });

  it("returns default origins when env is empty", () => {
    expect(parseCorsOrigins("")).toEqual(["http://localhost:5173"]);
  });

  it("parses single origin", () => {
    expect(parseCorsOrigins("https://app.example.com")).toEqual(["https://app.example.com"]);
  });

  it("parses comma-separated origins with trimming", () => {
    expect(parseCorsOrigins("http://a.com, http://b.com")).toEqual(["http://a.com", "http://b.com"]);
  });
});

describe("createCorsOptions", () => {
  it("allows configured origin", () => {
    const opts = createCorsOptions(["http://example.com"]);
    const originFn = opts.origin as CustomOrigin;
    const cb = (err: Error | null, allow?: boolean) => {
      expect(err).toBeNull();
      expect(allow).toBe(true);
    };
    originFn("http://example.com", cb);
  });

  it("rejects unknown origin", () => {
    const opts = createCorsOptions(["http://example.com"]);
    const originFn = opts.origin as CustomOrigin;
    const cb = (err: Error | null, allow?: boolean) => {
      expect(err).toBeInstanceOf(Error);
    };
    originFn("http://evil.com", cb);
  });

  it("allows missing origin (same-origin requests)", () => {
    const opts = createCorsOptions(["http://example.com"]);
    const originFn = opts.origin as CustomOrigin;
    const cb = (err: Error | null, allow?: boolean) => {
      expect(err).toBeNull();
      expect(allow).toBe(true);
    };
    originFn(undefined, cb);
  });

  it("sets credentials to true", () => {
    const opts = createCorsOptions();
    expect(opts.credentials).toBe(true);
  });
});
