export type SiteBannerItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  videoUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type SitePhotoItem = {
  id: string;
  title: string;
  imageUrl: string;
  sourceUrl?: string;
};

export type SiteVideoItem = {
  id: string;
  title: string;
  platform: string;
  embedUrl: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
};

export type SiteContentDTO = {
  churchName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  aboutTitle: string;
  aboutDescription: string;
  addressTitle: string;
  addressLine1: string;
  addressLine2: string;
  contactPhone: string | null;
  contactEmail: string | null;
  footerText: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  banners: SiteBannerItem[];
  photos: SitePhotoItem[];
  videos: SiteVideoItem[];
  updatedAt: string;
};