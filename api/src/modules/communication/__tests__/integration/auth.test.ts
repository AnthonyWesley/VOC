import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";
import { makeAuthMiddleware } from "../../infra/http/middlewares/authMiddleware";
import { requireLevel } from "../../infra/http/middlewares/requireLevel";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { LEVEL } from "../../../../shared/constants/levels";
import { ErrorHandler } from "../../../../shared/middlewares/ErrorHandle";

const JWT_SECRET = "test-auth-secret-0h1";
const ACCESS_EXPIRES_IN = "1d";

function makeToken(payload: Record<string, unknown>, expiresIn = "1h"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

function setCookie(token: string): string {
  return `accessToken=${token}`;
}

describe("0H.1 — Auth middleware HTTP integration", () => {
  let app: express.Express;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;

    app = express();
    app.use(cookieParser());

    const auth = makeAuthMiddleware(new JwtProvider());

    app.get("/test/public", (_req, res) => {
      res.status(200).json({ ok: true });
    });

    app.get("/test/member", auth, requireLevel(LEVEL.MEMBER), (req, res) => {
      res.status(200).json({ ok: true, userId: req.auth!.userId, userLevel: req.auth!.userLevel });
    });

    app.get("/test/treasurer", auth, requireLevel(LEVEL.TREASURER), (req, res) => {
      res.status(200).json({ ok: true });
    });

    app.post("/test/president", auth, requireLevel(LEVEL.PRESIDENT), (req, res) => {
      res.status(200).json({ ok: true });
    });

    app.use(ErrorHandler);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe("missing or invalid token", () => {
    it("returns 401 when no cookie is sent", async () => {
      const res = await request(app).get("/test/member");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("MISSING_ACCESS_TOKEN");
    });

    it("returns 401 when cookie has empty value", async () => {
      const res = await request(app)
        .get("/test/member")
        .set("Cookie", "accessToken=");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("MISSING_ACCESS_TOKEN");
    });

    it("returns 401 for malformed token", async () => {
      const res = await request(app)
        .get("/test/member")
        .set("Cookie", setCookie("not-a-jwt-token"));
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_OR_EXPIRED_TOKEN");
    });

    it("returns 401 for expired token", async () => {
      const token = jwt.sign(
        { userId: "u1", userLevel: 10, exp: Math.floor(Date.now() / 1000) - 10 },
        JWT_SECRET,
      );
      const res = await request(app)
        .get("/test/member")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_OR_EXPIRED_TOKEN");
    });

    it("returns 401 for token signed with different secret", async () => {
      const token = jwt.sign({ userId: "u1", userLevel: 10 }, "wrong-secret");
      const res = await request(app)
        .get("/test/member")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_OR_EXPIRED_TOKEN");
    });
  });

  describe("level-based access control", () => {
    it("allows access when level exactly matches requirement", async () => {
      const token = makeToken({ userId: "u1", userLevel: LEVEL.MEMBER });
      const res = await request(app)
        .get("/test/member")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe("u1");
      expect(res.body.userLevel).toBe(LEVEL.MEMBER);
    });

    it("allows access when level exceeds requirement", async () => {
      const token = makeToken({ userId: "u1", userLevel: LEVEL.PRESIDENT });
      const res = await request(app)
        .get("/test/treasurer")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(200);
    });

    it("allows treasurer (level 80) on treasurer route", async () => {
      const token = makeToken({ userId: "u1", userLevel: LEVEL.TREASURER });
      const res = await request(app)
        .get("/test/treasurer")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(200);
    });

    it("denies access when level is one below requirement", async () => {
      const token = makeToken({ userId: "u1", userLevel: LEVEL.MEMBER - 1 });
      const res = await request(app)
        .get("/test/member")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("INSUFFICIENT_PERMISSION_LEVEL");
    });

    it("denies access when level is one below treasurer requirement", async () => {
      const token = makeToken({ userId: "u1", userLevel: LEVEL.TREASURER - 1 });
      const res = await request(app)
        .get("/test/treasurer")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(403);
    });

    it("denies access when level is far below requirement", async () => {
      const token = makeToken({ userId: "u1", userLevel: 0 });
      const res = await request(app)
        .post("/test/president")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(403);
    });

    it("defaults missing userLevel to 0, denying any protected route", async () => {
      const token = makeToken({ userId: "u1" });
      const res = await request(app)
        .get("/test/member")
        .set("Cookie", setCookie(token));
      expect(res.status).toBe(403);
    });
  });

  describe("public routes", () => {
    it("public route works without token", async () => {
      const res = await request(app).get("/test/public");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("public route ignores invalid token", async () => {
      const res = await request(app)
        .get("/test/public")
        .set("Cookie", setCookie("invalid-token"));
      expect(res.status).toBe(200);
    });
  });

  describe("error response shape", () => {
    it("UnauthorizedError returns expected JSON shape", async () => {
      const res = await request(app).get("/test/member");
      expect(res.body).toMatchObject({
        code: "MISSING_ACCESS_TOKEN",
        message: expect.any(String),
        details: null,
      });
    });

    it("ForbiddenError returns expected JSON shape", async () => {
      const token = makeToken({ userId: "u1", userLevel: 0 });
      const res = await request(app)
        .post("/test/president")
        .set("Cookie", setCookie(token));
      expect(res.body).toMatchObject({
        code: "INSUFFICIENT_PERMISSION_LEVEL",
        message: expect.any(String),
        details: null,
      });
    });
  });
});
