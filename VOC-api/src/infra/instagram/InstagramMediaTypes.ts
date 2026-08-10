export type InstagramMediaKind = "IMAGE" | "VIDEO" | "CAROUSEL";

export type InstagramMediaChild = {
  id: string;
  type: "IMAGE" | "VIDEO";
  mediaUrl: string | null;
  thumbnailUrl: string | null;
};

export type InstagramMediaItem = {
  id: string;
  type: InstagramMediaKind;
  caption: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
  children?: InstagramMediaChild[];
};

export type InstagramGalleryResult = {
  available: boolean;
  items: InstagramMediaItem[];
};