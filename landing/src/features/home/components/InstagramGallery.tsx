import { Icon } from '@iconify/react';
import { useInstagramMedia } from '../hooks/useInstagramMedia';
import { InstagramMediaItem } from '../types/instagramTypes';
import { SitePhotoItem } from '../types/siteContentTypes';

type PreviewKind = { kind: 'image'; src: string } | { kind: 'video'; src: string; poster?: string };

function resolvePreview(item: InstagramMediaItem): PreviewKind | null {
  if (item.type === 'CAROUSEL') {
    const child = item.children?.find((c) => c.mediaUrl);
    if (!child) return null;
    return {
      kind: child.type === 'VIDEO' ? 'video' : 'image',
      src: child.mediaUrl as string,
      poster: child.thumbnailUrl ?? undefined,
    };
  }

  if (item.type === 'VIDEO') {
    if (!item.mediaUrl && !item.thumbnailUrl) return null;
    return {
      kind: 'video',
      src: item.mediaUrl ?? '',
      poster: item.thumbnailUrl ?? undefined,
    };
  }

  if (!item.mediaUrl) return null;
  return { kind: 'image', src: item.mediaUrl };
}

type InstagramGalleryProps = {
  fallbackItems?: SitePhotoItem[];
};

export function InstagramGallery({ fallbackItems }: InstagramGalleryProps) {
  const { data, isLoading } = useInstagramMedia();

  const hasInstagram = !!data?.available && data.items.length > 0;
  const hasFallback = !!fallbackItems && fallbackItems.length > 0;

  if (isLoading || (!hasInstagram && !hasFallback)) {
    return null;
  }

  const firstPermalink = hasInstagram ? data?.items[0]?.permalink : undefined;

  return (
    <section id="instagram" className="scroll-mt-32 bg-[#0b1320] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-sky-700 uppercase sm:tracking-[0.3em]">
            Instagram
          </p>

          <h2 className="mt-5 text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
            Fotos Recentes
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hasInstagram
            ? data!.items.map((item) => <InstagramCard key={item.id} item={item} />)
            : fallbackItems!.map((photo) => <FallbackPhotoCard key={photo.id} photo={photo} />)}
        </div>

        {hasInstagram && firstPermalink && (
          <div className="mt-10 flex justify-center">
            <a
              href={firstPermalink}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[48px] items-center justify-center gap-2 border border-white/10 px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase transition hover:bg-white/5"
            >
              <Icon icon="mdi:instagram" className="text-lg" />
              Seguir no Instagram
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function FallbackPhotoCard({ photo }: { photo: SitePhotoItem }) {
  const content = (
    <>
      <div className="relative aspect-square overflow-hidden bg-[#071126]">
        <img
          src={photo.imageUrl}
          alt={photo.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {photo.title && (
        <div className="p-5">
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{photo.title}</p>
        </div>
      )}
    </>
  );

  if (!photo.sourceUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071126]">
        {content}
      </div>
    );
  }

  return (
    <a
      href={photo.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#071126] transition hover:border-sky-700/60"
    >
      {content}
    </a>
  );
}

function InstagramCard({ item }: { item: InstagramMediaItem }) {
  const preview = resolvePreview(item);

  const content = (
    <>
      <div className="relative aspect-square overflow-hidden bg-[#071126]">
        {preview?.kind === 'video' ? (
          <video
            src={preview.src}
            poster={preview.poster}
            className="h-full w-full object-cover"
            muted
            preload="none"
          />
        ) : (
          <img
            src={preview?.src}
            alt={item.caption ?? 'Publicação do Instagram'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        {item.type === 'CAROUSEL' && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold">
            <Icon icon="mdi:layers-triple" className="text-sm" />
            {item.children?.length ?? 1}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
          <Icon icon="mdi:instagram" className="text-base text-sky-700" />
          Instagram
          {item.type === 'VIDEO' && <span>· Reel</span>}
        </div>

        {item.caption && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{item.caption}</p>
        )}
      </div>
    </>
  );

  if (!item.permalink) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071126]">{content}</div>
    );
  }

  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#071126] transition hover:border-sky-700/60"
    >
      {content}
    </a>
  );
}