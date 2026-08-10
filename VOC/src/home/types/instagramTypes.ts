export type InstagramMediaChild = {
  id: string;
  type: "IMAGE" | "VIDEO";
  mediaUrl: string | null;
  thumbnailUrl: string | null;
};

export type InstagramMediaItem = {
  id: string;
  type: "IMAGE" | "VIDEO" | "CAROUSEL";
  caption: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
  children?: InstagramMediaChild[];
};

export type InstagramGallery = {
  available: boolean;
  items: InstagramMediaItem[];
};