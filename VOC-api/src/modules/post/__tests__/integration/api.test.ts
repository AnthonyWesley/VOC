import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../../../../app";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase } from "../../../../__tests__/helpers";

const jwt = new JwtProvider();
function authCookie(userId: string, level: number) {
  return `accessToken=${jwt.signAccessToken({ userId, userLevel: level, sessionId: "s" })}`;
}

describe("Post API", () => {
  let prisma: PrismaClient;
  let lToken: string;   // MINISTRY_LEADER (40)
  let mToken: string;   // MEMBER (10)
  const lId = "u-post-l";
  const mId = "u-post-m";

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    await cleanIntegrationDatabase(prisma);

    await prisma.role.createMany({
      data: [
        { id: "r-leader", name: "MINISTRY_LEADER", level: 40 },
        { id: "r-member", name: "MEMBER", level: 10 },
      ],
    });

    await prisma.user.createMany({
      data: [
        { id: lId, email: "leader@post.test", passwordHash: "h", isActive: true },
        { id: mId, email: "member@post.test", passwordHash: "h", isActive: true },
      ],
    });

    await prisma.userRole.createMany({
      data: [
        { userId: lId, roleId: "r-leader" },
        { userId: mId, roleId: "r-member" },
      ],
    });

    lToken = authCookie(lId, 40);
    mToken = authCookie(mId, 10);
  });

  afterAll(async () => {
    await prisma.post.deleteMany({ where: { authorId: { in: [lId, mId] } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: [lId, mId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [lId, mId] } } });
    await prisma.role.deleteMany({ where: { id: { in: ["r-leader", "r-member"] } } });
    await prisma.$disconnect();
  });

  it("POST /posts → 201, cria DRAFT", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Cookie", lToken)
      .send({ title: "Novo Post", content: "Conteúdo", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it("POST /posts/:id/publish → 200, DRAFT → PUBLISHED", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "Pub", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    const res = await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(c.body.id);
  });

  it("POST /posts/:id/archive → 200, PUBLISHED → ARCHIVED", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "Arc", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    const res = await request(app).post(`/posts/${c.body.id}/archive`).set("Cookie", lToken);
    expect(res.status).toBe(200);
  });

  it("POST /posts/:id/publish em ARCHIVED → 200, republica", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "Repub", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    await request(app).post(`/posts/${c.body.id}/archive`).set("Cookie", lToken);
    const res = await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    expect(res.status).toBe(200);
  });

  it("DELETE /posts/:id em DRAFT → 204, hard delete", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "DelDraft", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    const res = await request(app).delete(`/posts/${c.body.id}`).set("Cookie", lToken);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/posts/${c.body.id}`).set("Cookie", lToken);
    expect(getRes.status).toBe(404);
  });

  it("DELETE /posts/:id em PUBLISHED → 204, soft delete", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "DelPub", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    const res = await request(app).delete(`/posts/${c.body.id}`).set("Cookie", lToken);
    expect(res.status).toBe(204);
  });

  it("GET /posts/:id/public em ARCHIVED → 404", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "ArchHidden", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    await request(app).post(`/posts/${c.body.id}/archive`).set("Cookie", lToken);
    const res = await request(app).get(`/posts/${c.body.id}/public`);
    expect(res.status).toBe(404);
  });

  it("GET /posts/:id/public em DRAFT → 404", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "DraftHidden", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    const res = await request(app).get(`/posts/${c.body.id}/public`);
    expect(res.status).toBe(404);
  });

  it("GET /posts/:id em soft delete → 404 mesmo para autor", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "Gone", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    await request(app).delete(`/posts/${c.body.id}`).set("Cookie", lToken);
    const res = await request(app).get(`/posts/${c.body.id}`).set("Cookie", lToken);
    expect(res.status).toBe(404);
  });

  it("MEMBER sem permissão → 403 no publish", async () => {
    const c = await request(app).post("/posts").set("Cookie", lToken).send({ title: "Forbidden", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    const res = await request(app).post(`/posts/${c.body.id}/publish`).set("Cookie", mToken).send({ visibility: "PUBLIC" });
    expect(res.status).toBe(403);
  });

  it("sem token → 401", async () => {
    const res = await request(app).post("/posts/some-id/publish").send({ visibility: "PUBLIC" });
    expect(res.status).toBe(401);
  });

  it("GET /posts/public → 200, só PUBLISHED", async () => {
    // Create one published and one draft post
    const p = await request(app).post("/posts").set("Cookie", lToken).send({ title: "PubOnly", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });
    await request(app).post(`/posts/${p.body.id}/publish`).set("Cookie", lToken).send({ visibility: "PUBLIC" });
    await request(app).post("/posts").set("Cookie", lToken).send({ title: "DraftOnly", content: "C", category: "SERMON", visibility: "PUBLIC", authorId: lId });

    const res = await request(app).get("/posts/public");
    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
    for (const post of res.body.posts) {
      expect(post.status).toBe("PUBLISHED");
    }
  });
});
