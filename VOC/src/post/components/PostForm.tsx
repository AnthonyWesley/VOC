import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { usePostMutations } from "../hooks/usePostMutations";
import {
  PostCategory,
  PostVisibility,
  CreatePostInput,
} from "../types/postTypes";

import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";

type PostFormProps = {
  post?: any;
  authorId: string;
  initialTitle?: string;
  initialContent?: string;
};

export default function PostForm({
  post,
  authorId,
  initialTitle,
  initialContent,
}: PostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("ANNOUNCEMENT");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");

  const { createPost, updatePost, publishPost, unpublishPost } =
    usePostMutations();

  useEffect(() => {
    if (!post) return;

    setTitle(post.title);
    setContent(post.content);
    setCategory(post.category);
    setVisibility(post.visibility);
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreatePostInput = {
      title,
      content,
      category,
      visibility,
      authorId,
    };

    if (post) {
      updatePost.mutate(
        { ...payload, postId: post.id },
        { onSuccess: () => clearForm() },
      );
    } else {
      createPost.mutate(payload, { onSuccess: () => clearForm() });
    }
  };

  const hasChanges =
    title !== (post?.title ?? "") ||
    content !== (post?.content ?? "") ||
    category !== (post?.category ?? "") ||
    visibility !== (post?.visibility ?? "");

  return (
    <Card className="overflow-hidden p-0">
      <PageHeader
        icon={post ? "mdi:note-edit-outline" : "mdi:note-plus-outline"}
        title={post ? "Editar Publicação" : "Nova Publicação"}
        subtitle="Gerencie anúncios e comunicados"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        {/* VISIBILIDADE */}
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

          {/* CATEGORIA */}
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

        {/* TÍTULO */}
        <FormInput
          label="Título"
          icon="mdi:format-title"
          type="text"
          placeholder="Título do post"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* CONTEÚDO */}
        <FormInput
          label="Conteúdo"
          icon="mdi:text"
          type="textarea"
          rows={5}
          placeholder="Escreva o conteúdo..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* AÇÕES */}
        <div className="mt-4 flex gap-3">
          <FormButton
            type="submit"
            label={post ? "Salvar" : "Criar Post"}
            icon="mdi:content-save"
            isPending={createPost.isPending || updatePost.isPending}
            disabled={!hasChanges}
            className="flex-1"
          />

          {post &&
            (post.publishedAt ? (
              <FormButton
                label="Despublicar"
                icon="mdi:eye-off-outline"
                onClick={() => unpublishPost.mutate({ postId: post.id })}
                className="flex-1 bg-red-600 hover:bg-red-700"
              />
            ) : (
              <FormButton
                label="Publicar"
                icon="mdi:eye-outline"
                onClick={() =>
                  publishPost.mutate({
                    postId: post.id,
                    visibility,
                  })
                }
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              />
            ))}
        </div>
      </form>
    </Card>
  );
}
