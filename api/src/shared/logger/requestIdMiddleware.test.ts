import { describe, it, expect, vi } from "vitest";
import { requestIdMiddleware } from "./requestIdMiddleware";
import { getRequestId } from "./requestContext";

function mockReqRes(headers: Record<string, string> = {}) {
  const req = {
    headers: { ...headers },
  } as any;
  const res = {
    setHeader: vi.fn(),
  } as any;
  return { req, res };
}

describe("requestIdMiddleware", () => {
  it("generates UUID when no x-request-id header", () => {
    const { req, res } = mockReqRes();
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", expect.stringMatching(/^[0-9a-f-]+$/));
    expect(next).toHaveBeenCalled();
  });

  it("propagates valid x-request-id from header", () => {
    const validId = "550e8400-e29b-41d4-a716-446655440000";
    const { req, res } = mockReqRes({ "x-request-id": validId });
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", validId);
    expect(next).toHaveBeenCalled();
  });

  it("rejects invalid x-request-id and generates new UUID", () => {
    const { req, res } = mockReqRes({ "x-request-id": "not-a-uuid" });
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    const setHeaderCall = (res.setHeader as any).mock.calls[0];
    expect(setHeaderCall[0]).toBe("X-Request-Id");
    expect(setHeaderCall[1]).not.toBe("not-a-uuid");
    expect(setHeaderCall[1]).toMatch(/^[0-9a-f-]+$/);
    expect(next).toHaveBeenCalled();
  });

  it("makes requestId available via getRequestId in downstream code", () => {
    const { req, res } = mockReqRes({ "x-request-id": "550e8400-e29b-41d4-a716-446655440000" });
    const next = vi.fn(() => {
      const id = getRequestId();
      expect(id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    requestIdMiddleware(req, res, next);
  });
});
