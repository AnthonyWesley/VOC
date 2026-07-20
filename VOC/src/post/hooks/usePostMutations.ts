import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { postService } from "../services/postService";
import {
  CreatePostInput,
  PublishPostInput,
  UnpublishPostInput,
  UpdatePostInput,
} from "../types/postTypes";

export function usePostMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();

  // CREATE
  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => postService.create(data),
    onSuccess: () => {
      toast.success("Post criado com sucesso!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["postsData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao criar post");
    },
  });

  // UPDATE
  const updatePost = useMutation({
    mutationFn: (data: UpdatePostInput) => postService.update(data),
    onSuccess: () => {
      toast.success("Post atualizado com sucesso!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["postsData"] });
      queryClient.invalidateQueries({ queryKey: ["postData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar post");
    },
  });

  // PUBLISH
  const publishPost = useMutation({
    mutationFn: (data: PublishPostInput) => postService.publish(data),
    onSuccess: () => {
      toast.success("Post publicado!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["postsData"] });
      queryClient.invalidateQueries({ queryKey: ["postData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao publicar post");
    },
  });

  // UNPUBLISH
  const unpublishPost = useMutation({
    mutationFn: (data: UnpublishPostInput) => postService.unpublish(data),
    onSuccess: () => {
      toast.success("Post despublicado!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["postsData"] });
      queryClient.invalidateQueries({ queryKey: ["postData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao despublicar post");
    },
  });

  return {
    createPost,
    updatePost,
    publishPost,
    unpublishPost,
  };
}
