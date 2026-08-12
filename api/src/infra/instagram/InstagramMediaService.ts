import { createLogger } from "../../shared/logger/logger";
import { IInstagramService } from "./IInstagramService";
import {
  InstagramMediaChild,
  InstagramGalleryResult,
  InstagramMediaItem,
} from "./InstagramMediaTypes";
import {
  instagramMediaChildrenSchema,
  instagramMediaListSchema,
} from "./instagramSchemas";

const BASE_URL = "https://graph.instagram.com";
const DEFAULT_TIMEOUT_MS = 10_000;

type RawMedia = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string | null;
  caption: string | null;
  timestamp: string | null;
};

const logger = createLogger("instagram-service");

export type InstagramMediaServiceConfig = {
  accessToken?: string | null;
  userId?: string | null;
  apiVersion?: string | null;
  mediaLimit?: number;
  timeoutMs?: number;
};

export class InstagramMediaService implements IInstagramService {
  private readonly accessToken: string | null;
  private readonly userId: string | null;
  private readonly apiVersion: string;
  private readonly mediaLimit: number;
  private readonly timeoutMs: number;

  constructor(config: InstagramMediaServiceConfig = {}) {
    this.accessToken = config.accessToken ?? process.env.INSTAGRAM_ACCESS_TOKEN ?? null;
    this.userId = config.userId ?? process.env.INSTAGRAM_USER_ID ?? null;
    this.apiVersion = config.apiVersion ?? process.env.INSTAGRAM_API_VERSION ?? "v23.0";
    this.mediaLimit = resolveLimit(config.mediaLimit);
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async fetchRecentMedia(): Promise<InstagramGalleryResult> {
    if (!this.accessToken || !this.userId) {
      return { available: false, items: [] };
    }

    const url = this.buildMedialistUrl();
    const raw = await this.fetchJson(url, "media_list");
    if (raw === null) {
      return { available: false, items: [] };
    }

    const parsed = instagramMediaListSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn({ operation: "instagram_media_list", resultCode: "INVALID_PROVIDER_RESPONSE" }, "Media list returned unexpected shape");
      return { available: false, items: [] };
    }

    const rawItems = parsed.data.data.map(mapRawMedia);

    const items: InstagramMediaItem[] = [];
    for (const rawItem of rawItems) {
      items.push(await this.toItem(rawItem));
    }

    return { available: true, items };
  }

  private buildMedialistUrl(): string {
    const base = `${BASE_URL}/${this.apiVersion}/${this.userId}/media`;
    const params = new URLSearchParams({
      fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
      limit: String(this.mediaLimit),
      access_token: this.accessToken as string,
    });
    return `${base}?${params.toString()}`;
  }

  private buildChildrenUrl(mediaId: string): string {
    const base = `${BASE_URL}/${this.apiVersion}/${mediaId}/children`;
    const params = new URLSearchParams({
      fields: "id,media_type,media_url,thumbnail_url",
      access_token: this.accessToken as string,
    });
    return `${base}?${params.toString()}`;
  }

  private async toItem(raw: RawMedia): Promise<InstagramMediaItem> {
    const base: InstagramMediaItem = {
      id: raw.id,
      type: raw.media_type === "CAROUSEL_ALBUM" ? "CAROUSEL" : raw.media_type,
      caption: raw.caption,
      mediaUrl: raw.media_url,
      thumbnailUrl: raw.thumbnail_url,
      permalink: raw.permalink ?? "",
      timestamp: raw.timestamp ?? "",
    };

    if (raw.media_type !== "CAROUSEL_ALBUM") {
      return base;
    }

    const children = await this.fetchChildren(raw.id);
    if (children) {
      base.children = children;
    }
    return base;
  }

  private async fetchChildren(mediaId: string): Promise<InstagramMediaChild[] | undefined> {
    const url = this.buildChildrenUrl(mediaId);
    const raw = await this.fetchJson(url, "children");
    if (raw === null) {
      return undefined;
    }

    const parsed = instagramMediaChildrenSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn({ operation: "instagram_children", mediaId, resultCode: "INVALID_PROVIDER_RESPONSE" }, "Children returned unexpected shape");
      return undefined;
    }

    return parsed.data.data.map((child): InstagramMediaChild => ({
      id: String(child.id),
      type: child.media_type,
      mediaUrl: child.media_url ?? null,
      thumbnailUrl: child.thumbnail_url ?? null,
    }));
  }

  private async fetchJson(url: string, operation: string): Promise<unknown> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const durationMs = Date.now() - start;

      if (!res.ok) {
        logger.warn({ operation: `instagram_${operation}`, httpStatus: res.status, resultCode: "PROVIDER_ERROR", durationMs }, "Provider returned non-2xx");
        return null;
      }

      try {
        return await res.json();
      } catch {
        logger.warn({ operation: `instagram_${operation}`, resultCode: "INVALID_PROVIDER_RESPONSE", durationMs }, "Provider returned non-JSON response");
        return null;
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const isAbort = err?.name === "AbortError";
      logger.warn({ operation: `instagram_${operation}`, resultCode: isAbort ? "TIMEOUT" : "NETWORK_ERROR", durationMs: Date.now() - start }, "Provider request failed");
      return null;
    }
  }
}

function mapRawMedia(media: {
  id: string | number | undefined;
  media_type: RawMedia["media_type"];
  media_url?: string | null | undefined;
  thumbnail_url?: string | null | undefined;
  permalink?: string | null | undefined;
  caption?: string | null | undefined;
  timestamp?: string | null | undefined;
}): RawMedia {
  return {
    id: String(media.id),
    media_type: media.media_type,
    media_url: media.media_url ?? null,
    thumbnail_url: media.thumbnail_url ?? null,
    permalink: media.permalink ?? null,
    caption: media.caption ?? null,
    timestamp: media.timestamp ?? null,
  };
}

function resolveLimit(value: number | undefined): number {
  const candidate = value ?? Number(process.env.INSTAGRAM_MEDIA_LIMIT);
  if (Number.isInteger(candidate) && candidate >= 1 && candidate <= 100) {
    return candidate;
  }
  return 12;
}