import { useState } from "react";
import Icon from "../../components/Icon";
import { PostCard } from "../../post/components/PostCard";

type PostCarouselProps = {
  posts: any[];
};

export default function PostCarousel({ posts }: PostCarouselProps) {
  const [index, setIndex] = useState(0);

  if (posts.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Nenhum post publicado ainda.
      </p>
    );
  }

  const total = posts.length;
  const safeIndex = Math.min(index, total - 1);
  const post = posts[safeIndex];

  return (
    <div className="space-y-4">
      <PostCard key={post.id} post={post} />

      {total > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={safeIndex === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/80 text-[var(--text-muted)] transition hover:bg-slate-800/30 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Post anterior"
          >
            <Icon icon="mdi:chevron-left" scale={0.6} />
          </button>

          <span className="text-xs font-medium text-[var(--text-muted)]">
            {safeIndex + 1} / {total}
          </span>

          <button
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={safeIndex >= total - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/80 text-[var(--text-muted)] transition hover:bg-slate-800/30 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Próximo post"
          >
            <Icon icon="mdi:chevron-right" scale={0.6} />
          </button>
        </div>
      )}
    </div>
  );
}
