import { describe, it, expect, vi } from "vitest";
import { HealthController } from "./healthController";

function makePrismaMock(up: boolean) {
  return {
    $queryRawUnsafe: vi.fn().mockImplementation(() => {
      if (up) return Promise.resolve([{ "?column?": 1 }]);
      return Promise.reject(new Error("DB down"));
    }),
  } as any;
}

describe("HealthController", () => {
  it("returns ok when DB up and WhatsApp configured", async () => {
    const ctrl = new HealthController(makePrismaMock(true), () => true);
    const result = await ctrl.checkReadiness();

    expect(result.status).toBe("ok");
    expect(result.dependencies.database).toBe("up");
    expect(result.dependencies.whatsapp).toBe("configured");
  });

  it("returns ok when DB up and WhatsApp not configured", async () => {
    const ctrl = new HealthController(makePrismaMock(true), () => false);
    const result = await ctrl.checkReadiness();

    expect(result.status).toBe("ok");
    expect(result.dependencies.database).toBe("up");
    expect(result.dependencies.whatsapp).toBe("not_configured");
  });

  it("returns error when DB down", async () => {
    const ctrl = new HealthController(makePrismaMock(false), () => true);
    const result = await ctrl.checkReadiness();

    expect(result.status).toBe("error");
    expect(result.dependencies.database).toBe("down");
  });

  it("returns degraded when WhatsApp check throws", async () => {
    const ctrl = new HealthController(
      makePrismaMock(true),
      () => { throw new Error("timeout"); },
    );
    const result = await ctrl.checkReadiness();

    expect(result.status).toBe("ok");
    expect(result.dependencies.database).toBe("up");
    expect(result.dependencies.whatsapp).toBe("down");
  });

  it("never exposes internal details", async () => {
    const ctrl = new HealthController(makePrismaMock(true), () => true);
    const result = await ctrl.checkReadiness();

    expect(Object.keys(result)).toEqual(["status", "dependencies"]);
    expect(result).not.toHaveProperty("details");
    expect(result).not.toHaveProperty("stack");
    expect(result).not.toHaveProperty("error");
  });
});
