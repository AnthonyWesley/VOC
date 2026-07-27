import { describe, it, expect } from "vitest";
import { NullSocketServer } from "./NullSocketServer";

describe("NullSocketServer", () => {
  const server = new NullSocketServer();

  it("emit does not throw", () => {
    expect(() => server.emit("test", {})).not.toThrow();
  });

  it("emitToUser does not throw", () => {
    expect(() => server.emitToUser("user-1", "test", {})).not.toThrow();
  });

  it("isUserOnline returns false", () => {
    expect(server.isUserOnline("any")).toBe(false);
  });

  it("getOnlineUserCount returns 0", () => {
    expect(server.getOnlineUserCount()).toBe(0);
  });
});
