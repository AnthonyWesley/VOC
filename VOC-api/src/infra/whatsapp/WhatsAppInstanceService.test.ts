import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WhatsAppInstanceService } from "./WhatsAppInstanceService";
import { WhatsAppInstanceRepository } from "./WhatsAppInstanceRepository";

function makeRepo(overrides?: Partial<WhatsAppInstanceRepository>): WhatsAppInstanceRepository {
  return {
    findActiveByName: vi.fn().mockResolvedValue({ instanceName: "default", id: "i-1", isActive: true, number: "5511999999999", userId: "u-1", createdAt: new Date(), updatedAt: new Date() }),
    ...overrides,
  };
}

describe("WhatsAppInstanceService", () => {
  let repo: WhatsAppInstanceRepository;

  beforeEach(() => {
    process.env.EVOLUTION_URL = "http://evolution.test";
    process.env.EVOLUTION_API_KEY = "test-key";
    vi.useFakeTimers();
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

    it("returns AUTH_ERROR on 401", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 401, text: () => Promise.resolve("Unauthorized"),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("AUTH_ERROR");
        expect(result.retryable).toBe(false);
      }
    });

    it("returns AUTH_ERROR on 403", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 403, text: () => Promise.resolve("Forbidden"),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("AUTH_ERROR");
      }
    });

    it("returns INVALID_REQUEST on 400", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 400, text: () => Promise.resolve("Bad request"),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_REQUEST");
        expect(result.retryable).toBe(false);
      }
    });

    it("returns INVALID_REQUEST on 422", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 422, text: () => Promise.resolve("Unprocessable"),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("INVALID_REQUEST");
      }
    });

    it("returns RATE_LIMITED on 429", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 429, text: () => Promise.resolve("Too many"),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("RATE_LIMITED");
        expect(result.retryable).toBe(true);
      }
    });

    it("returns PROVIDER_ERROR on 500", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false, status: 500, text: () => Promise.resolve("Server error"),
      } as any);

      const result = await service.sendMessage("5511999999999", "hello", "default");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("PROVIDER_ERROR");
        expect(result.retryable).toBe(true);
      }
    });

    it("does not log full request body", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200, json: () => Promise.resolve({}),
      } as any);

      await service.sendMessage("5511999999999", "secret message content", "default");

      const callArg = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(callArg.headers).not.toContain("secret message");
    });
  });

  describe("connectionState", () => {
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
        expect(result.state).toBe("CONNECTED");
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
        expect(result.state).toBe("DISCONNECTED");
      }
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

    it("returns PROVIDER_ERROR on non-JSON response", async () => {
      repo = makeRepo();
      const service = new WhatsAppInstanceService(repo);
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.reject(new Error("invalid json")),
      } as any);

      const result = await service.connectionState("default");

      expect(result.ok).toBe(false);
    });
  });
});
