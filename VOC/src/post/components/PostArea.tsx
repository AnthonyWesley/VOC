import { useState } from "react";
import Spin from "../../components/Spin";
import { FormInput } from "../../components/FormInput";
import Icon from "../../components/Icon";
import usePost from "../hooks/usePost";
import { PostCard } from "./PostCard";
import { PostCategory } from "../types/postTypes";

type PostAreaProps = {
  mode: "public" | "private";
};

const CATEGORY_LABELS: Record<string, string> = {
  SERMON: "Sermão",
  ANNOUNCEMENT: "Aviso",
  EVENT_NEWS: "Evento",
  DEVOTIONAL: "Devocional",
};

const STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Publicados", value: "PUBLISHED" },
  { label: "Rascunhos", value: "DRAFT" },
  { label: "Arquivados", value: "ARCHIVED" },
];

export default function PostArea({ mode }: PostAreaProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [index, setIndex] = useState(0);

  const { allPosts, queryPosts } = usePost({
    limit: mode === "public" ? 50 : 20,
    status: mode === "public" ? undefined : statusFilter !== "all" ? statusFilter : undefined,
  });
  const { isPending, error, isFetchingNextPage, hasNextPage, fetchNextPage } = queryPosts;

  if (isPending) return <Spin />;
  if (error) return <p>Erro ao carregar posts</p>;

  const filtered =
    categoryFilter === "all"
      ? allPosts
      : allPosts.filter((p: any) => p.category === categoryFilter);

  const categoryOptions = [
    { label: "Todos", value: "all" },
    ...Object.values(PostCategory).map((cat) => ({
      label: CATEGORY_LABELS[cat] ?? cat,
      value: cat,
    })),
  ];

  const total = filtered.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));

  if (mode === "public") {
    return (
      <div className="mb-4 space-y-6">
        {total > 0 && (
          <PostCard key={filtered[safeIndex].id} post={filtered[safeIndex]} isPostPublic />
        )}

        {total > 1 && (
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              className="btn btn-circle btn-ghost btn-sm text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon icon="mdi:chevron-left" className="text-2xl" />
            </button>

            <span className="text-sm font-medium text-[var(--text-muted)]">
              {safeIndex + 1} / {total}
            </span>

            <button
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={safeIndex >= total - 1}
              className="btn btn-circle btn-ghost btn-sm text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon icon="mdi:chevron-right" className="text-2xl" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-4">
      <div className="flex justify-end gap-2">
        <FormInput
          icon="mdi:filter-outline"
          type="select"
          variant="md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
        />
        <FormInput
          icon="mdi:filter-outline"
          type="select"
          variant="md"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categoryOptions}
        />
      </div>

      <div className="space-y-6">
        {filtered.map((p: any) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn btn-ghost border border-[var(--card-border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}
