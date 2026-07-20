import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { eventService } from "../services/eventService";
import { CloseEventInput } from "../types/eventTypes";

function getErrorMsg(err: any): string {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.details?.length) {
    return data.details.map((d: any) => `${d.campo || d.path}: ${d.mensagem || d.message}`).join("; ");
  }
  return "Erro inesperado. Tente novamente.";
}

export function useEventMutations() {
  const queryClient = useQueryClient();

  const closeEvent = useMutation({
    mutationFn: (data: CloseEventInput) => eventService.create(data),
    onSuccess: () => {
      toast.success("Evento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["eventData"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: any) => {
      toast.error(getErrorMsg(err));
    },
  });

  const assignMember = useMutation({
    mutationFn: ({
      eventId,
      memberId,
      ministryId,
    }: {
      eventId: string;
      memberId: string;
      ministryId?: string;
    }) => eventService.assignMember(eventId, memberId, ministryId),
    onSuccess: () => {
      toast.success("Membro adicionado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(getErrorMsg(err));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eventData"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["membersData"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: ({
      eventId,
      memberId,
      assignmentId,
    }: {
      eventId: string;
      memberId: string;
      assignmentId?: string;
    }) => eventService.removeMember(eventId, memberId, assignmentId),
    onSuccess: () => {
      toast.success("Membro removido com sucesso!");
    },
    onError: (err: any) => {
      toast.error(getErrorMsg(err));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eventData"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["membersData"] });
    },
  });

  return { closeEvent, assignMember, removeMember };
}
