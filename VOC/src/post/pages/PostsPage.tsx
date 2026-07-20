import useAuthStatus from "../../auth/hooks/useAuthStatus";
import Modal from "../../components/Modal";
import Spin from "../../components/Spin";
import PostArea from "../components/PostArea";
import PostForm from "../components/PostForm";
import { PageHeader } from "../../components/PageHeader";
import { useModalStore } from "../../store/useModalStore";
import { LEVEL } from "../../shared/constants/levels";

export default function PostsPage() {
  const { authUserId, isPending } = useAuthStatus();
  const { openModal } = useModalStore();
  if (isPending) return <Spin />;

  return (
    <div className="space-y-4 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon="mdi:rss-feed"
        title="Feed"
        subtitle="Publicações e comunicados da igreja"
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
        onNew={() => {
          openModal("createPostModal");
        }}
        minLevel={LEVEL.MINISTRY_LEADER}
      />

      {/* ÁREA DE POSTS */}
      <section className="mx-auto lg:w-lg">
        <PostArea mode="private" />
      </section>

      {/* MODAL DE CRIAÇÃO */}
      <Modal id="createPostModal" className="flex" info="Registrar" scale={1.2}>
        <PostForm authorId={authUserId ?? ""} />
      </Modal>
    </div>
  );
}
