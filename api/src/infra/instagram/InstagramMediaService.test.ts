import { describe, it, expect, afterEach, vi } from "vitest";
import { InstagramMediaService } from "./InstagramMediaService";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const imagePayload = {
  id: "m-1",
  media_type: "IMAGE",
  media_url: "https://cdn.example/a.jpg",
  permalink: "https://www.instagram.com/p/abc/",
  caption: "Culto de domingo",
  timestamp: "2026-08-10T10:00:00+0000",
};

const videoPayload = {
  id: "m-2",
  media_type: "VIDEO",
  media_url: "https://cdn.example/v.mp4",
  thumbnail_url: "https://cdn.example/t.jpg",
  permalink: "https://www.instagram.com/p/vid/",
  caption: "Momento de louvor",
  timestamp: "2026-08-09T10:00:00+0000",
};

const carouselPayload = {
  id: "m-3",
  media_type: "CAROUSEL_ALBUM",
  media_url: "https://cdn.example/c.jpg",
  permalink: "https://www.instagram.com/p/car/",
  caption: "Confraternizacao",
  timestamp: "2026-08-08T10:00:00+0000",
};

const childImage = { id: "c-1", media_type: "IMAGE", media_url: "https://cdn.example/c1.jpg" };
const childVideo = { id: "c-2", media_type: "VIDEO", media_url: "https://cdn.example/c2.mp4", thumbnail_url: "https://cdn.example/c2t.jpg" };

function makeService(overrides: { accessToken?: string | null; userId?: string | null } = {}) {
  return new InstagramMediaService({
    ...{ accessToken: "tok", userId: "u-pro", apiVersion: "v23.0", mediaLimit: 12, timeoutMs: 1000 },
    ...overrides,
  });
}

describe("InstagramMediaService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns available=false without calling Meta when not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const service = makeService({ accessToken: null, userId: null });
    const result = await service.fetchRecentMedia();

    expect(result).toEqual({ available: false, items: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps IMAGE media to the public DTO", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      const decodedUrl = decodeURIComponent(String(url));
      expect(decodedUrl).toContain("/v23.0/u-pro/media?");
      expect(decodedUrl).toContain("fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp");
      return jsonResponse({ data: [imagePayload] });
    });

    const result = await makeService().fetchRecentMedia();

    expect(result.available).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: "m-1",
      type: "IMAGE",
      caption: "Culto de domingo",
      mediaUrl: "https://cdn.example/a.jpg",
      thumbnailUrl: null,
      permalink: "https://www.instagram.com/p/abc/",
      timestamp: "2026-08-10T10:00:00+0000",
    });
  });

  it("maps VIDEO media keeping thumbnail_url", async () => {
    vi.stubGlobal("fetch", async () => jsonResponse({ data: [videoPayload] }));

    const result = await makeService().fetchRecentMedia();
    const item = result.items[0];

    expect(item.type).toBe("VIDEO");
    expect(item.mediaUrl).toBe("https://cdn.example/v.mp4");
    expect(item.thumbnailUrl).toBe("https://cdn.example/t.jpg");
  });

  it("fetches children for CAROUSEL_ALBUM and preserves the relationship", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      const decodedUrl = decodeURIComponent(String(url));
      if (decodedUrl.includes("/m-3/children")) {
        expect(decodedUrl).toContain("fields=id,media_type,media_url,thumbnail_url");
        return jsonResponse({ data: [childImage, childVideo] });
      }
      return jsonResponse({ data: [carouselPayload] });
    });

    const result = await makeService().fetchRecentMedia();
    const item = result.items[0];

    expect(item.type).toBe("CAROUSEL");
    expect(item.children).toHaveLength(2);
    expect(item.children![0]).toEqual({
      id: "c-1",
      type: "IMAGE",
      mediaUrl: "https://cdn.example/c1.jpg",
      thumbnailUrl: null,
    });
    expect(item.children![1].thumbnailUrl).toBe("https://cdn.example/c2t.jpg");
  });

  it("keeps the item but omits children when the children request fails", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if (String(url).includes("/m-3/children")) {
        return jsonResponse({ error: { message: "nope" } }, 400);
      }
      return jsonResponse({ data: [carouselPayload] });
    });

    const result = await makeService().fetchRecentMedia();

    expect(result.available).toBe(true);
    expect(result.items[0].type).toBe("CAROUSEL");
    expect(result.items[0].children).toBeUndefined();
  });

  it("returns available=false when the provider responds with an error payload", async () => {
    vi.stubGlobal("fetch", async () =>
      jsonResponse({ error: { message: "Session has expired", type: "OAuthException", code: 190 } }, 400),
    );

    const result = await makeService().fetchRecentMedia();

    expect(result).toEqual({ available: false, items: [] });
  });

  it("returns available=false on non-2xx status", async () => {
    vi.stubGlobal("fetch", async () => jsonResponse({ error: { message: "rate limited" } }, 429));

    const result = await makeService().fetchRecentMedia();

    expect(result).toEqual({ available: false, items: [] });
  });

  it("returns available=false when the response shape is invalid", async () => {
    vi.stubGlobal("fetch", async () => jsonResponse({ weird: true }));

    const result = await makeService().fetchRecentMedia();

    expect(result).toEqual({ available: false, items: [] });
  });

  it("returns available=false when the provider returns non-JSON", async () => {
    vi.stubGlobal("fetch", async () =>
      ({ ok: true, status: 200, json: async () => { throw new Error("not json"); }, text: async () => "" }) as unknown as Response,
    );

    const result = await makeService().fetchRecentMedia();

    expect(result).toEqual({ available: false, items: [] });
  });

  it("returns available=false when the request throws (network error)", async () => {
    vi.stubGlobal("fetch", async () => { throw new TypeError("fetch failed"); });

    const result = await makeService().fetchRecentMedia();

    expect(result).toEqual({ available: false, items: [] });
  });

  it("stringifies numeric media ids", async () => {
    vi.stubGlobal("fetch", async () =>
      jsonResponse({ data: [{ ...imagePayload, id: 123456 }] }),
    );

    const result = await makeService().fetchRecentMedia();

    expect(result.items[0].id).toBe("123456");
  });
});