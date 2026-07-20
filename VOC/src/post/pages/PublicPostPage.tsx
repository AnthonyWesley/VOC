import { useParams, useNavigate } from "react-router-dom";
import Spin from "../../components/Spin";
import usePost from "../hooks/usePost";
import { PostCard } from "../components/PostCard";
import Icon from "../../components/Icon";

export default function PublicPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const {
    queryPost: { data: post, isPending, error },
  } = usePost({ postId });

  if (isPending) return <Spin />;
  if (error || !post) return <p className="px-6 py-16 text-center text-red-400">Post não encontrado</p>;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(180,83,9,0.28),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#111827_45%,_#0f172a_100%)] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:arrow-left" />
          Voltar
        </button>
        <PostCard post={post} isPostPublic />
      </div>
    </div>
  );
}
