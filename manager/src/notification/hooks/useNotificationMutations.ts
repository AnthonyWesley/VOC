import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { notificationService } from "../services/notificationService";

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationService.read(id),
    onError: (err: any) =>
      toast.error(
        err.response?.data?.error || "Erro ao marcar notificação como lida",
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsData"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationService.readAll(),
    onError: (err: any) =>
      toast.error(
        err.response?.data?.error || "Erro ao marcar notificações como lidas",
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsData"] });
    },
  });

  return {
    markAsRead,
    markAllAsRead,
  };
}
