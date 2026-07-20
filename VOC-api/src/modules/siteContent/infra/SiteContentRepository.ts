import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const bannerSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subtitle: z.string().optional(),
  imageUrl: z.string().url().or(z.string().max(0)),
  videoUrl: z.string().url().optional().or(z.literal("")),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
});

const photoSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  imageUrl: z.string().url().or(z.string().max(0)),
  sourceUrl: z.string().url().optional().or(z.literal("")),
});

const videoSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  platform: z.string(),
  embedUrl: z.string().url().or(z.string().max(0)),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
});

export type SiteBannerItem = z.infer<typeof bannerSchema>;
export type SitePhotoItem = z.infer<typeof photoSchema>;
export type SiteVideoItem = z.infer<typeof videoSchema>;

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
  updatedAt: Date;
};

export type SiteContentUpdateInput = Omit<SiteContentDTO, "updatedAt">;

export class SiteContentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async ensureSettings() {
    return this.prisma.siteContentSettings.upsert({
      where: { id: "main" },
      update: {},
      create: { id: "main" },
    });
  }

  private parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private map(data: Awaited<ReturnType<SiteContentRepository["ensureSettings"]>>): SiteContentDTO {
    return {
      churchName: data.churchName,
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      heroDescription: data.heroDescription,
      aboutTitle: data.aboutTitle,
      aboutDescription: data.aboutDescription,
      addressTitle: data.addressTitle,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      footerText: data.footerText,
      primaryCtaLabel: data.primaryCtaLabel,
      primaryCtaUrl: data.primaryCtaUrl,
      secondaryCtaLabel: data.secondaryCtaLabel,
      secondaryCtaUrl: data.secondaryCtaUrl,
      instagramUrl: data.instagramUrl,
      facebookUrl: data.facebookUrl,
      youtubeUrl: data.youtubeUrl,
      banners: this.parseJson<SiteBannerItem[]>(data.bannersJson, []),
      photos: this.parseJson<SitePhotoItem[]>(data.photosJson, []),
      videos: this.parseJson<SiteVideoItem[]>(data.videosJson, []),
      updatedAt: data.updatedAt,
    };
  }

  async get(): Promise<SiteContentDTO> {
    const data = await this.ensureSettings();
    return this.map(data);
  }

  async update(input: SiteContentUpdateInput): Promise<SiteContentDTO> {
    if (input.banners) {
      input.banners = z.array(bannerSchema).parse(input.banners);
    }
    if (input.photos) {
      input.photos = z.array(photoSchema).parse(input.photos);
    }
    if (input.videos) {
      input.videos = z.array(videoSchema).parse(input.videos);
    }

    const data = await this.prisma.siteContentSettings.update({
      where: { id: "main" },
      data: {
        churchName: input.churchName,
        heroTitle: input.heroTitle,
        heroSubtitle: input.heroSubtitle,
        heroDescription: input.heroDescription,
        aboutTitle: input.aboutTitle,
        aboutDescription: input.aboutDescription,
        addressTitle: input.addressTitle,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        footerText: input.footerText,
        primaryCtaLabel: input.primaryCtaLabel,
        primaryCtaUrl: input.primaryCtaUrl,
        secondaryCtaLabel: input.secondaryCtaLabel,
        secondaryCtaUrl: input.secondaryCtaUrl,
        instagramUrl: input.instagramUrl,
        facebookUrl: input.facebookUrl,
        youtubeUrl: input.youtubeUrl,
        bannersJson: JSON.stringify(input.banners ?? []),
        photosJson: JSON.stringify(input.photos ?? []),
        videosJson: JSON.stringify(input.videos ?? []),
      },
    });

    return this.map(data);
  }
}
