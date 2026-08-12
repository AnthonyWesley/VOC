import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { postService } from "../services/postService";
import {
  CreatePostInput,
  PublishPostInput,
  UpdatePostInput,
} from "../types/postTypes";

export function usePostMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["postsData"] });
    queryClient.invalidateQueries({ queryKey: ["postData"] });
  };

  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => postService.create(data),
    onSuccess: () => {
      toast.success("Post criado com sucesso!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao criar post");
    },
  });

  const updatePost = useMutation({
    mutationFn: (data: UpdatePostInput) => postService.update(data),
    onSuccess: () => {
      toast.success("Post atualizado com sucesso!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar post");
    },
  });

  const publishPost = useMutation({
    mutationFn: (data: PublishPostInput) => postService.publish(data),
    onSuccess: () => {
      toast.success("Post publicado!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao publicar post");
    },
  });

  const archivePost = useMutation({
    mutationFn: (postId: string) => postService.archive(postId),
    onSuccess: () => {
      toast.success("Post arquivado!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao arquivar post");
    },
  });

  const deletePost = useMutation({
    mutationFn: (postId: string) => postService.delete(postId),
    onSuccess: () => {
      toast.success("Post removido!");
    },
    onSettled: invalidate,
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao remover post");
    },
  });

  return {
    createPost,
    updatePost,
    publishPost,
    archivePost,
    deletePost,
  };
}
