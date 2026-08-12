import { useNavigate, useParams } from "react-router-dom";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { CardActions } from "../../components/CardActions";
import Icon from "../../components/Icon";
import { usePostMutations } from "../hooks/usePostMutations";
import { PostSummary, PostStatus } from "../types/postTypes";
import PostForm from "./PostForm";
import { Balloon } from "../../components/Balloon";
import Avatar from "../../components/Avatar";
import { LEVEL } from "../../shared/constants/levels";

interface PostCardProps {
  post: PostSummary;
  canEdit?: boolean;
  canPublish?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
}

const STATUS_LABEL: Record<PostStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const STATUS_ICON: Record<PostStatus, string> = {
  DRAFT: "mdi:file-document-outline",
  PUBLISHED: "mdi:earth",
  ARCHIVED: "mdi:archive-outline",
};

const STATUS_COLOR: Record<PostStatus, string> = {
  DRAFT: "text-gray-400",
  PUBLISHED: "text-sky-300",
  ARCHIVED: "text-amber-400",
};

export function PostCard({
  post,
  canEdit,
  canPublish,
  canArchive,
  canDelete,
}: PostCardProps) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { publishPost, archivePost, deletePost } = usePostMutations();
  const { authUserId, authLevel } = useAuthStatus();

  const isOwner = post.authorId === authUserId;
  const isPresident = authLevel >= 100;
  const canManage = canEdit ?? (isOwner || isPresident);

  const handlePublish = () => {
    publishPost.mutate({
      postId: post.id,
      visibility: post.visibility ?? "PUBLIC",
    });
  };

  const handleArchive = () => {
    archivePost.mutate(post.id);
  };

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja remover este post?")) {
      deletePost.mutate(post.id);
    }
  };

  const isVisible = post.status === "PUBLISHED";

  return (
    <div className="group card-hover relative my-8 flex w-full flex-col items-start justify-between border-b border-b-gray-500/10">
      <section
        onClick={
          !postId
            ? () =>
                navigate(`/post/${post.id}`,)
            : () => {}
        }
        className="w-full"
      >
        <Balloon
          direction="bottom"
          className={`${postId ? "" : "h-46"} w-full ${isVisible ? "opacity-100" : "opacity-40"}`}
        >
          <div className="flex items-center gap-x-4 text-xs">
            <span className={`flex items-center gap-1 ${STATUS_COLOR[post.status]}`}>
              <Icon icon={STATUS_ICON[post.status]} info={STATUS_LABEL[post.status]} />
              <span className="text-xs">{STATUS_LABEL[post.status]}</span>
            </span>

            {post.publishedAt && (
              <time className="text-gray-400">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            )}

            <span className="relative z-10 rounded-full bg-gray-800/60 px-3 py-1.5 font-medium text-gray-300 hover:bg-gray-800">
              {post.category}
            </span>
          </div>

          <div className="group relative grow">
            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)] group-hover:text-gray-300">
              <span className="absolute inset-0"></span>
              {post.title}
            </h3>
          </div>
        </Balloon>
      </section>

      <div
        className={`${isVisible ? "opacity-100" : "opacity-40"} relative mt-5 flex items-center gap-x-4 justify-self-end pb-2`}
      >
        <Avatar
          name={post.author?.fullName ?? "Author"}
          image={post.author?.photoUrl ?? ""}
          size="40"
        />

        <div className="flex w-full flex-col text-sm">
          <p className="font-semibold text-[var(--text-primary)]">{post.author?.fullName}</p>
          {post.author?.roles?.length > 0 && (
            <span className="text-gray-400">
              {post.author.roles.map((r) => r.name).join(" | ")}
            </span>
          )}
        </div>
      </div>

      {canManage && (
        <CardActions
          direction="horizontal"
          actions={[
            {
              icon: "mdi:account-edit",
              info: "Editar post",
              modalId: `editPostModal-${post.id}`,
              scale: 0.8,
              content: <PostForm post={post} />,
              minLevel: LEVEL.MINISTRY_LEADER,
            },
            ...(canPublish ?? (post.status === "DRAFT" || post.status === "ARCHIVED"))
              ? [
                  {
                    icon: "mdi:publish",
                    info: "Publicar",
                    onClick: handlePublish,
                    scale: 0.8,
                  },
                ]
              : [],
            ...(canArchive ?? post.status === "PUBLISHED")
              ? [
                  {
                    icon: "mdi:archive-outline",
                    info: "Arquivar",
                    onClick: handleArchive,
                    scale: 0.8,
                  },
                ]
              : [],
            ...(canDelete ?? true)
              ? [
                  {
                    icon: "mdi:delete-outline",
                    info: "Remover",
                    onClick: handleDelete,
                    scale: 0.8,
                  },
                ]
              : [],
          ]}
        />
      )}
    </div>
  );
}
