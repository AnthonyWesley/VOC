import { IInstagramService } from "./IInstagramService";
import {
  InstagramGalleryResult,
  InstagramMediaItem,
} from "./InstagramMediaTypes";

export class InstagramMediaCache implements IInstagramService {
  private cachedItems: InstagramMediaItem[] | null = null;
  private fetchedAt = 0;

  constructor(
    private readonly delegate: IInstagramService,
    private readonly ttlMs = 15 * 60 * 1000,
  ) {}

  async fetchRecentMedia(): Promise<InstagramGalleryResult> {
    const now = Date.now();

    if (this.cachedItems !== null && now - this.fetchedAt < this.ttlMs) {
      return { available: true, items: this.cachedItems };
    }

    const result = await this.delegate.fetchRecentMedia();

    if (result.available) {
      this.cachedItems = result.items;
      this.fetchedAt = now;
      return result;
    }

    if (this.cachedItems !== null) {
      return { available: true, items: this.cachedItems };
    }

    return { available: false, items: [] };
  }
}