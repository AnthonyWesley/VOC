import { describe, it, expect } from "vitest";
import { whatsappAdminRateLimitKey } from "./whatsappLimiter";
import type { Request } from "express";

function mockRequest(overrides?: Partial<Request>): Request {
  return { auth: undefined, ip: "127.0.0.1", ...overrides } as Request;
}

describe("whatsappAdminRateLimitKey", () => {
  it("returns user:userId when auth is present", () => {
    const req = mockRequest({ auth: { userId: "u-123", userLevel: 100 } });
    expect(whatsappAdminRateLimitKey(req)).toBe("user:u-123");
  });

  it("falls back to IP when auth is absent", () => {
    const req = mockRequest({ auth: undefined, ip: "192.168.1.1" });
    const key = whatsappAdminRateLimitKey(req);
    expect(key).toContain("ip:");
    expect(key).not.toContain("user:");
  });

  it("falls back to IP when userId is missing", () => {
    const req = mockRequest({ auth: { userId: "", userLevel: 100 }, ip: "10.0.0.1" });
    const key = whatsappAdminRateLimitKey(req);
    expect(key).toContain("ip:");
  });

  it("handles IPv6 addresses", () => {
    const req = mockRequest({ auth: undefined, ip: "::1" });
    const key = whatsappAdminRateLimitKey(req);
    expect(key).toContain("ip:");
  });

  it("different users get different keys on same IP", () => {
    const req1 = mockRequest({ auth: { userId: "u-a", userLevel: 100 }, ip: "10.0.0.1" });
    const req2 = mockRequest({ auth: { userId: "u-b", userLevel: 100 }, ip: "10.0.0.1" });
    expect(whatsappAdminRateLimitKey(req1)).toBe("user:u-a");
    expect(whatsappAdminRateLimitKey(req2)).toBe("user:u-b");
    expect(whatsappAdminRateLimitKey(req1)).not.toBe(whatsappAdminRateLimitKey(req2));
  });

  it("same user gets same key from different IPs", () => {
    const req1 = mockRequest({ auth: { userId: "u-x", userLevel: 100 }, ip: "10.0.0.1" });
    const req2 = mockRequest({ auth: { userId: "u-x", userLevel: 100 }, ip: "192.168.1.1" });
    expect(whatsappAdminRateLimitKey(req1)).toBe("user:u-x");
    expect(whatsappAdminRateLimitKey(req2)).toBe("user:u-x");
  });
});
