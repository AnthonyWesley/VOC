import { describe, it, expect } from "vitest";
import { NullWhatsAppService } from "./NullWhatsAppService";

describe("NullWhatsAppService", () => {
  const service = new NullWhatsAppService();

  it("returns NOT_CONFIGURED on sendMessage", async () => {
    const result = await service.sendMessage("5511999999999", "hello", "default");
    expect(result).toEqual({ ok: false, code: "NOT_CONFIGURED", retryable: false });
  });

  it("returns NOT_CONFIGURED on connectionState", async () => {
    const result = await service.connectionState("default");
    expect(result).toEqual({ ok: false, code: "NOT_CONFIGURED" });
  });
});
