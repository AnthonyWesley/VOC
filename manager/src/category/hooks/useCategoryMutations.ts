// categories/hooks/useCategoryMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { categoriesService } from "../services/categoriesService";

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();

  const upsertCategory = useMutation({
    mutationFn: (data: any) => categoriesService.upsert(data),

    onSuccess: () => {
      toast.success("Categoria salva com sucesso!");
      closeModal();
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao salvar categoria");
    },
  });

  return {
    upsertCategory,
  };
}
