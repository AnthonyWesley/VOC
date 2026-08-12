import { useParams } from "react-router-dom";
import Spin from "../../components/Spin";
import usePost from "../hooks/usePost";
import { PostCard } from "../components/PostCard";
import { PageHeader } from "../../components/PageHeader";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();

  const {
    queryPost: { data: post, isPending, error },
  } = usePost({ postId });

  if (isPending) return <Spin />;
  if (error || !post) return <p>Post não encontrado</p>;

  return (
    <div className="space-y-4 px-4 md:px-6">
      <PageHeader
        icon="mdi:rss-feed"
        title="Detalhes"
        subtitle="Visualização completa da publicação"
        back
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
      />

      <section className="mx-auto flex w-full max-w-2xl items-start justify-center">
        <PostCard
          key={post.id}
          post={post}
          canEdit
          canPublish
          canArchive
          canDelete
        />
      </section>
    </div>
  );
}
