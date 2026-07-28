import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";
import { ErrorHandler } from "../../../../shared/middlewares/ErrorHandle";
import { createWhatsAppRoutes } from "../../infra/http/whatsappRoutes";
import type { IWhatsAppAdminService } from "../../../../infra/whatsapp/IWhatsAppAdminService";
import type { WhatsAppInstanceRepository } from "../../../../infra/whatsapp/WhatsAppInstanceRepository";
import type { RequestHandler } from "express";
import type {
  WhatsAppAdminResult,
  WhatsAppConnectionState,
  WhatsAppQrCode,
  WhatsAppInstanceInfo,
  CreateWhatsAppInstanceInput,
} from "../../../../infra/whatsapp/WhatsAppAdminResult";

const JWT_SECRET = "test-secret-0h4";

function authCookie(userId: string, level: number) {
  const token = jwt.sign({ userId, userLevel: level, sessionId: "s" }, JWT_SECRET, { expiresIn: "1h" });
  return `accessToken=${token}`;
}

function makeApp(adminService: IWhatsAppAdminService, repository: WhatsAppInstanceRepository, limiter: RequestHandler) {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/whatsapp", createWhatsAppRoutes({ adminService, instanceRepository: repository, limiter, prisma: {} as any }));
  app.use(ErrorHandler);
  return app;
}

class FakeAdminService implements IWhatsAppAdminService {
  public createFn = vi.fn();
  public getQrCodeFn = vi.fn();
  public connectionStateFn = vi.fn();
  public deleteInstanceFn = vi.fn();
  public restartInstanceFn = vi.fn();

