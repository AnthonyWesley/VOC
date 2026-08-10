import { describe, it, expect, beforeEach, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { instagramRoutes } from "../../infra/http/instagramRoutes";
import { setInstagramService } from "../../../../infra/instagram/instagramContainer";
import { IInstagramService } from "../../../../infra/instagram/IInstagramService";
import { InstagramGalleryResult } from "../../../../infra/instagram/InstagramMediaTypes";

class FakeInstagramService implements IInstagramService {
  constructor(private readonly result: InstagramGalleryResult) {}

  async fetchRecentMedia(): Promise<InstagramGalleryResult> {
    return this.result;
  }
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/instagram", instagramRoutes);
  return app;
}

describe("0K — Instagram media public HTTP integration", () => {
  beforeEach(() => {
    setInstagramService(new FakeInstagramService({ available: false, items: [] }));
  });

  afterAll(() => {
    setInstagramService(new FakeInstagramService({ available: false, items: [] }));
  });

  it("GET /instagram/media/public returns 200 with the public DTO", async () => {
    setInstagramService(
      new FakeInstagramService({
        available: true,
        items: [
          {
            id: "m-1",
            type: "CAROUSEL",
            caption: "Culto",
            mediaUrl: null,
            thumbnailUrl: null,
            permalink: "https://www.instagram.com/p/abc/",
            timestamp: "2026-08-10T10:00:00+0000",
            children: [
              { id: "c-1", type: "IMAGE", mediaUrl: "https://cdn.example/c1.jpg", thumbnailUrl: null },
            ],
          },
        ],
      }),
    );

    const res = await request(makeApp()).get("/instagram/media/public");

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      id: "m-1",
      type: "CAROUSEL",
      permalink: "https://www.instagram.com/p/abc/",
    });
    expect(res.body.items[0].children).toHaveLength(1);
  });

  it("never returns 500 when Meta is unavailable", async () => {
    setInstagramService(new FakeInstagramService({ available: false, items: [] }));

    const res = await request(makeApp()).get("/instagram/media/public");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: false, items: [] });
  });
});