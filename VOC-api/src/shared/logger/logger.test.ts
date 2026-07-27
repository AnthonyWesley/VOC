import { describe, it, expect, vi, beforeEach } from "vitest";
import { baseLogger, createLogger } from "./logger";
import { requestContextStorage, getRequestId } from "./requestContext";

describe("logger", () => {
  beforeEach(() => {
    requestContextStorage.enterWith({ requestId: "test-request-id" });
  });

  it("creates a child logger with component", () => {
    const child = createLogger("test-component");
    expect(child).toBeDefined();
  });

  it("creates a child logger without component", () => {
    const child = createLogger();
    expect(child).toBeDefined();
  });

  it("getRequestId returns id from context", () => {
    expect(getRequestId()).toBe("test-request-id");
  });

  it("getRequestId returns fallback outside context", () => {
    requestContextStorage.disable();
    expect(getRequestId()).toBe("no-request-context");
  });
});
