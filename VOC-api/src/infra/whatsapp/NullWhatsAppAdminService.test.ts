import { describe, it, expect } from "vitest";
import { NullWhatsAppAdminService } from "./NullWhatsAppAdminService";

describe("NullWhatsAppAdminService", () => {
  const service = new NullWhatsAppAdminService();

  it("returns NOT_CONFIGURED on connectionState", async () => {
    const result = await service.connectionState("default");
    expect(result).toEqual({ ok: false, code: "NOT_CONFIGURED", retryable: false });
  });

  it("returns NOT_CONFIGURED on createInstance", async () => {
    const result = await service.createInstance({ instanceName: "test" });
    expect(result).toEqual({ ok: false, code: "NOT_CONFIGURED", retryable: false });
  });

  it("returns NOT_CONFIGURED on getQrCode", async () => {
    const result = await service.getQrCode("default");
    expect(result).toEqual({ ok: false, code: "NOT_CONFIGURED", retryable: false });
  });

  it("returns NOT_CONFIGURED on deleteInstance", async () => {
    const result = await service.deleteInstance("default");
    expect(result).toEqual({ ok: false, code: "NOT_CONFIGURED", retryable: false });
  });

  it("returns NOT_CONFIGURED on restartInstance", async () => {
    const result = await service.restartInstance("default");
    expect(result).toEqual({ ok: false, code: "NOT_CONFIGURED", retryable: false });
  });

  it("never throws", async () => {
    await expect(service.connectionState("x")).resolves.not.toThrow();
    await expect(service.createInstance({ instanceName: "x" })).resolves.not.toThrow();
    await expect(service.getQrCode("x")).resolves.not.toThrow();
    await expect(service.deleteInstance("x")).resolves.not.toThrow();
    await expect(service.restartInstance("x")).resolves.not.toThrow();
  });
});
