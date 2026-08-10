import { z } from "zod";

const nullableUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().nullish(),
);

export const instagramMediaItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    media_type: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
    media_url: nullableUrl,
    thumbnail_url: nullableUrl,
    permalink: nullableUrl,
    caption: z.string().nullish(),
    timestamp: z.string().nullish(),
  })
  .passthrough();

export const instagramChildItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    media_type: z.enum(["IMAGE", "VIDEO"]),
    media_url: nullableUrl,
    thumbnail_url: nullableUrl,
  })
  .passthrough();

export const instagramMediaListSchema = z
  .object({
    data: z.array(instagramMediaItemSchema),
  })
  .passthrough();

export const instagramMediaChildrenSchema = z
  .object({
    data: z.array(instagramChildItemSchema),
  })
  .passthrough();