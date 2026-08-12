// identity/hooks/useMemberMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { ministriesService } from "../services/ministriesService";

export function useMinistryMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();

  const createMember = useMutation({
    mutationFn: ministriesService.create,

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
      ministriesService.update(memberId, data),

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

  const assignMember = useMutation({
    mutationFn: ({
      ministryId,
      memberId,
    }: {
      ministryId: string;
      memberId: string;
    }) => ministriesService.assignMember(ministryId, memberId),
    onSuccess: () => {
      toast.success("Membro adicionados com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao adicionar membro ao ministério");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["membersData"] });
      queryClient.invalidateQueries({ queryKey: ["memberData"] });
      queryClient.invalidateQueries({ queryKey: ["ministriesData"] });
      queryClient.invalidateQueries({ queryKey: ["ministryData"] });
      queryClient.invalidateQueries({ queryKey: ["membersData"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: ({
      ministryId,
      memberId,
    }: {
      ministryId: string;
      memberId: string;
    }) => ministriesService.removeMember(ministryId, memberId),
    onSuccess: () => {
      toast.success("Membro removido com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao remover membro do ministério");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ministriesData"] });
      queryClient.invalidateQueries({ queryKey: ["ministryData"] });
      queryClient.invalidateQueries({ queryKey: ["membersData"] });
    },
  });

  return {
    createMember,
    updateMember,
    assignMember,
    removeMember,
  };
}
