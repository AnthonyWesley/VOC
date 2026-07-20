// identity/hooks/useMemberMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { memberService } from "../services/memberService";

export function useMemberMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();

  const createMember = useMutation({
    mutationFn: memberService.create,

    onSuccess: () => {
      toast.success("Membro salvo com sucesso!");
      closeModal();
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["membersData"] });
      queryClient.invalidateQueries({ queryKey: ["memberData"] });
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao criar membro");
    },
  });

  const updateMember = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: any }) =>
      memberService.update(memberId, data),

    onSuccess: () => {
      toast.success("Membro atualizado com sucesso!");
      closeModal();
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["membersData"] });
      queryClient.invalidateQueries({ queryKey: ["memberData"] });
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao atualizar membro");
    },
  });

  return {
    createMember,
    updateMember,
  };
}