  async createInstance(input: CreateWhatsAppInstanceInput): Promise<WhatsAppAdminResult<WhatsAppInstanceInfo>> {
    return this.createFn(input);
  }
  async getQrCode(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppQrCode>> {
    return this.getQrCodeFn(instanceName);
  }
  async connectionState(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>> {
    return this.connectionStateFn(instanceName);
  }
  async deleteInstance(instanceName: string): Promise<WhatsAppAdminResult<void>> {
    return this.deleteInstanceFn(instanceName);
  }
  async restartInstance(instanceName: string): Promise<WhatsAppAdminResult<WhatsAppConnectionState>> {
    return this.restartInstanceFn(instanceName);
  }
}

class FakeRepository implements WhatsAppInstanceRepository {
  public instances: Map<string, any> = new Map();

  constructor() {
    this.instances.set("existing-instance", { instanceName: "existing-instance", id: "i-1", isActive: true, number: "5511999999999", userId: "u-pres", createdAt: new Date(), updatedAt: new Date() });
  }

  async findActiveByName(instanceName: string) {
    const inst = this.instances.get(instanceName);
    return inst?.isActive ? inst : null;
  }
  async findByInstanceName(instanceName: string) {
    return this.instances.get(instanceName) ?? null;
  }
  async findActiveByUserId(userId: string) {
    for (const inst of this.instances.values()) {
      if (inst.userId === userId && inst.isActive) return inst;
    }
    return null;
  }
  async create(data: any) {
    this.instances.set(data.instanceName, { ...data, id: `i-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() });
    return this.instances.get(data.instanceName);
  }
  async deleteByInstanceName(instanceName: string) {
    this.instances.delete(instanceName);
  }
}

describe("0H.4 — WhatsApp Admin HTTP Integration", () => {
  const presToken = authCookie("u-pres", 100);
  const memberToken = authCookie("u-member", 10);
  let adminService: FakeAdminService;
  let repository: FakeRepository;
  let limiter: RequestHandler;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    adminService = new FakeAdminService();
    repository = new FakeRepository();
    limiter = ((_req: any, _res: any, next: any) => next()) as RequestHandler;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication and authorization", () => {
    it("GET /instance returns 401 without token", async () => {
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance");
      expect(res.status).toBe(401);
    });

    it("GET /instance returns 403 for MEMBER", async () => {
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance").set("Cookie", memberToken);
      expect(res.status).toBe(403);
    });

    it("GET /instance returns 200 for PRESIDENT", async () => {
      const app = makeApp(adminService, repository, limiter);
      adminService.connectionStateFn.mockResolvedValue({ ok: true, value: "CONNECTED" });
      const res = await request(app).get("/whatsapp/instance").set("Cookie", presToken);
      expect(res.status).toBe(200);
    });

    it("POST /instance returns 422 with invalid body", async () => {
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).post("/whatsapp/instance").set("Cookie", presToken).send({});
      expect(res.status).toBe(422);
      expect(adminService.createFn).not.toHaveBeenCalled();
    });
  });

  describe("GET /instance", () => {
    it("returns 404 when no active instance for user", async () => {
      const emptyRepo = new FakeRepository();
      emptyRepo.instances.clear();
      const app = makeApp(adminService, emptyRepo, limiter);
      const res = await request(app).get("/whatsapp/instance").set("Cookie", presToken);
      expect(res.status).toBe(404);
    });

    it("returns instance with state from adminService", async () => {
      adminService.connectionStateFn.mockResolvedValue({ ok: true, value: "CONNECTED" });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance").set("Cookie", presToken);
      expect(res.status).toBe(200);
      expect(res.body.instance.instanceName).toBe("existing-instance");
      expect(res.body.instance.state).toBe("CONNECTED");
    });
  });

  describe("POST /instance", () => {
    it("returns 201 on successful creation", async () => {
      adminService.createFn.mockResolvedValue({ ok: true, value: { instanceName: "new-inst", state: "CONNECTING", qrcode: "b64qr", pairingCode: null } });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).post("/whatsapp/instance").set("Cookie", presToken).send({ instanceName: "new-inst" });
      expect(res.status).toBe(201);
      expect(res.body.qrcode).toBe("b64qr");
      expect(res.body.pairingCode).toBeNull();
    });

    it("returns 409 when instance already exists locally", async () => {
      adminService.createFn.mockResolvedValue({ ok: true, value: { instanceName: "existing-instance", state: "CONNECTING" } });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).post("/whatsapp/instance").set("Cookie", presToken).send({ instanceName: "existing-instance" });
      expect(res.status).toBe(409);
    });

    it("returns 503 when NOT_CONFIGURED", async () => {
      adminService.createFn.mockResolvedValue({ ok: false, code: "NOT_CONFIGURED", retryable: false });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).post("/whatsapp/instance").set("Cookie", presToken).send({ instanceName: "test" });
      expect(res.status).toBe(503);
    });
  });

  describe("GET /instance/:instanceName/qrcode", () => {
    it("returns 404 when instance not in local DB", async () => {
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance/ghost/qrcode").set("Cookie", presToken);
      expect(res.status).toBe(404);
      expect(adminService.getQrCodeFn).not.toHaveBeenCalled();
    });

    it("returns QR code with fields not inverted", async () => {
      adminService.getQrCodeFn.mockResolvedValue({ ok: true, value: { qrcode: "b64data", pairingCode: "pair123" } });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance/existing-instance/qrcode").set("Cookie", presToken);
      expect(res.status).toBe(200);
      expect(res.body.qrcode).toBe("b64data");
      expect(res.body.pairingCode).toBe("pair123");
    });

    it("returns 503 on NOT_CONFIGURED", async () => {
      adminService.getQrCodeFn.mockResolvedValue({ ok: false, code: "NOT_CONFIGURED", retryable: false });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance/existing-instance/qrcode").set("Cookie", presToken);
      expect(res.status).toBe(503);
    });
  });

  describe("GET /instance/:instanceName/state", () => {
    it("returns 404 when instance not in local DB", async () => {
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance/ghost/state").set("Cookie", presToken);
      expect(res.status).toBe(404);
      expect(adminService.connectionStateFn).not.toHaveBeenCalled();
    });

    it("returns state from adminService", async () => {
      adminService.connectionStateFn.mockResolvedValue({ ok: true, value: "CONNECTED" });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).get("/whatsapp/instance/existing-instance/state").set("Cookie", presToken);
      expect(res.status).toBe(200);
      expect(res.body.state).toBe("CONNECTED");
    });
  });

  describe("DELETE /instance/:instanceName", () => {
    it("returns 204 and deletes even when provider returns INSTANCE_NOT_FOUND", async () => {
      adminService.deleteInstanceFn.mockResolvedValue({ ok: false, code: "INSTANCE_NOT_FOUND", retryable: false });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).delete("/whatsapp/instance/ghost").set("Cookie", presToken);
      expect(res.status).toBe(204);
    });

    it("returns 504 on provider TIMEOUT", async () => {
      adminService.deleteInstanceFn.mockResolvedValue({ ok: false, code: "TIMEOUT", retryable: true });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).delete("/whatsapp/instance/existing-instance").set("Cookie", presToken);
      expect(res.status).toBe(504);
    });

    it("returns 204 on successful delete", async () => {
      adminService.deleteInstanceFn.mockResolvedValue({ ok: true, value: undefined });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).delete("/whatsapp/instance/existing-instance").set("Cookie", presToken);
      expect(res.status).toBe(204);
    });
  });

  describe("POST /instance/:instanceName/restart", () => {
    it("returns 404 when instance not in local DB", async () => {
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).post("/whatsapp/instance/ghost/restart").set("Cookie", presToken);
      expect(res.status).toBe(404);
      expect(adminService.restartInstanceFn).not.toHaveBeenCalled();
    });

    it("returns 200 on successful restart", async () => {
      adminService.restartInstanceFn.mockResolvedValue({ ok: true, value: "CONNECTED" });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).post("/whatsapp/instance/existing-instance/restart").set("Cookie", presToken);
      expect(res.status).toBe(200);
    });

    it("returns 502 on PROVIDER_ERROR", async () => {
      adminService.restartInstanceFn.mockResolvedValue({ ok: false, code: "PROVIDER_ERROR", retryable: true });
      const app = makeApp(adminService, repository, limiter);
      const res = await request(app).post("/whatsapp/instance/existing-instance/restart").set("Cookie", presToken);
      expect(res.status).toBe(502);
    });
  });
});
