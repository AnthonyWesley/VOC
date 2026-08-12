import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePublicPosts } from '../hooks/usePublicPosts';
import { PostSummary } from '../types/postTypes';

const CATEGORY_LABELS: Record<string, string> = {
  SERMON: 'Sermão',
  ANNOUNCEMENT: 'Aviso',
  EVENT_NEWS: 'Evento',
  DEVOTIONAL: 'Devocional',
};

export function NewsSection() {
  const { posts, queryPosts } = usePublicPosts(20);

  const [index, setIndex] = useState(0);

  if (queryPosts.isPending) {
    return (
      <p className="text-center text-sm font-medium tracking-[0.2em] text-slate-400 uppercase">
        Carregando notícias...
      </p>
    );
  }

  if (queryPosts.isError || posts.length === 0) {
    return null;
  }

  const safeIndex = Math.min(index, Math.max(0, posts.length - 1));
  const post = posts[safeIndex];

  return (
    <div className="mb-4 space-y-6">
      {post && <NewsCard post={post} />}

      {posts.length > 1 && (
        <div className="flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={safeIndex === 0}
            className="text-slate-300 transition hover:text-sky-700 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Notícia anterior"
          >
            <Icon icon="mdi:chevron-left" className="text-2xl" />
          </button>

          <span className="text-sm font-medium text-slate-400">
            {safeIndex + 1} / {posts.length}
          </span>

          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(posts.length - 1, i + 1))}
            disabled={safeIndex >= posts.length - 1}
            className="text-slate-300 transition hover:text-sky-700 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Próxima notícia"
          >
            <Icon icon="mdi:chevron-right" className="text-2xl" />
          </button>
        </div>
      )}
    </div>
  );
}

function NewsCard({ post }: { post: PostSummary }) {
  const publishedAt = post.publishedAt ?? post.firstPublishedAt ?? post.createdAt;

  return (
    <article className="border-b border-b-gray-500/10 pb-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="rounded-full bg-gray-800/60 px-3 py-1.5 font-medium text-slate-300">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>

        {publishedAt && (
          <time className="text-slate-400">
            {new Date(publishedAt).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        )}
      </div>

      <h3 className="mt-4 text-xl font-bold text-white sm:text-2xl">{post.title}</h3>

      {post.content && (
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">{post.content}</p>
      )}

      {post.author?.fullName && (
        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-sky-300">
            <Icon icon="mdi:account" className="text-lg" />
          </div>

          <span className="text-sm font-semibold text-slate-200">{post.author.fullName}</span>
        </div>
      )}
    </article>
  );
}