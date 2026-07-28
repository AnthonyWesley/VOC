import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WhatsAppInstanceService } from "./WhatsAppInstanceService";
import { WhatsAppInstanceRepository } from "./WhatsAppInstanceRepository";

const { loggerWarn, loggerInfo, loggerError } = vi.hoisted(() => ({
  loggerWarn: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("../../shared/logger/logger", () => ({
  createLogger: () => ({
    warn: loggerWarn,
    info: loggerInfo,
    error: loggerError,
  }),
}));

function makeRepo(overrides?: Partial<WhatsAppInstanceRepository>): WhatsAppInstanceRepository {
  return {
    findActiveByName: vi.fn().mockResolvedValue({ instanceName: "default", id: "i-1", isActive: true, number: "5511999999999", userId: "u-1", createdAt: new Date(), updatedAt: new Date() }),
    findByInstanceName: vi.fn().mockResolvedValue(null),
    findActiveByUserId: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({} as any),
    deleteByInstanceName: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("WhatsAppInstanceService", () => {
  let repo: WhatsAppInstanceRepository;

  beforeEach(() => {
    process.env.EVOLUTION_URL = "http://evolution.test";
    process.env.EVOLUTION_API_KEY = "test-key";
    vi.useFakeTimers();
    loggerWarn.mockClear();
    loggerInfo.mockClear();
    loggerError.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("sendMessage", () => {
    it("returns ACCEPTED on 2xx", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ key: "msg-123", status: "sent" }),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.status).toBe("ACCEPTED");
        expect(result.providerMessageId).toBe("msg-123");
      }
    });

    it("returns ACCEPTED on 2xx with no JSON body", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error("no body")),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.status).toBe("ACCEPTED");
      }
    });

    it("returns INSTANCE_UNAVAILABLE when no active instance", async () => {
      repo = makeRepo({ findActiveByName: vi.fn().mockResolvedValue(null) });
      const service = new WhatsAppInstanceService(repo);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INSTANCE_UNAVAILABLE");
        expect(result.retryable).toBe(false);
      }
    });

    it("returns TIMEOUT on AbortError", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockRejectedValue({ name: "AbortError" });

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("TIMEOUT");
        expect(result.retryable).toBe(true);
      }
    });

    it("returns NETWORK_ERROR on network failure", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ENOTFOUND"));

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("NETWORK_ERROR");
        expect(result.retryable).toBe(true);
      }
    });
  });

  describe("connectionState (admin)", () => {
    it("returns CONNECTED when instance is open", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ instance: { state: "open" } }),
      } as any);

      const result = await service.connectionState("default");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("CONNECTED");
      }
    });

    it("returns DISCONNECTED when instance is close", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ instance: { state: "close" } }),
      } as any);

      const result = await service.connectionState("default");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("DISCONNECTED");
      }
    });

    it("maps connected as CONNECTED", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ instance: { state: "connected" } }),
      } as any);

      const result = await service.connectionState("default");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("CONNECTED");
    });

    it("maps closed as DISCONNECTED", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ instance: { state: "closed" } }),
      } as any);

      const result = await service.connectionState("default");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("DISCONNECTED");
    });

    it("maps disconnected as DISCONNECTED", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ instance: { state: "disconnected" } }),
      } as any);

      const result = await service.connectionState("default");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("DISCONNECTED");
    });

    it("returns UNKNOWN for unrecognized state values", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ instance: { state: "bogus" } }),
      } as any);

      const result = await service.connectionState("default");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("UNKNOWN");
    });

    it("returns NOT_CONFIGURED when no instance found", async () => {
      repo = makeRepo({ findActiveByName: vi.fn().mockResolvedValue(null) });
      const service = new WhatsAppInstanceService(repo);

      const result = await service.connectionState("unknown");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("NOT_CONFIGURED");
      }
    });

    it("returns INVALID_PROVIDER_RESPONSE on non-JSON response", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.reject(new Error("invalid json")),
      } as any);

      const result = await service.connectionState("default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_PROVIDER_RESPONSE");
      }
    });

    it("returns INSTANCE_NOT_FOUND on 404", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 404, text: () => Promise.resolve("Not found"),
      } as any);

      const result = await service.connectionState("default");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INSTANCE_NOT_FOUND");
    });
  });

  describe("createInstance", () => {
    it("returns instance info on success with base64 QR", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 201,
        json: () => Promise.resolve({ base64: "base64data", instance: { instanceName: "new-instance" } }),
      } as any);

      const result = await service.createInstance({ instanceName: "new-instance" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.instanceName).toBe("new-instance");
        expect(result.value.qrcode).toBe("base64data");
        expect(result.value.pairingCode).toBeNull();
      }
    });

    it("returns pairing code when present in response", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 201,
        json: () => Promise.resolve({
          base64: "base64data",
          qrcode: { pairingCode: "ABC123" },
        }),
      } as any);

      const result = await service.createInstance({ instanceName: "new-instance" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.pairingCode).toBe("ABC123");
      }
    });

    it("returns INVALID_PROVIDER_RESPONSE when response is empty object", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 201,
        json: () => Promise.resolve({}),
      } as any);

      const result = await service.createInstance({ instanceName: "new-instance" });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INVALID_PROVIDER_RESPONSE");
    });

    it("returns INSTANCE_ALREADY_EXISTS on 409", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 409, text: () => Promise.resolve("Conflict"),
      } as any);

      const result = await service.createInstance({ instanceName: "existing" });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INSTANCE_ALREADY_EXISTS");
    });

    it("returns INVALID_PROVIDER_RESPONSE on 404 (endpoint not found)", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 404, text: () => Promise.resolve("Not found"),
      } as any);

      const result = await service.createInstance({ instanceName: "test" });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INVALID_PROVIDER_RESPONSE");
    });
  });

  describe("getQrCode", () => {
    it("maps base64 to qrcode field", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ base64: "base64data" }),
      } as any);

      const result = await service.getQrCode("default");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.qrcode).toBe("base64data");
        expect(result.value.pairingCode).toBeNull();
      }
    });

    it("maps qrcode string field when base64 absent", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ qrcode: "qrcode-string" }),
      } as any);

      const result = await service.getQrCode("default");

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.qrcode).toBe("qrcode-string");
    });

    it("maps pairingCode when present", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ base64: "b64", pairingCode: "pair-123" }),
      } as any);

      const result = await service.getQrCode("default");

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.pairingCode).toBe("pair-123");
    });

    it("returns INVALID_PROVIDER_RESPONSE on empty object", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({}),
      } as any);

      const result = await service.getQrCode("default");

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INVALID_PROVIDER_RESPONSE");
    });

    it("returns INVALID_PROVIDER_RESPONSE on non-JSON", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.reject(new Error("not json")),
      } as any);

      const result = await service.getQrCode("default");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INVALID_PROVIDER_RESPONSE");
    });

    it("returns INSTANCE_NOT_FOUND on 404", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 404, text: () => Promise.resolve("Not found"),
      } as any);

      const result = await service.getQrCode("default");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INSTANCE_NOT_FOUND");
    });
  });

  describe("deleteInstance", () => {
    it("returns ok:true on successful delete", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
      } as any);

      const result = await service.deleteInstance("default");
      expect(result.ok).toBe(true);
    });

    it("returns ok:true on 404 (idempotent)", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 404, text: () => Promise.resolve("Not found"),
      } as any);

      const result = await service.deleteInstance("ghost");
      expect(result.ok).toBe(true);
    });

    it("returns TIMEOUT on AbortError", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockRejectedValue({ name: "AbortError" });

      const result = await service.deleteInstance("default");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("TIMEOUT");
    });
  });

  describe("restartInstance", () => {
    it("returns connection state on success", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ instance: { state: "open" } }),
      } as any);

      const result = await service.restartInstance("default");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("CONNECTED");
    });

    it("returns INSTANCE_NOT_FOUND on 404", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 404, text: () => Promise.resolve("Not found"),
      } as any);

      const result = await service.restartInstance("ghost");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INSTANCE_NOT_FOUND");
    });

    it("returns INVALID_PROVIDER_RESPONSE on non-JSON response", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.reject(new Error("no json")),
      } as any);

      const result = await service.restartInstance("default");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("INVALID_PROVIDER_RESPONSE");
    });
  });

  describe("log sanitization", () => {
    it("does not log API key, QR, or pairing code", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 201,
        json: () => Promise.resolve({
          base64: "sensitive-qr-base64",
          qrcode: { pairingCode: "sensitive-pairing" },
          instance: { instanceName: "new-inst" },
        }),
      } as any);

      await service.createInstance({ instanceName: "new-inst" });

      const allLogCalls = [...loggerWarn.mock.calls, ...loggerInfo.mock.calls, ...loggerError.mock.calls];
      const logged = JSON.stringify(allLogCalls);

      expect(logged).not.toContain("sensitive-qr-base64");
      expect(logged).not.toContain("sensitive-pairing");
      expect(logged).not.toContain("test-key");
    });
  });
});
