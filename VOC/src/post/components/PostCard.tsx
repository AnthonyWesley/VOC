import { useNavigate, useParams } from "react-router-dom";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { CardActions } from "../../components/CardActions";
import Icon from "../../components/Icon";
import { usePostMutations } from "../hooks/usePostMutations";
import { ListPostOutput } from "../types/postTypes";
import PostForm from "./PostForm";
import { Balloon } from "../../components/Balloon";
import Avatar from "../../components/Avatar";
import { LEVEL } from "../../shared/constants/levels";

interface PostCardProps {
  post: ListPostOutput;
  isPostPublic?: boolean;
}

export function PostCard({ post, isPostPublic }: PostCardProps) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { publishPost, unpublishPost } = usePostMutations();
  const { authUserId, authLevel } = useAuthStatus();

  const isOwner = post.authorId === authUserId;
  const isPresident = authLevel >= 100;
  const canManage = isOwner || isPresident;

  const handlePublishToggle = () => {
    if (post.publishedAt) {
      unpublishPost.mutate({ postId: post.id });
    } else {
      publishPost.mutate({
        postId: post.id,
        visibility: post.visibility ?? "PUBLIC",
      });
    }
  };

  return (
    <div
      className={`group card-hover relative my-8 flex w-full flex-col items-start justify-between border-b border-b-gray-500/10`}
    >
      <section
        onClick={
          !postId
            ? () =>
                navigate(
                  isPostPublic ? `/post/${post.id}` : `/app/posts/${post.id}`,
                )
            : () => {}
        }
        className="w-full"
      >
        <Balloon
          direction="bottom"
          className={`${postId ? "" : "h-46"} w-full ${post.publishedAt ? "opacity-100" : "opacity-40"}`}
        >
          {/* Top info */}
          <div className="flex items-center gap-x-4 text-xs">
            <span
              className={`flex items-center gap-1 ${post?.publishedAt ? "text-sky-300" : "text-gray-300"}`}
            >
              <Icon
                icon={post?.publishedAt ? "mdi:earth" : "mdi:earth-off"}
                info={post?.publishedAt ? "Publicado" : "Não publicado"}
              />
            </span>

            {post?.publishedAt && (
              <time className="text-gray-400">
                {new Date(post?.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            )}

            <span className="relative z-10 rounded-full bg-gray-800/60 px-3 py-1.5 font-medium text-gray-300 hover:bg-gray-800">
              {post?.category}
            </span>

            {/* <span className="ml-auto flex items-center gap-1 text-gray-300">
              <Icon icon="lsicon:view-outline" info="Visualizações" />
              150
            </span> */}
          </div>

          {/* Title + content */}

          <div className="group relative grow">
            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)] group-hover:text-gray-300">
              <span className="absolute inset-0"></span>
              {post?.title}
            </h3>

            <p
              className={`${postId ? "" : "line-clamp-1"} mt-1.5 text-sm text-gray-400`}
            >
              {post?.content}
            </p>
          </div>
        </Balloon>
      </section>

      {/* Author */}
      <div
        className={`${post.publishedAt ? "opacity-100" : "opacity-40"} relative mt-5 flex items-center gap-x-4 justify-self-end pb-2`}
      >
        <Avatar
          name={post?.author?.fullName ?? "Author"}
          image={post?.author?.photoUrl ?? ""}
          size="40"
        />

        <div className="flex w-full flex-col text-sm">
          <p className="font-semibold text-[var(--text-primary)]">{post?.author?.fullName}</p>

          {post?.author?.roles?.length > 0 && (
            <span className="text-gray-400">
              {post.author.roles.map((r) => r.name).join(" | ")}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isPostPublic && (
        <CardActions
          direction="horizontal"
          actions={[
            ...(canManage
              ? [
                  {
                    icon: "mdi:account-edit",
                    info: "Editar post",
                    modalId: `editPostModal-${post?.id}`,
                    scale: 0.8,
                    content: <PostForm authorId={authUserId ?? ""} post={post} />,
                    minLevel: LEVEL.MINISTRY_LEADER,
                  },
                  {
                    icon: post?.publishedAt ? "mdi:cancel" : "mdi:publish",
                    info: post?.publishedAt ? "Ocultar" : "Publicar",
                    onClick: handlePublishToggle,
                    scale: 0.8,
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}
