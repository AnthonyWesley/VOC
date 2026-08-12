import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpLoggerMiddleware } from "./httpLoggerMiddleware";
import { requestContextStorage } from "./requestContext";

function mockReqRes(path: string, statusCode: number = 200) {
  const req = { method: "GET", path } as any;
  const res = {
    statusCode,
    on: vi.fn((event: string, cb: () => void) => {
      if (event === "finish") cb();
    }),
  } as any;
  return { req, res };
}

describe("httpLoggerMiddleware", () => {
  beforeEach(() => {
    requestContextStorage.enterWith({ requestId: "test-req" });
  });

  it("calls next immediately", () => {
    const { req, res } = mockReqRes("/test");
    const next = vi.fn();
    httpLoggerMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("registers finish handler on response", () => {
    const { req, res } = mockReqRes("/test");
    const next = vi.fn();
    httpLoggerMiddleware(req, res, next);
    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
  });
});
