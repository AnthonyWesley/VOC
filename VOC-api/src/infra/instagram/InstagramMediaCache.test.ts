import { describe, it, expect, beforeEach, vi } from "vitest";
import { InstagramMediaCache } from "./InstagramMediaCache";
import { IInstagramService } from "./IInstagramService";
import { InstagramGalleryResult } from "./InstagramMediaTypes";

class FakeDelegate implements IInstagramService {
  public calls = 0;
  public result: InstagramGalleryResult;

  constructor(result: InstagramGalleryResult) {
    this.result = result;
  }

  async fetchRecentMedia(): Promise<InstagramGalleryResult> {
    this.calls += 1;
    return this.result;
  }
}

const items = [
  { id: "m-1", type: "IMAGE" as const, caption: null, mediaUrl: "https://cdn.example/a.jpg", thumbnailUrl: null, permalink: "https://www.instagram.com/p/abc/", timestamp: "2026-08-10T10:00:00+0000" },
];

describe("InstagramMediaCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("serves from the delegate once within TTL", async () => {
    const delegate = new FakeDelegate({ available: true, items });
    const cache = new InstagramMediaCache(delegate, 1000);

    const first = await cache.fetchRecentMedia();
    const second = await cache.fetchRecentMedia();

    expect(first).toEqual({ available: true, items });
    expect(second).toEqual({ available: true, items });
    expect(delegate.calls).toBe(1);
  });

  it("refreshes from the delegate after TTL expires", async () => {
    const delegate = new FakeDelegate({ available: true, items });
    const cache = new InstagramMediaCache(delegate, 1000);

    await cache.fetchRecentMedia();
    vi.advanceTimersByTime(2000);
    await cache.fetchRecentMedia();

    expect(delegate.calls).toBe(2);
  });

  it("serves the last known items when refresh fails after a successful fetch", async () => {
    const delegate = new FakeDelegate({ available: true, items });
    const cache = new InstagramMediaCache(delegate, 0);

    const first = await cache.fetchRecentMedia();
    delegate.result = { available: false, items: [] };
    const second = await cache.fetchRecentMedia();

    expect(first.available).toBe(true);
    expect(second).toEqual({ available: true, items: first.items });
    expect(delegate.calls).toBe(2);
  });

  it("reports unavailable when there is no cache and the delegate fails", async () => {
    const delegate = new FakeDelegate({ available: false, items: [] });
    const cache = new InstagramMediaCache(delegate, 1000);

    const result = await cache.fetchRecentMedia();

    expect(result).toEqual({ available: false, items: [] });
    expect(delegate.calls).toBe(1);
  });
});