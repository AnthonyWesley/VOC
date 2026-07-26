import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { usePostMutations } from "../hooks/usePostMutations";
import {
  PostCategory,
  PostVisibility,
  CreatePostInput,
  PostDetails,
} from "../types/postTypes";

import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import useAuthStatus from "../../auth/hooks/useAuthStatus";

type PostFormProps = {
  post?: PostDetails;
  initialTitle?: string;
  initialContent?: string;
};

export default function PostForm({
  post,
  initialTitle,
  initialContent,
}: PostFormProps) {
  const { authUserId } = useAuthStatus();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("ANNOUNCEMENT");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [imageUrl, setImageUrl] = useState("");

  const { createPost, updatePost } = usePostMutations();

  useEffect(() => {
    if (!post) return;
    setTitle(post.title);
    setContent(post.content);
    setCategory(post.category);
    setVisibility(post.visibility);
    setImageUrl(post.imageUrl ?? "");
  }, [post]);

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
    if (initialContent) setContent(initialContent);
  }, [initialTitle, initialContent]);

  const clearForm = () => {
    if (!post) {
      setTitle("");
      setContent("");
      setCategory("ANNOUNCEMENT");
      setVisibility("PUBLIC");
      setImageUrl("");
    }
  };

  const mapFormToPayload = (): CreatePostInput => ({
    title,
    content,
    category,
    visibility,
    imageUrl: imageUrl || undefined,
    authorId: authUserId ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (post) {
      updatePost.mutate(
        { ...mapFormToPayload(), postId: post.id },
        { onSuccess: () => clearForm() },
      );
    } else {
      createPost.mutate(mapFormToPayload(), { onSuccess: () => clearForm() });
    }
  };

  const hasChanges =
    title !== (post?.title ?? "") ||
    content !== (post?.content ?? "") ||
    category !== (post?.category ?? "") ||
    visibility !== (post?.visibility ?? "") ||
    imageUrl !== (post?.imageUrl ?? "");

  return (
    <Card className="overflow-hidden p-0">
      <PageHeader
        icon={post ? "mdi:note-edit-outline" : "mdi:note-plus-outline"}
        title={post ? "Editar Publicação" : "Nova Publicação"}
        subtitle="Gerencie anúncios e comunicados"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <section className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <FormInput
            label="Visibilidade"
            icon="mdi:earth"
            type="select"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            options={Object.values(PostVisibility).map((v) => ({
              label: v,
              value: v,
            }))}
          />

          <FormInput
            label="Categoria"
            icon="mdi:tag-outline"
            type="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
            options={Object.values(PostCategory).map((c) => ({
              label: c,
              value: c,
            }))}
          />
        </section>

        <FormInput
          label="Título"
          icon="mdi:format-title"
          type="text"
          placeholder="Título do post"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <FormInput
          label="Conteúdo"
          icon="mdi:text"
          type="textarea"
          rows={5}
          placeholder="Escreva o conteúdo..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <FormInput
          label="URL da Imagem"
          icon="mdi:image-outline"
          type="text"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div className="mt-4 flex gap-3">
          <FormButton
            type="submit"
            label={post ? "Salvar" : "Criar Post"}
            icon="mdi:content-save"
            isPending={createPost.isPending || updatePost.isPending}
            disabled={!hasChanges}
            className="flex-1"
          />
        </div>
      </form>
    </Card>
  );
}
