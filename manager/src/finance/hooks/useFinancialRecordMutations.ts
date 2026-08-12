import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { financialRecordsService } from "../services/financialRecordsService";

export function useFinancialRecordMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["financialRecords"] });
    queryClient.invalidateQueries({ queryKey: ["eventData"] });
    queryClient.invalidateQueries({ queryKey: ["financialRecord"] });
  };

  const createFinancialRecord = useMutation({
    mutationFn: financialRecordsService.create,
    onSuccess: () => {
      toast.success("Registro financeiro criado com sucesso!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Erro ao criar registro financeiro",
      );
    },
  });

  const updateFinancialRecord = useMutation({
    mutationFn: ({
      financialRecordId,
      data,
    }: {
      financialRecordId: string;
      data: any;
    }) => financialRecordsService.update(financialRecordId, data),
    onSuccess: () => {
      toast.success("Registro financeiro atualizado!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Erro ao atualizar registro",
      );
    },
  });

  const cancelFinancialRecord = useMutation({
    mutationFn: ({
      financialRecordId,
      reason,
    }: {
      financialRecordId: string;
      reason: string;
    }) => financialRecordsService.cancel(financialRecordId, reason),
    onSuccess: () => {
      toast.success("Registro cancelado com sucesso!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao cancelar registro");
    },
  });

  const reverseFinancialRecord = useMutation({
    mutationFn: ({
      financialRecordId,
      reason,
    }: {
      financialRecordId: string;
      reason: string;
    }) => financialRecordsService.reverse(financialRecordId, reason),
    onSuccess: () => {
      toast.success("Registro estornado com sucesso!");
      closeModal();
    },
    onSettled: invalidate,
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao estornar registro");
    },
  });

  return {
    createFinancialRecord,
    updateFinancialRecord,
    cancelFinancialRecord,
    reverseFinancialRecord,
  };
}
